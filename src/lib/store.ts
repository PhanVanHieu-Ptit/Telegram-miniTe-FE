import { create } from "zustand";
import type { User, Message, Conversation } from "./types";
import {
  users,
  conversations as mockConversations,
  currentUserId,
  buildMessagesRecord,
  buildOnlineUsers,
} from "./mock-data";

// ─── State ────────────────────────────────────────────────────────────────────

interface ChatState {
  currentUserId: string;
  users: User[];
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Record<string, Message[]>;
  onlineUsers: string[];
  typingUsers: Record<string, string[]>;

  // UI
  searchQuery: string;
  sidebarOpen: boolean;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

interface ChatActions {
  // Core actions
  setActiveConversation: (id: string | null) => void;
  addMessage: (conversationId: string, message: Message) => void;
  setMessages: (conversationId: string, msgs: Message[]) => void;
  markConversationSeenBy: (conversationId: string, userId: string) => void;
  setOnlineUsers: (ids: string[]) => void;
  setTypingUser: (conversationId: string, userId: string) => void;
  removeTypingUser: (conversationId: string, userId: string) => void;

  // UI actions
  setSearchQuery: (query: string) => void;
  setSidebarOpen: (open: boolean) => void;

  // Derived helpers
  getUser: (id: string) => User | undefined;
  getConversationMessages: (conversationId: string) => Message[];
  getConversationPartner: (conversation: Conversation) => User | undefined;
  getFilteredConversations: () => Conversation[];
  sendMessage: (conversationId: string, text: string) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export type ChatStore = ChatState & ChatActions;

export const useChatStore = create<ChatStore>((set, get) => ({
  // State
  currentUserId,
  users,
  conversations: mockConversations,
  activeConversationId: "c1",
  messages: buildMessagesRecord(),
  onlineUsers: buildOnlineUsers(),
  typingUsers: {},

  searchQuery: "",
  sidebarOpen: true,

  // ─── Core Actions ─────────────────────────────────────────────────────

  setActiveConversation: (id: string | null) =>
    set({ activeConversationId: id }),

  addMessage: (conversationId: string, message: Message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: [
          ...(state.messages[conversationId] ?? []),
          message,
        ],
      },
      conversations: state.conversations.map((c) =>
        c.id === conversationId ? { ...c, lastMessage: message } : c
      ),
    })),

  setMessages: (conversationId: string, msgs: Message[]) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: msgs,
      },
    })),

  markConversationSeenBy: (conversationId: string, userId: string) =>
    set((state) => {
      const list = state.messages[conversationId] ?? [];
      const nextList = list.map((message) => {
        if (message.senderId === userId) return message;
        const seenBy = message.seenBy ?? [];
        if (seenBy.includes(userId)) return message;
        return {
          ...message,
          seenBy: [...seenBy, userId],
          read: true,
        };
      });

      return {
        messages: {
          ...state.messages,
          [conversationId]: nextList,
        },
      };
    }),

  setOnlineUsers: (ids: string[]) => set({ onlineUsers: ids }),

  setTypingUser: (conversationId: string, userId: string) =>
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

  removeTypingUser: (conversationId: string, userId: string) =>
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

  // ─── UI Actions ───────────────────────────────────────────────────────

  setSearchQuery: (query: string) => set({ searchQuery: query }),
  setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),

  // ─── Derived Helpers ──────────────────────────────────────────────────

  getUser: (id: string) => get().users.find((u) => u.id === id),

  getConversationMessages: (conversationId: string) =>
    get().messages[conversationId] ?? [],

  getConversationPartner: (conversation: Conversation) => {
    const partnerId = conversation.participants.find(
      (p) => p !== get().currentUserId
    );
    return get().users.find((u) => u.id === partnerId);
  },

  getFilteredConversations: () => {
    const {
      conversations: allConvos,
      searchQuery,
      users: allUsers,
      currentUserId: myId,
    } = get();
    if (!searchQuery.trim()) return allConvos;
    const q = searchQuery.toLowerCase();
    return allConvos.filter((convo) => {
      const partnerId = convo.participants.find((p) => p !== myId);
      const partner = allUsers.find((u) => u.id === partnerId);
      return partner?.name.toLowerCase().includes(q);
    });
  },

  sendMessage: (conversationId: string, text: string) => {
    if (!text.trim()) return;
    const senderId = get().currentUserId;
    const newMessage: Message = {
      id: `m-${Date.now()}`,
      conversationId,
      senderId,
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      seenBy: [],
      read: false,
    };
    get().addMessage(conversationId, newMessage);
  },
}));
