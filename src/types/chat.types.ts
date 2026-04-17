export type ISODateString = string;

export const MessageStatus = {
    Sending: "sending",
    Sent: "sent",
    Delivered: "delivered",
    Seen: "seen",
    Failed: "failed",
} as const;

export type MessageStatus = (typeof MessageStatus)[keyof typeof MessageStatus];

export interface User {
    id: string;
    displayName: string;
    email?: string;
    avatarUrl?: string;
    online: boolean;
    lastSeenAt?: ISODateString;
}

export interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    timestamp: ISODateString;
    status: MessageStatus;
}

export interface ConversationMember {
    id: string;
    fullName: string;
    email: string;
    role: string;
    avatarUrl: string | null;
}

export interface Conversation {
    id: string;
    participantIds: string[];
    members: ConversationMember[];
    lastMessage?: Message;
    unreadCount: number;
    pinned: boolean;
    muted: boolean;
    chatName: string;
    updatedAt: ISODateString;
}

export interface TypingEvent {
    conversationId: string;
    userId: string;
    isTyping: boolean;
    timestamp: ISODateString;
}