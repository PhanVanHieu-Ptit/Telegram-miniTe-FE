import type { Conversation, Message } from "@/types/chat.types";
import { create } from "zustand";

export interface ChatState {
    conversations: Conversation[];
    activeConversationId: string | null;
    messages: Record<string, Message[]>;
    onlineUsers: string[];
    typingUsers: Record<string, string[]>;
}

export interface ChatActions {
    setConversations: (conversations: Conversation[]) => void;
    setActiveConversation: (id: string | null) => void;
    addMessage: (conversationId: string, message: Message) => void;
    setMessages: (conversationId: string, msgs: Message[]) => void;
    markMessageSeen: (conversationId: string, messageId: string) => void;
    setOnlineUsers: (ids: string[]) => void;
    setTypingUser: (conversationId: string, userId: string) => void;
    removeTypingUser: (conversationId: string, userId: string) => void;
}

export type ChatStore = ChatState & ChatActions;

export const useChatStore = create<ChatStore>((set) => ({
    conversations: [],
    activeConversationId: null,
    messages: {},
    onlineUsers: [],
    typingUsers: {},

    setConversations: (conversations) => set({ conversations }),

    setActiveConversation: (id) => set({ activeConversationId: id }),

    addMessage: (conversationId, message) =>
        set((state) => {
            const existing = state.messages[conversationId] ?? [];
            const nextMessages = {
                ...state.messages,
                [conversationId]: [...existing, message],
            };
            const nextConversations = state.conversations.map((conversation) =>
                conversation.id === conversationId
                    ? { ...conversation, lastMessage: message, updatedAt: message.timestamp }
                    : conversation
            );
            return {
                messages: nextMessages,
                conversations: nextConversations,
            };
        }),

    setMessages: (conversationId, msgs) =>
        set((state) => ({
            messages: {
                ...state.messages,
                [conversationId]: msgs,
            },
        })),

    markMessageSeen: (conversationId, messageId) =>
        set((state) => {
            const list = state.messages[conversationId];
            if (!list) return state;
            const index = list.findIndex((msg) => msg.id === messageId);
            if (index === -1 || list[index].status === "seen") return state;

            const updatedMessage: Message = { ...list[index], status: "seen" };
            const nextList = [...list];
            nextList[index] = updatedMessage;

            const nextConversations = state.conversations.map((conversation) =>
                conversation.id === conversationId && conversation.lastMessage?.id === messageId
                    ? { ...conversation, lastMessage: updatedMessage }
                    : conversation
            );

            return {
                messages: {
                    ...state.messages,
                    [conversationId]: nextList,
                },
                conversations: nextConversations,
            };
        }),

    setOnlineUsers: (ids) => set({ onlineUsers: ids }),

    setTypingUser: (conversationId, userId) =>
        set((state) => {
            const current = state.typingUsers[conversationId] ?? [];
            const nextConversationTyping = Array.from(new Set([...current, userId]));
            if (nextConversationTyping.length === current.length) return state;
            return {
                typingUsers: {
                    ...state.typingUsers,
                    [conversationId]: nextConversationTyping,
                },
            };
        }),

    removeTypingUser: (conversationId, userId) =>
        set((state) => {
            const current = state.typingUsers[conversationId] ?? [];
            if (!current.includes(userId)) return state;

            const nextConversationTyping = current.filter((id) => id !== userId);
            const nextTypingUsers = { ...state.typingUsers };

            if (nextConversationTyping.length === 0) {
                delete nextTypingUsers[conversationId];
            } else {
                nextTypingUsers[conversationId] = nextConversationTyping;
            }

            return {
                typingUsers: nextTypingUsers,
            };
        }),
}));