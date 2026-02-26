import { create } from "zustand";
import type { User, Message, Conversation } from "./types";
import {
  users,
  conversations as mockConversations,
  currentUserId,
  buildMessagesRecord,
  buildOnlineUsers,
} from "./mock-data";
import { chatService } from "@/services/chat.service";
import {
  getChatRealtimeService,
  type ChatRealtimeService,
} from "@/services/chat-realtime.service";

const getMqttUrl = (): string =>
  import.meta.env.VITE_MQTT_URL ?? "ws://localhost:1883";

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
  initialize: () => Promise<void>;
  initializeRealtime: () => Promise<void>;
  shutdownRealtime: () => Promise<void>;
  openConversation: (id: string | null) => Promise<void>;
  setActiveConversation: (id: string | null) => void;
  addMessage: (conversationId: string, message: Message) => void;
  setMessages: (conversationId: string, msgs: Message[]) => void;
  fetchMessages: (conversationId: string) => Promise<void>;
  markConversationSeenBy: (conversationId: string, userId: string) => void;
  markMessageSeen: (conversationId: string, messageId: string, userId: string) => void;
  setOnlineUsers: (ids: string[]) => void;
  setTypingUser: (conversationId: string, userId: string) => void;
  removeTypingUser: (conversationId: string, userId: string) => void;
  setTypingActive: (conversationId: string, active: boolean) => Promise<void>;

  // UI actions
  setSearchQuery: (query: string) => void;
  setSidebarOpen: (open: boolean) => void;

  // Derived helpers
  getUser: (id: string) => User | undefined;
  getConversationMessages: (conversationId: string) => Message[];
  getConversationPartner: (conversation: Conversation) => User | undefined;
  getFilteredConversations: () => Conversation[];
  sendMessage: (conversationId: string, text: string) => Promise<void>;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export type ChatStore = ChatState & ChatActions;

export const useChatStore = create<ChatStore>((set, get) => {
  let realtimeService: ChatRealtimeService | null = null;

  const getRealtimeService = (): ChatRealtimeService => {
    if (!realtimeService) {
      realtimeService = getChatRealtimeService(
        { url: getMqttUrl() },
        {
          onMessage: (message) =>
            get().addMessage(message.conversationId, message),
          onTyping: (conversationId, userId, active) => {
            if (active) {
              get().setTypingUser(conversationId, userId);
            } else {
              get().removeTypingUser(conversationId, userId);
            }
          },
          onSeen: (conversationId, userId) => {
            get().markConversationSeenBy(conversationId, userId);
          },
          onOnline: (userIds) => get().setOnlineUsers(userIds),
        }
      );
    }

    return realtimeService;
  };

  const ensureRealtime = async (): Promise<ChatRealtimeService> => {
    const service = getRealtimeService();
    await service.start();
    return service;
  };

  return {
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

    initialize: async () => {
      const activeId = get().activeConversationId;
      if (activeId) {
        await get().openConversation(activeId);
      } else {
        await get().initializeRealtime();
      }
    },

    initializeRealtime: async () => {
      try {
        await ensureRealtime();
      } catch (error) {
        console.error("Failed to start realtime:", error);
      }
    },

    shutdownRealtime: async () => {
      try {
        if (realtimeService) {
          await realtimeService.stop();
        }
      } catch (error) {
        console.error("Failed to stop realtime:", error);
      }
    },

    openConversation: async (id: string | null) => {
      const previousId = get().activeConversationId;

      if (previousId && previousId !== id) {
        try {
          const service = await ensureRealtime();
          await service.unsubscribeConversation(previousId);
        } catch (error) {
          console.error("Failed to unsubscribe conversation:", error);
        }
      }

      get().setActiveConversation(id);

      if (!id) return;

      await get().fetchMessages(id);

      try {
        const service = await ensureRealtime();
        await service.subscribeConversation(id);
        get().markConversationSeenBy(id, get().currentUserId);
        await service.publishSeen(id, get().currentUserId);
      } catch (error) {
        console.error("Failed to sync conversation realtime:", error);
      }
    },

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

    fetchMessages: async (conversationId: string) => {
      try {
        const messages = await chatService.getMessages(conversationId);
        get().setMessages(conversationId, messages);
      } catch (error) {
        console.error(
          `Failed to fetch messages for conversation ${conversationId}:`,
          error
        );
      }
    },

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

    markMessageSeen: (conversationId: string, messageId: string, userId: string) =>
      set((state) => {
        const list = state.messages[conversationId] ?? [];
        const nextList = list.map((message) => {
          if (message.id !== messageId) return message;
          if (message.senderId === userId) return message;
          const seenBy = message.seenBy ?? [];
          if (seenBy.includes(userId) && message.read) return message;
          return {
            ...message,
            seenBy: seenBy.includes(userId) ? seenBy : [...seenBy, userId],
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

    setTypingActive: async (conversationId: string, active: boolean) => {
      try {
        const service = await ensureRealtime();
        await service.publishTyping(conversationId, get().currentUserId, active);
      } catch (error) {
        console.error("Failed to publish typing event:", error);
      }
    },

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

    sendMessage: async (conversationId: string, text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const senderId = get().currentUserId;
      const newMessage: Message = {
        id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        conversationId,
        senderId,
        text: trimmed,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        seenBy: [],
        read: false,
      };

      get().addMessage(conversationId, newMessage);

      try {
        const service = await ensureRealtime();
        await service.publishMessage(conversationId, newMessage);
      } catch (error) {
        console.error("Failed to publish message:", error);
      }

      try {
        await chatService.sendMessage({ conversationId, text: trimmed });
      } catch (error) {
        console.error("Failed to send message:", error);
      }
    },
  };
});
