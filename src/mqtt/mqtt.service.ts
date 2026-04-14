import type { Message, MessageStatus } from "@/types/chat.types";
import { useChatStore } from "@/store/chat.store";
import { useAuthStore } from "@/store/auth.store";
import { usePresenceStore } from "@/store/presence.store";
import type { AppMqttClient, MqttMessage } from "./mqtt.client";
import { playMessageSound } from "@/lib/notification-sound";

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
    await client.subscribe([`user/${userId}/online`, `user/${userId}/events`]);
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
        if (topic.match(/^chat\/[^/]+\/message$/)) {
            const messageData = payload as Message;
            const store = useChatStore.getState();

            // Deduplicate: skip if message already exists (e.g. sender already
            // added it via the optimistic → API-response flow)
            if (store.messages.some((m) => m.id === messageData.id)) {
                // Still update sidebar lastMessage even for own messages
                store.updateConversationLastMessage(messageData.conversationId, messageData);
                return;
            }

            // Only add to the messages list if it belongs to the active conversation
            if (messageData.conversationId === store.activeConversationId) {
                store.addMessage(messageData);
            }

            // Always update the sidebar's lastMessage preview
            store.updateConversationLastMessage(messageData.conversationId, messageData);

            // Play notification sound for messages from other users
            const currentUserId = useAuthStore.getState().user?.id;
            if (messageData.senderId !== currentUserId) {
                playMessageSound();
            }

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
        if (topic.match(/^message\/[^/]+\/status$/)) {
            const statusData = payload as MessageStatusEvent;
            useChatStore.getState().updateMessageStatus(statusData.messageId, statusData.status);
            return;
        }

        // Handle online status events: user/{userId}/online
        if (topic.match(/^user\/[^/]+\/online$/)) {
            const onlineData = payload as OnlineEvent;
            usePresenceStore
                .getState()
                .updateOnline(onlineData.userId, onlineData.online);
            return;
        }

        // Handle seen update events: chat/{conversationId}/seen
        if (topic.match(/^chat\/[^/]+\/seen$/)) {
            const seenData = payload as SeenEvent;
            useChatStore.getState().updateMessageStatus(seenData.lastMessageId, "seen");
            return;
        }

        // Handle typing events: chat/{conversationId}/typing
        if (topic.match(/^chat\/[^/]+\/typing$/)) {
            const typingData = payload as TypingEvent;
            const conversationIdMatch = topic.match(/^chat\/([^/]+)\/typing$/);
            if (conversationIdMatch) {
                const conversationId = conversationIdMatch[1];
                if (typingData.typing) {
                    useChatStore.getState().setTypingUser(conversationId, typingData.userId);
                } else {
                    useChatStore.getState().removeTypingUser(conversationId, typingData.userId);
                }
            }
            return;
        }

        // Handle system events: user/{userId}/events
        if (topic.match(/^user\/[^/]+\/events$/)) {
            const eventData = payload as any;
            if (eventData?.type === 'CONVERSATION_UPDATED') {
                const store = useChatStore.getState();
                const conversationId = eventData.conversationId;
                
                // Fetch conversations to ensure we have the newly created conversation in the UI list
                if (!store.conversations.some(c => c.id === conversationId)) {
                    store.fetchConversations().then(() => {
                        // Subscribe to the new conversation's events after list is updated
                        subscribeToConversation(client, conversationId).catch(console.error);
                    }).catch(console.error);
                } else {
                    // Just update its presence
                    subscribeToConversation(client, conversationId).catch(console.error);
                }
            } else if (eventData?.type === 'CONVERSATION_DELETED') {
                const store = useChatStore.getState();
                const conversationId = eventData.conversationId;
                
                // If it's the active conversation, clear it
                if (store.activeConversationId === conversationId) {
                    store.setActiveConversationId(null);
                }
                
                // Update local state by re-fetching conversations or manually filtering
                // Manually filtering is faster if we just want to remove one item
                const updatedConversations = store.conversations.filter(c => c.id !== conversationId);
                useChatStore.setState({ conversations: updatedConversations });
                
                // Unsubscribe from its events
                unsubscribeFromConversation(client, conversationId).catch(console.error);
            }
            return;
        }
    });

    return () => {
        unsubscribe();
    };
}

