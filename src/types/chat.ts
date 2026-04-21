export interface User {
  id: string;
  username: string;
  avatarUrl?: string;
  status?: string;
}

export type MessageType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'VOICE' | 'FILE' | 'LOCATION';

export interface Attachment {
  id?: string;
  url: string;
  type?: string;
  name?: string;
  size?: number;
}

export interface Message {
  id: string;
  senderId: string;
  conversationId: string;
  type: MessageType;
  content?: string;
  attachments?: Attachment[];
  metadata?: any;
  timestamp?: string;
  createdAt: string;
  sender?: User;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
}
