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
  lastMessage?: Message;
  unreadCount: number;
  pinned: boolean;
  muted: boolean;
}

export { MessageStatus };
