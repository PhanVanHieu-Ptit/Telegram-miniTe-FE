import type { Packet } from "mqtt";
import type { Message } from "./types";
import {
  TelegramMqttClient,
  type MqttConnectionOptions,
  type ConnectionStatus,
  getMqttClient,
} from "./mqtt-client";
import { useChatStore } from "./store";

// ---------------------------------------------------------------------------
// Topic schema
// ---------------------------------------------------------------------------

const TOPICS = {
  messageNew: (id: string) => `conversation/${id}/message/new` as const,
  typing: (id: string) => `conversation/${id}/typing` as const,
  seen: (id: string) => `conversation/${id}/seen` as const,
  online: "presence/online" as const,
} as const;

// ---------------------------------------------------------------------------
// Payload contracts
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function safeParse<T>(buffer: Buffer): T | null {
  try {
    return JSON.parse(buffer.toString("utf-8")) as T;
  } catch {
    return null;
  }
}

const MESSAGE_RE = /^conversation\/([^/]+)\/message\/new$/;
const TYPING_RE = /^conversation\/([^/]+)\/typing$/;
const SEEN_RE = /^conversation\/([^/]+)\/seen$/;

// ---------------------------------------------------------------------------
// Bridge — routes MQTT events into Zustand store
// ---------------------------------------------------------------------------

export class MqttStoreBridge {
  private client: TelegramMqttClient;
  private unsubMessage: (() => void) | null = null;
  private unsubStatus: (() => void) | null = null;
  private subscribedIds = new Set<string>();
  private typingTimers = new Map<string, ReturnType<typeof setTimeout>>();

  private static readonly TYPING_TIMEOUT_MS = 3_000;

  constructor(options: MqttConnectionOptions) {
    this.client = getMqttClient(options);
  }

  // ── Lifecycle ─────────────────────────────────────────────────────

  async start(): Promise<void> {
    await this.client.connect();
    this.bind();
    await this.client.subscribe(TOPICS.online, { qos: 1 });
    await this.subscribeAllConversations();
  }

  async stop(): Promise<void> {
    this.clearAllTimers();
    this.unbind();
    await this.client.disconnect();
    this.subscribedIds.clear();
  }

  get status(): ConnectionStatus {
    return this.client.status;
  }

  get mqtt(): TelegramMqttClient {
    return this.client;
  }

  // ── Subscription management ───────────────────────────────────────

  async subscribeConversation(conversationId: string): Promise<void> {
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

  // ── Outbound publish helpers ──────────────────────────────────────

  async publishMessage(conversationId: string, message: Message): Promise<void> {
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

  async publishTyping(conversationId: string, active: boolean): Promise<void> {
    const payload: TypingPayload = {
      conversationId,
      userId: useChatStore.getState().currentUserId,
      active,
    };
    await this.client.publish(TOPICS.typing(conversationId), payload, {
      qos: 0,
      retain: false,
    });
  }

  async publishSeen(conversationId: string): Promise<void> {
    const payload: SeenPayload = {
      conversationId,
      userId: useChatStore.getState().currentUserId,
    };
    await this.client.publish(TOPICS.seen(conversationId), payload, {
      qos: 0,
      retain: false,
    });
  }

  // ── Private: listeners ────────────────────────────────────────────

  private bind(): void {
    this.unsubMessage = this.client.onMessage(this.onMessage);
    this.unsubStatus = this.client.onStatusChange(this.onStatus);
  }

  private unbind(): void {
    this.unsubMessage?.();
    this.unsubStatus?.();
    this.unsubMessage = null;
    this.unsubStatus = null;
  }

  private onMessage = (topic: string, payload: Buffer, _packet: Packet): void => {
    const store = useChatStore.getState;

    // ── message:new ──
    const msgMatch = MESSAGE_RE.exec(topic);
    if (msgMatch) {
      const data = safeParse<MessageNewPayload>(payload);
      if (!data) return;
      const msg: Message = {
        id: data.id,
        conversationId: data.conversationId,
        senderId: data.senderId,
        text: data.text,
        timestamp: data.timestamp,
        seenBy: data.seenBy,
        read: data.read,
      };
      store().addMessage(msgMatch[1], msg);
      return;
    }

    // ── typing ──
    const typingMatch = TYPING_RE.exec(topic);
    if (typingMatch) {
      const data = safeParse<TypingPayload>(payload);
      if (!data || data.userId === store().currentUserId) return;

      const convoId = typingMatch[1];
      if (data.active) {
        store().setTypingUser(convoId, data.userId);
        this.scheduleTypingClear(convoId, data.userId);
      } else {
        store().removeTypingUser(convoId, data.userId);
        this.clearTimer(convoId, data.userId);
      }
      return;
    }

    // ── seen ──
    const seenMatch = SEEN_RE.exec(topic);
    if (seenMatch) {
      const data = safeParse<SeenPayload>(payload);
      if (!data) return;
      store().markConversationSeenBy(seenMatch[1], data.userId);
      return;
    }

    // ── online presence ──
    if (topic === TOPICS.online) {
      const data = safeParse<OnlinePayload>(payload);
      if (data) store().setOnlineUsers(data.userIds);
    }
  };

  private onStatus = (status: ConnectionStatus): void => {
    if (status === "connected" && this.subscribedIds.size > 0) {
      void this.resubscribeAll();
    }
  };

  // ── Private: subscriptions ────────────────────────────────────────

  private async subscribeAllConversations(): Promise<void> {
    const { conversations } = useChatStore.getState();
    await Promise.all(conversations.map((c) => this.subscribeConversation(c.id)));
  }

  private async resubscribeAll(): Promise<void> {
    const ids = [...this.subscribedIds];
    this.subscribedIds.clear();
    await this.client.subscribe(TOPICS.online, { qos: 1 });
    await Promise.all(ids.map((id) => this.subscribeConversation(id)));
  }

  // ── Private: typing auto‑clear ────────────────────────────────────

  private timerKey(convoId: string, userId: string): string {
    return `${convoId}::${userId}`;
  }

  private scheduleTypingClear(convoId: string, userId: string): void {
    this.clearTimer(convoId, userId);
    const key = this.timerKey(convoId, userId);
    const t = setTimeout(() => {
      useChatStore.getState().removeTypingUser(convoId, userId);
      this.typingTimers.delete(key);
    }, MqttStoreBridge.TYPING_TIMEOUT_MS);
    this.typingTimers.set(key, t);
  }

  private clearTimer(convoId: string, userId: string): void {
    const key = this.timerKey(convoId, userId);
    const t = this.typingTimers.get(key);
    if (t) {
      clearTimeout(t);
      this.typingTimers.delete(key);
    }
  }

  private clearAllTimers(): void {
    this.typingTimers.forEach((t) => clearTimeout(t));
    this.typingTimers.clear();
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

let instance: MqttStoreBridge | null = null;

export function getMqttBridge(options: MqttConnectionOptions): MqttStoreBridge {
  if (!instance) instance = new MqttStoreBridge(options);
  return instance;
}

export function destroyMqttBridge(): void {
  if (instance) {
    void instance.stop();
    instance = null;
  }
}
