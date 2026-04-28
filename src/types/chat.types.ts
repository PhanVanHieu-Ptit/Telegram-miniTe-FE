export type ISODateString = string;

export const MessageStatus = {
    Uploading: "uploading",
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
    username?: string;
    email?: string;
    avatarUrl?: string;
    online: boolean;
    lastSeenAt?: ISODateString;
}

export type MessageType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'VOICE' | 'FILE' | 'LOCATION' | 'CONTACT' | 'BANK' | 'POLL' | 'REMINDER' | 'LINK' | 'GIF';

export interface Attachment {
    id?: string;
    url: string;
    /** Blob/object URL for immediate local preview before upload completes */
    localUrl?: string;
    /** Upload progress 0-100. Present only during upload. */
    uploadProgress?: number;
    type?: string;
    name?: string;
    size?: number;
}

export interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    sender?: User;
    type?: MessageType;
    content: string;
    mediaUrl?: string;
    attachments?: Attachment[];
    metadata?: any;
    mentions?: string[];
    hiddenBy?: string[];
    isPinned?: boolean;
    reactions?: Record<string, string[]>;
    timestamp: ISODateString;
    createdAt?: ISODateString;
    updatedAt?: ISODateString;
    status: MessageStatus;

    // New fields
    replyTo?: string;
    forwardedFrom?: string;
    isDeleted?: boolean;
    deletedForUsers?: string[];
    editedAt?: ISODateString;
    editHistory?: { content: string; editedAt: ISODateString }[];
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
    type?: 'private' | 'group';
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
    fullName?: string;
    typing: boolean;
    timestamp?: ISODateString;
}