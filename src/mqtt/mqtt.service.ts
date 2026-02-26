import type { Message, MessageStatus } from "@/types/chat.types";
import { useChatStore } from "@/store/chat.store";
import { usePresenceStore } from "@/store/presence.store";
import type { AppMqttClient, MqttMessage } from "./mqtt.client";

interface OnlineEvent {
    userId: string;
    online: boolean;
    timestamp: string;
}

interface MessageStatusEvent {
    messageId: string;
    status: MessageStatus;
    timestamp: string;
}

interface TypingEvent {
    userId: string;
    typing: boolean;
}

interface SeenEvent {
    lastMessageId: string;
}

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
 * Subscribe to online status events for a specific user
 */
export async function subscribeToOnlineStatus(
    client: AppMqttClient,
    userId: string
): Promise<void> {
    await client.subscribe(`user/${userId}/online`);
}

/**
 * Subscribe to message status updates for a specific message
 */
export async function subscribeToMessageStatus(
    client: AppMqttClient,
    messageId: string
): Promise<void> {
    await client.subscribe(`message/${messageId}/status`);
}

/**
 * Publish delivered status for a received message
 */
export async function publishMessageDelivered(
    client: AppMqttClient,
    messageId: string
): Promise<void> {
    await client.publish(`message/${messageId}/delivered`, {});
}

/**
 * Publish seen status for a conversation
 */
export async function publishConversationSeen(
    client: AppMqttClient,
    conversationId: string,
    lastMessageId: string
): Promise<void> {
    const payload: SeenEvent = { lastMessageId };
    await client.publish(`chat/${conversationId}/seen`, payload);
}

/**
 * Subscribe to seen updates for a specific conversation
 */
export async function subscribeToConversationSeen(
    client: AppMqttClient,
    conversationId: string
): Promise<void> {
    await client.subscribe(`chat/${conversationId}/seen`);
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
 * Publish typing status for a conversation
 */
export async function publishTyping(
    client: AppMqttClient,
    conversationId: string,
    userId: string,
    typing: boolean
): Promise<void> {
    const payload = { userId, typing };
    await client.publish(`chat/${conversationId}/typing`, payload);
}

/**
 * Subscribe to all topics for a conversation
 */
export async function subscribeToConversation(
    client: AppMqttClient,
    conversationId: string
): Promise<void> {
    await subscribeToMessages(client, conversationId);
    await subscribeToTyping(client, conversationId);
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
    ]);
}

/**
 * Setup MQTT message handlers to update Zustand stores
 */
export function setupMqttListeners(client: AppMqttClient): () => void {
    const unsubscribe = client.onMessage((message: MqttMessage) => {
        const { topic, payload } = message;

        if (!payload) return;

        // Handle message events: chat/{conversationId}/message
        if (topic.includes("/message") && !topic.includes("/status") && !topic.includes("/delivered")) {
            const messageData = payload as Message;
            useChatStore.getState().addMessage(messageData);

            // Auto-publish delivered status and subscribe to message status
            publishMessageDelivered(client, messageData.id).catch((err) => {
                console.error("Failed to publish delivered status:", err);
            });

            subscribeToMessageStatus(client, messageData.id).catch((err) => {
                console.error("Failed to subscribe to message status:", err);
            });
            return;
        }

        // Handle message status events: message/{messageId}/status
        if (topic.includes("/status")) {
            const statusData = payload as MessageStatusEvent;
            useChatStore.getState().updateMessageStatus(statusData.messageId, statusData.status);
            return;
        }

        // Handle online status events: user/{userId}/online
        if (topic.includes("/online")) {
            const onlineData = payload as OnlineEvent;
            usePresenceStore
                .getState()
                .updateOnline(onlineData.userId, onlineData.online);
            return;
        }

        // Handle seen update events: chat/{conversationId}/seen-update
        if (topic.includes("/seen-update")) {
            const seenData = payload as SeenEvent;
            useChatStore.getState().updateMessageStatus(seenData.lastMessageId, "seen");
        }

        // Handle typing events: chat/{conversationId}/typing
        if (topic.includes("/typing")) {
            const typingData = payload as TypingEvent;
            const conversationIdMatch = topic.match(/chat\/([^/]+)\/typing/);
            if (conversationIdMatch) {
                const conversationId = conversationIdMatch[1];
                if (typingData.typing) {
                    useChatStore.getState().setTypingUser(conversationId, typingData.userId);
                } else {
                    useChatStore.getState().removeTypingUser(conversationId, typingData.userId);
                }
            }
        }
    });

    return () => {
        unsubscribe();
    };
}

