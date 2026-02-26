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
    typingUsers: Record<string, string[]>; // conversationId -> userId[]
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
    typingUsers: {},

    // Actions
    fetchConversations: async () => {
        set({ loading: true });
        try {
            const conversations = await getConversations();
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

            set((state) => ({
                messages: cursor ? [...state.messages, ...result.messages] : result.messages,
                messagesCursor: result.nextCursor,
                hasMoreMessages: result.hasMore,
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
            text: payload.text,
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
                url: import.meta.env.VITE_MQTT_URL ?? "ws://localhost:1883",
            });
            await publishTyping(client, conversationId, userId, isTyping);
        } catch (error) {
            console.error("Failed to publish typing status:", error);
        }
    },
}));