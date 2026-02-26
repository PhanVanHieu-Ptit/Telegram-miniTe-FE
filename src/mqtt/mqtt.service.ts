import type { Message } from "@/types/chat.types";
import { useChatStore } from "@/store/chat.store";
import { usePresenceStore } from "@/store/presence.store";
import type { AppMqttClient, MqttMessage } from "./mqtt.client";

interface OnlineEvent {
    userId: string;
    online: boolean;
    timestamp: string;
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
 * Subscribe to all topics for a conversation
 */
export async function subscribeToConversation(
    client: AppMqttClient,
    conversationId: string
): Promise<void> {
    await subscribeToMessages(client, conversationId);
}

/**
 * Unsubscribe from all topics for a conversation
 */
export async function unsubscribeFromConversation(
    client: AppMqttClient,
    conversationId: string
): Promise<void> {
    await client.unsubscribe([`chat/${conversationId}/message`]);
}

/**
 * Setup MQTT message handlers to update Zustand stores
 */
export function setupMqttListeners(client: AppMqttClient): () => void {
    const unsubscribe = client.onMessage((message: MqttMessage) => {
        const { topic, payload } = message;

        if (!payload) return;

        // Handle message events: chat/{conversationId}/message
        if (topic.includes("/message")) {
            const messageData = payload as Message;
            useChatStore.getState().addMessage(messageData);
            return;
        }

        // Handle online status events: user/{userId}/online
        if (topic.includes("/online")) {
            const onlineData = payload as OnlineEvent;
            usePresenceStore
                .getState()
                .updateOnline(onlineData.userId, onlineData.online);
        }
    });

    return () => {
        unsubscribe();
    };
}
