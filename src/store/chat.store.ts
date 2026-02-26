import { create } from "zustand";
import type { Conversation, Message } from "@/types/chat.types";
import {
    getConversations,
    getMessages,
    type SendMessageDto,
    sendMessage as sendMessageApi,
} from "@/api/chat.api";

interface ChatState {
    conversations: Conversation[];
    messages: Message[];
    loading: boolean;
}

interface ChatActions {
    fetchConversations: () => Promise<void>;
    fetchMessages: (conversationId: string) => Promise<void>;
    addMessage: (message: Message) => void;
    sendMessage: (payload: SendMessageDto) => Promise<Message | undefined>;
}

type ChatStore = ChatState & ChatActions;

export const useChatStore = create<ChatStore>((set, get) => ({
    // State
    conversations: [],
    messages: [],
    loading: false,

    // Actions
    fetchConversations: async () => {
        set({ loading: true });
        try {
            const conversations = await getConversations();
            set({ conversations });
        } catch (error) {
            console.error("Failed to fetch conversations:", error);
        } finally {
            set({ loading: false });
        }
    },

    fetchMessages: async (conversationId: string) => {
        set({ loading: true });
        try {
            const messages = await getMessages(conversationId);
            set({ messages });
        } catch (error) {
            console.error(
                `Failed to fetch messages for conversation ${conversationId}:`,
                error
            );
        } finally {
            set({ loading: false });
        }
    },

    addMessage: (message: Message) => {
        set((state) => ({
            messages: [...state.messages, message],
        }));
    },

    sendMessage: async (payload) => {
        set({ loading: true });
        try {
            const message = await sendMessageApi(payload);
            get().addMessage(message);
            return message;
        } catch (error) {
            console.error("Failed to send message:", error);
            return undefined;
        } finally {
            set({ loading: false });
        }
    },
}));