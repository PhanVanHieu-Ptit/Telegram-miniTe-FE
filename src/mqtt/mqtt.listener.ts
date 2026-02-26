import type { Message } from "@/lib/types";
import { useChatStore } from "@/lib/store";
import type { AppMqttClient, MqttMessage } from "./mqtt.client";

interface SeenEvent {
    conversationId: string;
    messageId: string;
    userId: string;
    timestamp: string;
}

interface OnlineEvent {
    userId: string;
    online: boolean;
    timestamp: string;
}

interface TypingEvent {
    conversationId: string;
    userId: string;
    isTyping: boolean;
    timestamp: string;
}

const TYPING_TIMEOUT_MS = 3_000;

/**
 * Subscribe to message events for a specific conversation
 */
export async function subscribeToMessages(
    client: AppMqttClient,
    conversationId: string
): Promise<void> {
    await client.subscribe(`chat/${conversationId}/message`);
}

/**
 * Subscribe to typing events for a specific conversation
 */
export async function subscribeToTyping(
    client: AppMqttClient,
    conversationId: string
): Promise<void> {
    await client.subscribe(`chat/${conversationId}/typing`);
}

/**
 * Subscribe to seen events for a specific conversation
 */
export async function subscribeToSeen(
    client: AppMqttClient,
    conversationId: string
): Promise<void> {
    await client.subscribe(`chat/${conversationId}/seen`);
}

/**
 * Subscribe to online status events for a specific user
 */
export async function subscribeToOnlineStatus(
    client: AppMqttClient,
    userId: string
): Promise<void> {
    await client.subscribe(`user/${userId}/online`);
}

/**
 * Subscribe to all topics for a conversation
 */
export async function subscribeToConversation(
    client: AppMqttClient,
    conversationId: string
): Promise<void> {
    await Promise.all([
        subscribeToMessages(client, conversationId),
        subscribeToTyping(client, conversationId),
        subscribeToSeen(client, conversationId),
    ]);
}

/**
 * Unsubscribe from all topics for a conversation
 */
export async function unsubscribeFromConversation(
    client: AppMqttClient,
    conversationId: string
): Promise<void> {
    await client.unsubscribe([
        `chat/${conversationId}/message`,
        `chat/${conversationId}/typing`,
        `chat/${conversationId}/seen`,
    ]);
}

/**
 * Setup MQTT message handlers to update Zustand store
 */
export function setupMqttListeners(client: AppMqttClient): () => void {
    const typingTimers = new Map<string, ReturnType<typeof setTimeout>>();

    const typingKey = (conversationId: string, userId: string) => `${conversationId}::${userId}`;

    const clearTypingTimer = (conversationId: string, userId: string) => {
        const key = typingKey(conversationId, userId);
        const timer = typingTimers.get(key);
        if (timer) {
            clearTimeout(timer);
            typingTimers.delete(key);
        }
    };

    const scheduleTypingClear = (conversationId: string, userId: string) => {
        clearTypingTimer(conversationId, userId);
        const key = typingKey(conversationId, userId);
        const timer = setTimeout(() => {
            useChatStore.getState().removeTypingUser(conversationId, userId);
            typingTimers.delete(key);
        }, TYPING_TIMEOUT_MS);
        typingTimers.set(key, timer);
    };

    const unsubscribe = client.onMessage((message: MqttMessage) => {
        const { topic, payload } = message;

        if (!payload) return;

        // Handle message events: chat/{conversationId}/message
        if (topic.includes("/message")) {
            const messageData = payload as Message;
            useChatStore
                .getState()
                .addMessage(messageData.conversationId, messageData);
            return;
        }

        // Handle typing events: chat/{conversationId}/typing
        if (topic.includes("/typing")) {
            const typingData = payload as TypingEvent;
            const { conversationId, userId, isTyping } = typingData;

            if (isTyping) {
                useChatStore.getState().setTypingUser(conversationId, userId);
                scheduleTypingClear(conversationId, userId);
            } else {
                useChatStore.getState().removeTypingUser(conversationId, userId);
                clearTypingTimer(conversationId, userId);
            }
            return;
        }

        // Handle seen events: chat/{conversationId}/seen
        if (topic.includes("/seen")) {
            const seenData = payload as SeenEvent;
            useChatStore
                .getState()
                .markMessageSeen(seenData.conversationId, seenData.messageId, seenData.userId);
            return;
        }

        // Handle online status events: user/{userId}/online
        if (topic.includes("/online")) {
            const onlineData = payload as OnlineEvent;
            const currentOnlineUsers = useChatStore.getState().onlineUsers;

            if (onlineData.online) {
                // Add user to online list if not already present
                if (!currentOnlineUsers.includes(onlineData.userId)) {
                    useChatStore
                        .getState()
                        .setOnlineUsers([...currentOnlineUsers, onlineData.userId]);
                }
            } else {
                // Remove user from online list
                useChatStore
                    .getState()
                    .setOnlineUsers(
                        currentOnlineUsers.filter((id: string) => id !== onlineData.userId)
                    );
            }
        }
    });

    return () => {
        typingTimers.forEach((timer) => clearTimeout(timer));
        typingTimers.clear();
        unsubscribe();
    };
}