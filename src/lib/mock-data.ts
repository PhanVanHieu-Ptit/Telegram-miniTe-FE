import type { User, Message, Conversation } from "./types";

export const currentUserId = "me";

export const users: User[] = [
  { id: "me", name: "You", avatar: "", online: true },
  { id: "u1", name: "Alice Martin", avatar: "", online: true },
  { id: "u2", name: "Bob Chen", avatar: "", online: false, lastSeen: "today at 14:22" },
  { id: "u3", name: "Charlie Dev", avatar: "", online: true },
  { id: "u4", name: "Diana Ross", avatar: "", online: false, lastSeen: "yesterday at 19:45" },
  { id: "u5", name: "Evan Wright", avatar: "", online: true },
  { id: "u6", name: "Fiona Lake", avatar: "", online: false, lastSeen: "today at 10:30" },
  { id: "u7", name: "George Kim", avatar: "", online: true },
  { id: "u8", name: "Hannah Mills", avatar: "", online: false, lastSeen: "3 days ago" },
];

export const mockMessages: Message[] = [
  { id: "m1", conversationId: "c1", senderId: "u1", text: "Hey! Are you coming to the standup?", timestamp: "10:15 AM", read: true },
  { id: "m2", conversationId: "c1", senderId: "me", text: "Yes, give me 5 minutes", timestamp: "10:16 AM", read: true },
  { id: "m3", conversationId: "c1", senderId: "u1", text: "Sure, no rush. We can start with the design review first.", timestamp: "10:16 AM", read: true },
  { id: "m4", conversationId: "c1", senderId: "me", text: "Sounds good, joining now", timestamp: "10:18 AM", read: true },
  { id: "m5", conversationId: "c1", senderId: "u1", text: "Great! Also, can you share the updated wireframes after?", timestamp: "10:19 AM", read: true },
  { id: "m6", conversationId: "c1", senderId: "me", text: "Will do. I finished the mobile version too", timestamp: "10:20 AM", read: true },
  { id: "m7", conversationId: "c1", senderId: "u1", text: "Amazing work! The team is going to love it", timestamp: "10:21 AM", read: false },

  { id: "m8", conversationId: "c2", senderId: "u2", text: "Check out this repo, it's pretty interesting for our use case", timestamp: "9:30 AM", read: true },
  { id: "m9", conversationId: "c2", senderId: "me", text: "Which one? The one you mentioned yesterday?", timestamp: "9:32 AM", read: true },
  { id: "m10", conversationId: "c2", senderId: "u2", text: "Yeah, I forked it and made some changes already", timestamp: "9:33 AM", read: true },
  { id: "m11", conversationId: "c2", senderId: "me", text: "Nice, I'll review the PR this afternoon", timestamp: "9:35 AM", read: true },
  { id: "m12", conversationId: "c2", senderId: "u2", text: "Thanks! Let me know if you have questions about the architecture decisions", timestamp: "Yesterday", read: false },

  { id: "m13", conversationId: "c3", senderId: "u3", text: "The deployment went through successfully!", timestamp: "8:45 AM", read: true },
  { id: "m14", conversationId: "c3", senderId: "me", text: "Finally! How long did the build take?", timestamp: "8:46 AM", read: true },
  { id: "m15", conversationId: "c3", senderId: "u3", text: "About 3 minutes. The caching we added made a huge difference.", timestamp: "8:47 AM", read: true },
  { id: "m16", conversationId: "c3", senderId: "u3", text: "We should monitor the error rates for the next few hours", timestamp: "8:48 AM", read: false },

  { id: "m17", conversationId: "c4", senderId: "u4", text: "Can we reschedule our 1:1 to Thursday?", timestamp: "Yesterday", read: true },
  { id: "m18", conversationId: "c4", senderId: "me", text: "Thursday works for me. Same time?", timestamp: "Yesterday", read: true },
  { id: "m19", conversationId: "c4", senderId: "u4", text: "Yes, 2pm. I'll send you the updated agenda beforehand.", timestamp: "Yesterday", read: true },

  { id: "m20", conversationId: "c5", senderId: "u5", text: "I pushed the new feature branch", timestamp: "Monday", read: true },
  { id: "m21", conversationId: "c5", senderId: "me", text: "Saw it. The component structure looks clean", timestamp: "Monday", read: true },
  { id: "m22", conversationId: "c5", senderId: "u5", text: "Thanks! I followed the patterns we discussed", timestamp: "Monday", read: true },

  { id: "m23", conversationId: "c6", senderId: "u6", text: "The user research results are in", timestamp: "Sunday", read: true },
  { id: "m24", conversationId: "c6", senderId: "me", text: "Exciting! What were the key findings?", timestamp: "Sunday", read: true },
  { id: "m25", conversationId: "c6", senderId: "u6", text: "Navigation was the biggest pain point. I'll share the full report tomorrow.", timestamp: "Sunday", read: true },

  { id: "m26", conversationId: "c7", senderId: "u7", text: "Hey, quick question about the API endpoints", timestamp: "Last week", read: true },
  { id: "m27", conversationId: "c7", senderId: "me", text: "Sure, what's up?", timestamp: "Last week", read: true },
  { id: "m28", conversationId: "c7", senderId: "u7", text: "Are we using REST or GraphQL for the new service?", timestamp: "Last week", read: true },

  { id: "m29", conversationId: "c8", senderId: "u8", text: "Welcome to the team! Let me know if you need anything", timestamp: "Last week", read: true },
  { id: "m30", conversationId: "c8", senderId: "me", text: "Thanks Hannah! Super excited to be here", timestamp: "Last week", read: true },
];

export const conversations: Conversation[] = [
  { id: "c1", participants: ["me", "u1"], lastMessage: mockMessages.find((m) => m.id === "m7"), unreadCount: 1, pinned: true, muted: false },
  { id: "c2", participants: ["me", "u2"], lastMessage: mockMessages.find((m) => m.id === "m12"), unreadCount: 1, pinned: true, muted: false },
  { id: "c3", participants: ["me", "u3"], lastMessage: mockMessages.find((m) => m.id === "m16"), unreadCount: 1, pinned: false, muted: false },
  { id: "c4", participants: ["me", "u4"], lastMessage: mockMessages.find((m) => m.id === "m19"), unreadCount: 0, pinned: false, muted: false },
  { id: "c5", participants: ["me", "u5"], lastMessage: mockMessages.find((m) => m.id === "m22"), unreadCount: 0, pinned: false, muted: true },
  { id: "c6", participants: ["me", "u6"], lastMessage: mockMessages.find((m) => m.id === "m25"), unreadCount: 0, pinned: false, muted: false },
  { id: "c7", participants: ["me", "u7"], lastMessage: mockMessages.find((m) => m.id === "m28"), unreadCount: 0, pinned: false, muted: false },
  { id: "c8", participants: ["me", "u8"], lastMessage: mockMessages.find((m) => m.id === "m30"), unreadCount: 0, pinned: false, muted: false },
];

/** Build the initial messages record keyed by conversationId */
export function buildMessagesRecord(): Record<string, Message[]> {
  const record: Record<string, Message[]> = {};
  for (const msg of mockMessages) {
    if (!record[msg.conversationId]) {
      record[msg.conversationId] = [];
    }
    record[msg.conversationId].push(msg);
  }
  return record;
}

/** Build initial online user ids */
export function buildOnlineUsers(): string[] {
  return users.filter((u) => u.online).map((u) => u.id);
}
