import { create } from "zustand";
import { MessageStatus, type Conversation, type Message } from "@/types/chat.types";
import { useAuthStore } from "@/store/auth.store";
import {
    getConversations,
    getMessages,
    type SendMessageDto,
    sendMessage as sendMessageApi,
    type GetMessagesParams,
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
            console.log(`Fetched ${messagesArray.length} messages for ${conversationId}`, messagesArray);

            set(() => ({
                messages: messagesArray
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
        set({ loading: true });

        const senderId = useAuthStore.getState().user?.id;
        if (!senderId) {
            set({ loading: false });
            throw new Error("User not authenticated");
        }

        const tempId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const optimisticMessage: Message = {
            id: tempId,
            conversationId: payload.conversationId,
            senderId,
            content: payload.content,
            timestamp: new Date().toISOString(),
            status: MessageStatus.Sending,
        };

        get().addMessage(optimisticMessage);

        try {
            const message = await sendMessageApi(payload);
            set((state) => ({
                messages: state.messages.map((item) =>
                    item.id === tempId ? message : item
                ),
            }));
            return message;
        } catch (error) {
            console.error("Failed to send message:", error);
            set((state) => ({
                messages: state.messages.map((item) =>
                    item.id === tempId
                        ? { ...item, status: MessageStatus.Failed }
                        : item
                ),
            }));
            return undefined;
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
            });
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
}));