import {
    getConversations as getConversationsApi,
    getMessages as getMessagesApi,
    sendMessage as sendMessageApi,
    type SendMessageDto,
} from "@/api/chat.api";
import { MessageStatus } from "@/types/chat.types";
import type { Conversation as ApiConversation, Message as ApiMessage } from "@/types/chat.types";
import type { Conversation, Message } from "@/lib/types";

const mapMessage = (message: ApiMessage): Message => ({
    id: message.id,
    conversationId: message.conversationId,
    senderId: message.senderId,
    text: message.text,
    timestamp: message.timestamp,
    status: message.status,
    read: message.status === MessageStatus.Seen,
    seenBy: [],
});

const mapConversation = (conversation: ApiConversation): Conversation => ({
    id: conversation.id,
    participants: conversation.participantIds,
    lastMessage: conversation.lastMessage ? mapMessage(conversation.lastMessage) : undefined,
    unreadCount: conversation.unreadCount ?? 0,
    pinned: conversation.pinned ?? false,
    muted: conversation.muted ?? false,
});

export const chatService = {
    async getConversations(): Promise<Conversation[]> {
        const data = await getConversationsApi();
        return data.map(mapConversation);
    },
    async getMessages(conversationId: string): Promise<Message[]> {
        const data = await getMessagesApi({ conversationId });
        return data.messages.map(mapMessage);
    },
    async sendMessage(payload: SendMessageDto): Promise<Message> {
        const data = await sendMessageApi(payload);
        return mapMessage(data);
    },
};

export type { SendMessageDto };
