import { MessageStatus } from "@/types/chat.types";
import type { Message } from "@/lib/types";
import {
    getMqttClient,
    type ConnectionStatus,
    type MqttConnectionOptions,
    type TelegramMqttClient,
} from "@/lib/mqtt-client";

const TOPICS = {
    messageNew: (id: string) => `conversation/${id}/message/new` as const,
    typing: (id: string) => `conversation/${id}/typing` as const,
    seen: (id: string) => `conversation/${id}/seen` as const,
    online: "presence/online" as const,
} as const;

interface MessageNewPayload {
    id: string;
    conversationId: string;
    senderId: string;
    text: string;
    timestamp: string;
    seenBy?: string[];
    read?: boolean;
}

interface TypingPayload {
    conversationId: string;
    userId: string;
    active: boolean;
}

interface SeenPayload {
    conversationId: string;
    userId: string;
}

interface OnlinePayload {
    userIds: string[];
}

export interface ChatRealtimeCallbacks {
    onMessage?: (message: Message) => void;
    onTyping?: (conversationId: string, userId: string, active: boolean) => void;
    onSeen?: (conversationId: string, userId: string) => void;
    onOnline?: (userIds: string[]) => void;
    onStatus?: (status: ConnectionStatus, error?: Error) => void;
}

const MESSAGE_RE = /^conversation\/([^/]+)\/message\/new$/;
const TYPING_RE = /^conversation\/([^/]+)\/typing$/;
const SEEN_RE = /^conversation\/([^/]+)\/seen$/;

const TYPING_TIMEOUT_MS = 3_000;

function safeParse<T>(buffer: Buffer): T | null {
    try {
        return JSON.parse(buffer.toString("utf-8")) as T;
    } catch {
        return null;
    }
}

export class ChatRealtimeService {
    private client: TelegramMqttClient;
    private callbacks: ChatRealtimeCallbacks;
    private unsubMessage: (() => void) | null = null;
    private unsubStatus: (() => void) | null = null;
    private subscribedIds = new Set<string>();
    private typingTimers = new Map<string, ReturnType<typeof setTimeout>>();
    private started = false;

    constructor(options: MqttConnectionOptions, callbacks: ChatRealtimeCallbacks) {
        this.client = getMqttClient(options);
        this.callbacks = callbacks;
    }

    updateCallbacks(callbacks: ChatRealtimeCallbacks): void {
        this.callbacks = callbacks;
    }

    get status(): ConnectionStatus {
        return this.client.status;
    }

    async start(): Promise<void> {
        if (this.started) return;
        await this.client.connect();
        this.bind();
        await this.client.subscribe(TOPICS.online, { qos: 1 });
        this.started = true;
    }

    async stop(): Promise<void> {
        this.clearAllTimers();
        this.unbind();
        await this.client.disconnect();
        this.subscribedIds.clear();
        this.started = false;
    }

    async subscribeConversation(conversationId: string): Promise<void> {
        await this.start();
        if (this.subscribedIds.has(conversationId)) return;
        await this.client.subscribe([
            TOPICS.messageNew(conversationId),
            TOPICS.typing(conversationId),
            TOPICS.seen(conversationId),
        ]);
        this.subscribedIds.add(conversationId);
    }

    async unsubscribeConversation(conversationId: string): Promise<void> {
        if (!this.subscribedIds.has(conversationId)) return;
        await this.client.unsubscribe([
            TOPICS.messageNew(conversationId),
            TOPICS.typing(conversationId),
            TOPICS.seen(conversationId),
        ]);
        this.subscribedIds.delete(conversationId);
    }

    async publishMessage(conversationId: string, message: Message): Promise<void> {
        await this.start();
        const payload: MessageNewPayload = {
            id: message.id,
            conversationId: message.conversationId,
            senderId: message.senderId,
            text: message.text,
            timestamp: message.timestamp,
            seenBy: message.seenBy,
            read: message.read ?? false,
        };
        await this.client.publish(TOPICS.messageNew(conversationId), payload);
    }

    async publishTyping(
        conversationId: string,
        userId: string,
        active: boolean,
    ): Promise<void> {
        await this.start();
        const payload: TypingPayload = {
            conversationId,
            userId,
            active,
        };
        await this.client.publish(TOPICS.typing(conversationId), payload, {
            qos: 0,
            retain: false,
        });
    }

    async publishSeen(conversationId: string, userId: string): Promise<void> {
        await this.start();
        const payload: SeenPayload = {
            conversationId,
            userId,
        };
        await this.client.publish(TOPICS.seen(conversationId), payload, {
            qos: 0,
            retain: false,
        });
    }

    private bind(): void {
        if (this.unsubMessage || this.unsubStatus) return;
        this.unsubMessage = this.client.onMessage(this.onMessage);
        this.unsubStatus = this.client.onStatusChange(this.onStatus);
    }

    private unbind(): void {
        this.unsubMessage?.();
        this.unsubStatus?.();
        this.unsubMessage = null;
        this.unsubStatus = null;
    }

    private onMessage = (topic: string, payload: Buffer): void => {
        const msgMatch = MESSAGE_RE.exec(topic);
        if (msgMatch) {
            const data = safeParse<MessageNewPayload>(payload);
            if (!data) return;
            const message: Message = {
                id: data.id,
                conversationId: data.conversationId,
                senderId: data.senderId,
                text: data.text,
                timestamp: data.timestamp,
                status: MessageStatus.Sent,
                seenBy: data.seenBy,
                read: data.read,
            };
            this.callbacks.onMessage?.(message);
            return;
        }

        const typingMatch = TYPING_RE.exec(topic);
        if (typingMatch) {
            const data = safeParse<TypingPayload>(payload);
            if (!data) return;
            if (data.active) {
                this.callbacks.onTyping?.(data.conversationId, data.userId, true);
                this.scheduleTypingClear(data.conversationId, data.userId);
            } else {
                this.callbacks.onTyping?.(data.conversationId, data.userId, false);
                this.clearTimer(data.conversationId, data.userId);
            }
            return;
        }

        const seenMatch = SEEN_RE.exec(topic);
        if (seenMatch) {
            const data = safeParse<SeenPayload>(payload);
            if (!data) return;
            this.callbacks.onSeen?.(data.conversationId, data.userId);
            return;
        }

        if (topic === TOPICS.online) {
            const data = safeParse<OnlinePayload>(payload);
            if (data) this.callbacks.onOnline?.(data.userIds);
        }
    };

    private onStatus = (status: ConnectionStatus, error?: Error): void => {
        this.callbacks.onStatus?.(status, error);
        if (status === "connected" && this.subscribedIds.size > 0) {
            void this.resubscribeAll();
        }
    };

    private async resubscribeAll(): Promise<void> {
        const ids = [...this.subscribedIds];
        this.subscribedIds.clear();
        await this.client.subscribe(TOPICS.online, { qos: 1 });
        await Promise.all(ids.map((id) => this.subscribeConversation(id)));
    }

    private scheduleTypingClear(conversationId: string, userId: string): void {
        this.clearTimer(conversationId, userId);
        const key = this.timerKey(conversationId, userId);
        const timer = setTimeout(() => {
            this.callbacks.onTyping?.(conversationId, userId, false);
            this.typingTimers.delete(key);
        }, TYPING_TIMEOUT_MS);
        this.typingTimers.set(key, timer);
    }

    private clearTimer(conversationId: string, userId: string): void {
        const key = this.timerKey(conversationId, userId);
        const timer = this.typingTimers.get(key);
        if (timer) {
            clearTimeout(timer);
            this.typingTimers.delete(key);
        }
    }

    private clearAllTimers(): void {
        this.typingTimers.forEach((timer) => clearTimeout(timer));
        this.typingTimers.clear();
    }

    private timerKey(conversationId: string, userId: string): string {
        return `${conversationId}::${userId}`;
    }
}

let instance: ChatRealtimeService | null = null;

export function getChatRealtimeService(
    options: MqttConnectionOptions,
    callbacks: ChatRealtimeCallbacks,
): ChatRealtimeService {
    if (!instance) {
        instance = new ChatRealtimeService(options, callbacks);
        return instance;
    }

    instance.updateCallbacks(callbacks);
    return instance;
}

export function destroyChatRealtimeService(): void {
    if (instance) {
        void instance.stop();
        instance = null;
    }
}
