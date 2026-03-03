import { MessageStatus } from "@/types/chat.types";

export interface User {
  id: string;
  name: string;
  avatar: string;
  online: boolean;
  lastSeen?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  timestamp: string;
  status: MessageStatus;
  seenBy?: string[];
  read?: boolean;
}

export interface Conversation {
  id: string;
  participants: string[];
  members: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    avatarUrl: string | null;
  }[];
  lastMessage?: Message;
  unreadCount: number;
  pinned: boolean;
  muted: boolean;
  updatedAt: string;
}

export { MessageStatus };
