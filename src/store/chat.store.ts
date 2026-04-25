import { create } from "zustand";
import { MessageStatus, type Conversation, type Message } from "@/types/chat.types";
import { useAuthStore } from "@/store/auth.store";
import {
    getConversations,
    getMessages,
    type SendMessageDto,
    sendMessage as sendMessageApi,
    type GetMessagesParams,
    hideMessage as hideMessageApi,
    unhideMessage as unhideMessageApi,
    pinMessage as pinMessageApi,
    unpinMessage as unpinMessageApi,
} from "@/api/chat.api";

interface ChatState {
    conversations: Conversation[];
    messages: Message[];
    loading: boolean;
    messagesCursor?: string;
    hasMoreMessages: boolean;
    activeConversationId: string | null;
    sidebarOpen: boolean;
    searchQuery: string;
    typingUsers: Record<string, string[]>; // conversationId -> userId[]
    onlineUsers: string[];
    replyingToMessage: Message | null;
    editingMessage: Message | null;
    forwardingMessage: Message | null;
}

interface ChatActions {
    fetchConversations: () => Promise<void>;
    fetchMessages: (conversationId: string, cursor?: string, limit?: number) => Promise<void>;
    addMessage: (message: Message) => void;
    updateMessageStatus: (messageId: string, status: MessageStatus) => void;
    sendMessage: (payload: SendMessageDto) => Promise<Message | undefined>;
    setActiveConversationId: (id: string | null) => void;
    setSidebarOpen: (open: boolean) => void;
    setTypingUser: (conversationId: string, userId: string) => void;
    removeTypingUser: (conversationId: string, userId: string) => void;
    setTypingActive: (conversationId: string, isTyping: boolean) => Promise<void>;
    setSearchQuery: (query: string) => void;
    getFilteredConversations: () => Conversation[];
    getUser: (userId: string) => any;
    markMessageSeen: (conversationId: string, messageId: string, userId: string) => void;
    setOnlineUsers: (userIds: string[]) => void;
    subscribeToConversation: (conversationId: string) => Promise<void>;
    unsubscribeFromConversation: (conversationId: string) => Promise<void>;
    subscribeToAllConversations: () => Promise<void>;
    updateConversationLastMessage: (conversationId: string, message: Message) => void;
    publishSeenStatus: (conversationId: string, messageId: string) => Promise<void>;
    deleteConversation: (conversationId: string) => Promise<void>;
    reactMessage: (conversationId: string, messageId: string, emoji: string) => Promise<void>;
    hideMessage: (conversationId: string, messageId: string) => Promise<void>;
    unhideMessage: (conversationId: string, messageId: string) => Promise<void>;
    pinMessage: (conversationId: string, messageId: string) => Promise<void>;
    unpinMessage: (conversationId: string, messageId: string) => Promise<void>;
    /**
     * Merge `patch` fields into the message currently identified by `tempOrRealId`.
     * Used to swap a locally-previewed optimistic message for real server data.
     */
    updateMessage: (tempOrRealId: string, patch: Partial<Message>) => void;
    setReplyingToMessage: (message: Message | null) => void;
    setEditingMessage: (message: Message | null) => void;
    setForwardingMessage: (message: Message | null) => void;
    editMessage: (messageId: string, content: string) => Promise<void>;
    deleteMessage: (messageId: string, mode?: 'self' | 'everyone') => Promise<void>;
}

type ChatStore = ChatState & ChatActions;

export const useChatStore = create<ChatStore>((set, get) => ({
    // State
    conversations: [],
    messages: [],
    loading: false,
    messagesCursor: undefined,
    hasMoreMessages: false,
    activeConversationId: null,
    sidebarOpen: true,
    searchQuery: "",
    typingUsers: {},
    onlineUsers: [],
    replyingToMessage: null,
    editingMessage: null,
    forwardingMessage: null,

    // Actions
    fetchConversations: async () => {
        set({ loading: true });
        try {
            const userId = useAuthStore.getState().user?.id;
            if (!userId) throw new Error("User ID is missing");
            const conversations = await getConversations({ userId });
            set({ conversations });
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to fetch conversations";
            throw new Error(message);
        } finally {
            set({ loading: false });
        }
    },

    fetchMessages: async (conversationId: string, cursor?: string, limit: number = 50) => {
        set({ loading: true });
        try {
            const params: GetMessagesParams = {
                conversationId,
                cursor,
                limit,
            };
            const result = await getMessages(params);
            const messagesArray = Array.isArray(result) ? result : ((result as any).data || (result as any).messages || []);

            const mappedMessages = messagesArray.map((msg: any) => ({
                ...msg,
                timestamp: msg.timestamp || msg.createdAt || new Date().toISOString(),
            }));

            set(() => ({
                messages: mappedMessages
            }));
        } catch (error) {
            const message = error instanceof Error
                ? error.message
                : `Failed to fetch messages for conversation ${conversationId}`;
            throw new Error(message);
        } finally {
            set({ loading: false });
        }
    },

    addMessage: (message: Message) => {
        set((state) => ({
            messages: [...state.messages, message],
        }));
    },

    updateMessage: (tempOrRealId: string, patch: Partial<Message>) => {
        set((state) => ({
            messages: state.messages.map((msg) =>
                msg.id === tempOrRealId ? { ...msg, ...patch } : msg
            ),
        }));
    },

    updateMessageStatus: (messageId: string, status: MessageStatus) => {
        set((state) => ({
            messages: state.messages.map((msg) => {
                // Idempotent update: only update if status has changed
                if (msg.id === messageId && msg.status !== status) {
                    return { ...msg, status };
                }
                return msg;
            }),
        }));
    },

    sendMessage: async (payload) => {
        // Optimistic message insertion is handled by the caller (message-input).
        // This action only POSTs to the API and updates conversations.lastMessage.
        set({ loading: true });

        const senderId = useAuthStore.getState().user?.id;
        if (!senderId) {
            set({ loading: false });
            throw new Error("User not authenticated");
        }

        try {
            const result = await sendMessageApi(payload);
            const message: Message = {
                ...result,
                timestamp: result.timestamp || result.createdAt || new Date().toISOString(),
            };

            set((state) => ({
                conversations: state.conversations.map((c) =>
                    c.id === payload.conversationId
                        ? { ...c, lastMessage: message, updatedAt: message.timestamp }
                        : c
                ),
            }));

            return message;
        } catch (error) {
            console.error("Failed to send message:", error);
            throw error; // caller marks temp message as failed
        } finally {
            set({ loading: false });
        }
    },


    setActiveConversationId: (id: string | null) => {
        set({ activeConversationId: id });
        if (id) {
            void get().fetchMessages(id);
        } else {
            set({ messages: [] });
        }
    },

    setSidebarOpen: (open: boolean) => {
        set({ sidebarOpen: open });
    },

    setTypingUser: (conversationId: string, userId: string) => {
        set((state) => {
            const currentUsers = state.typingUsers[conversationId] || [];
            if (currentUsers.includes(userId)) {
                return state;
            }
            return {
                typingUsers: {
                    ...state.typingUsers,
                    [conversationId]: [...currentUsers, userId],
                },
            };
        });
    },

    removeTypingUser: (conversationId: string, userId: string) => {
        set((state) => {
            const currentUsers = state.typingUsers[conversationId] || [];
            const filtered = currentUsers.filter((id) => id !== userId);
            return {
                typingUsers: {
                    ...state.typingUsers,
                    [conversationId]: filtered,
                },
            };
        });
    },

    setTypingActive: async (conversationId: string, isTyping: boolean) => {
        const userId = useAuthStore.getState().user?.id;
        if (!userId) return;

        // Import dynamically to avoid circular dependency
        const { publishTyping } = await import("@/mqtt/mqtt.service");
        const { getMqttClient } = await import("@/mqtt/mqtt.client");

        try {
            const client = getMqttClient({
                url: import.meta.env.VITE_MQTT_URL ?? "ws://localhost:9001",
                username: import.meta.env.VITE_MQTT_USER,
                password: import.meta.env.VITE_MQTT_PASS,
            });
            await client.connect(); // Ensure MQTT client is connected
            await publishTyping(client, conversationId, userId, isTyping);
        } catch (error) {
            console.error("Failed to publish typing status:", error);
        }
    },

    setSearchQuery: (query: string) => {
        set({ searchQuery: query });
    },

    getFilteredConversations: () => {
        const { conversations, searchQuery } = get();
        if (!searchQuery.trim()) return conversations;

        const q = searchQuery.toLowerCase();
        return conversations.filter((convo) => {
            return convo.members.some((m) =>
                m.fullName.toLowerCase().includes(q) ||
                m.email.toLowerCase().includes(q)
            );
        });
    },

    getUser: (userId: string) => {
        // Find user details from conversation members
        const { conversations } = get();
        for (const convo of conversations) {
            const member = convo.members.find((m) => m.id === userId);
            if (member) {
                return {
                    id: member.id,
                    displayName: member.fullName,
                    avatarUrl: member.avatarUrl,
                    online: false,
                };
            }
        }
        return undefined;
    },

    markMessageSeen: (conversationId: string, messageId: string, _userId: string) => {
        set((state) => ({
            messages: state.messages.map((msg) =>
                msg.id === messageId && msg.conversationId === conversationId
                    ? { ...msg, status: MessageStatus.Seen }
                    : msg
            ),
        }));
    },

    setOnlineUsers: (userIds: string[]) => {
        set({ onlineUsers: userIds });
    },

    subscribeToConversation: async (conversationId: string) => {
        try {
            // Import dynamically to avoid circular dependency
            const { subscribeToConversation } = await import("@/mqtt/mqtt.service");
            const { getMqttClient } = await import("@/mqtt/mqtt.client");

            const client = getMqttClient({
                url: import.meta.env.VITE_MQTT_URL ?? "ws://localhost:9001",
                username: import.meta.env.VITE_MQTT_USER,
                password: import.meta.env.VITE_MQTT_PASS,
            });

            await client.connect(); // Ensure MQTT client is connected
            await subscribeToConversation(client, conversationId);
        } catch (error) {
            console.error("Failed to subscribe to conversation:", error);
        }
    },

    unsubscribeFromConversation: async (conversationId: string) => {
        try {
            // Import dynamically to avoid circular dependency  
            const { unsubscribeFromConversation } = await import("@/mqtt/mqtt.service");
            const { getMqttClient } = await import("@/mqtt/mqtt.client");

            const client = getMqttClient({
                url: import.meta.env.VITE_MQTT_URL ?? "ws://localhost:9001",
                username: import.meta.env.VITE_MQTT_USER,
                password: import.meta.env.VITE_MQTT_PASS,
            });

            if (client.connectionStatus === "connected") {
                await unsubscribeFromConversation(client, conversationId);
            }
        } catch (error) {
            console.error("Failed to unsubscribe from conversation:", error);
        }
    },

    subscribeToAllConversations: async () => {
        try {
            const { subscribeToMessages, subscribeToOnlineStatus } = await import("@/mqtt/mqtt.service");
            const { getMqttClient } = await import("@/mqtt/mqtt.client");

            const client = getMqttClient({
                url: import.meta.env.VITE_MQTT_URL ?? "ws://localhost:9001",
                username: import.meta.env.VITE_MQTT_USER,
                password: import.meta.env.VITE_MQTT_PASS,
            });

            await client.connect();

            const { conversations } = get();
            const userId = useAuthStore.getState().user?.id;
            
            const subs: Promise<void>[] = conversations.map((c) => subscribeToMessages(client, c.id));
            if (userId) {
                subs.push(subscribeToOnlineStatus(client, userId));
            }
            await Promise.all(subs);
        } catch (error) {
            console.error("Failed to subscribe to all conversations:", error);
        }
    },

    updateConversationLastMessage: (conversationId: string, message: Message) => {
        set((state) => ({
            conversations: state.conversations.map((c) =>
                c.id === conversationId
                    ? { ...c, lastMessage: message, updatedAt: message.timestamp }
                    : c
            ),
        }));
    },

    publishSeenStatus: async (conversationId: string, messageId: string) => {
        try {
            // Import dynamically to avoid circular dependency
            const { publishConversationSeen } = await import("@/mqtt/mqtt.service");
            const { getMqttClient } = await import("@/mqtt/mqtt.client");

            const client = getMqttClient({
                url: import.meta.env.VITE_MQTT_URL ?? "ws://localhost:9001",
                username: import.meta.env.VITE_MQTT_USER,
                password: import.meta.env.VITE_MQTT_PASS,
            });

            await client.connect(); // Ensure MQTT client is connected
            await publishConversationSeen(client, conversationId, messageId);
        } catch (error) {
            console.error("Failed to publish seen status:", error);
        }
    },

    deleteConversation: async (conversationId: string) => {
        set({ loading: true });
        try {
            const { deleteConversation } = await import("@/api/chat.api");
            await deleteConversation(conversationId);
            set((state) => ({
                conversations: state.conversations.filter((c) => c.id !== conversationId),
                activeConversationId: state.activeConversationId === conversationId ? null : state.activeConversationId,
                messages: state.activeConversationId === conversationId ? [] : state.messages,
            }));
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to delete conversation";
            throw new Error(message);
        } finally {
            set({ loading: false });
        }
    },

    reactMessage: async (conversationId: string, messageId: string, emoji: string) => {
        // Optimistic UI Update
        const userId = useAuthStore.getState().user?.id;
        if (!userId) return;

        set((state) => ({
            messages: state.messages.map((msg) => {
                if (msg.id === messageId) {
                    const currentReactions = { ...msg.reactions };
                    if (!currentReactions[emoji]) currentReactions[emoji] = [];
                    
                    const idx = currentReactions[emoji].indexOf(userId);
                    if (idx > -1) {
                        currentReactions[emoji].splice(idx, 1);
                        if (currentReactions[emoji].length === 0) delete currentReactions[emoji];
                    } else {
                        currentReactions[emoji].push(userId);
                    }
                    
                    return { ...msg, reactions: currentReactions };
                }
                return msg;
            }),
        }));

        try {
            const { reactMessage } = await import("@/api/chat.api");
            await reactMessage({ conversationId, messageId, emoji });
        } catch (error) {
            console.error("Failed to react to message:", error);
            // We could revert optimistic update here if we want to be strict
        }
    },

    hideMessage: async (conversationId: string, messageId: string) => {
        const userId = useAuthStore.getState().user?.id;
        if (!userId) return;

        set((state) => ({
            messages: state.messages.map((msg) =>
                msg.id === messageId
                    ? { ...msg, hiddenBy: [...(msg.hiddenBy || []), userId] }
                    : msg
            ),
        }));

        try {
            await hideMessageApi({ conversationId, messageId });
        } catch (error) {
            console.error("Failed to hide message:", error);
        }
    },

    unhideMessage: async (conversationId: string, messageId: string) => {
        const userId = useAuthStore.getState().user?.id;
        if (!userId) return;

        set((state) => ({
            messages: state.messages.map((msg) =>
                msg.id === messageId
                    ? { ...msg, hiddenBy: (msg.hiddenBy || []).filter(id => id !== userId) }
                    : msg
            ),
        }));

        try {
            await unhideMessageApi({ conversationId, messageId });
        } catch (error) {
            console.error("Failed to unhide message:", error);
        }
    },

    pinMessage: async (conversationId: string, messageId: string) => {
        set((state) => ({
            messages: state.messages.map((msg) =>
                msg.id === messageId ? { ...msg, isPinned: true } : msg
            ),
        }));

        try {
            await pinMessageApi({ conversationId, messageId });
        } catch (error) {
            console.error("Failed to pin message:", error);
        }
    },

    unpinMessage: async (conversationId: string, messageId: string) => {
        set((state) => ({
            messages: state.messages.map((msg) =>
                msg.id === messageId ? { ...msg, isPinned: false } : msg
            ),
        }));

        try {
            await unpinMessageApi({ conversationId, messageId });
        } catch (error) {
            console.error("Failed to unpin message:", error);
        }
    },
    setReplyingToMessage: (message) => set({ replyingToMessage: message }),
    setEditingMessage: (message) => set({ editingMessage: message }),
    setForwardingMessage: (message) => set({ forwardingMessage: message }),
    
    editMessage: async (messageId, content) => {
        const { activeConversationId } = get();
        if (!activeConversationId) return;

        try {
            const { editMessage: editMessageApi } = await import("@/api/chat.api");
            const updatedMessage = await editMessageApi({ messageId, conversationId: activeConversationId, content });
            
            set((state) => ({
                messages: state.messages.map((msg) =>
                    msg.id === messageId ? updatedMessage : msg
                ),
                editingMessage: null,
            }));
        } catch (error) {
            console.error("Failed to edit message:", error);
            throw error;
        }
    },

    deleteMessage: async (messageId, mode = 'self') => {
        const { activeConversationId } = get();
        if (!activeConversationId) return;

        try {
            const { deleteMessage: deleteMessageApi } = await import("@/api/chat.api");
            await deleteMessageApi({ messageId, conversationId: activeConversationId, mode });
            
            if (mode === 'everyone') {
                set((state) => ({
                    messages: state.messages.map((msg) =>
                        msg.id === messageId 
                            ? { ...msg, isDeleted: true, content: "", attachments: [] } 
                            : msg
                    ),
                }));
            } else {
                set((state) => ({
                    messages: state.messages.filter((msg) => msg.id !== messageId),
                }));
            }
        } catch (error) {
            console.error("Failed to delete message:", error);
            throw error;
        }
    },
}));