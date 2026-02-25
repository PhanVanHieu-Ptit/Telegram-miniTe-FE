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

  setOnlineUsers: (ids: string[]) => set({ onlineUsers: ids }),

  setTypingUser: (conversationId: string, userId: string) =>
    set((state) => {
      const current = state.typingUsers[conversationId] ?? [];
      if (current.includes(userId)) return state;
      return {
        typingUsers: {
          ...state.typingUsers,
          [conversationId]: [...current, userId],
        },
      };
    }),

  removeTypingUser: (conversationId: string, userId: string) =>
    set((state) => {
      const current = state.typingUsers[conversationId] ?? [];
      return {
        typingUsers: {
          ...state.typingUsers,
          [conversationId]: current.filter((id) => id !== userId),
        },
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
    const newMessage: Message = {
      id: `m-${Date.now()}`,
      conversationId,
      senderId: get().currentUserId,
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      read: false,
    };
    get().addMessage(conversationId, newMessage);
  },
}));
