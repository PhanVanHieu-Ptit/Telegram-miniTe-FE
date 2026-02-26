import apiClient from "./axios";
import type {
    Conversation as ConversationType,
    Message as MessageType,
} from "../types/chat.types";

export type Conversation = ConversationType;
export type Message = MessageType;

export interface SendMessageDto {
    conversationId: string;
    text: string;
}

export interface CreateConversationDto {
    userIds: string[];
    type: string;
    name: string;
    avatar: string;
    createdBy: string;
}

export interface JoinConversationDto {
    conversationId: string;
    userId: string;
}

export const createConversation = (payload: CreateConversationDto): Promise<Conversation> => {
    return apiClient
        .post<Conversation>("/conversations", payload)
        .then((response) => response.data);
};

export const joinConversation = (payload: JoinConversationDto): Promise<Conversation> => {
    return apiClient
        .post<Conversation>("/conversations/join", payload)
        .then((response) => response.data);
};

export const getConversations = (): Promise<Conversation[]> => {
    return apiClient
        .get<Conversation[]>("/conversations")
        .then((response) => response.data);
};

export const getMessages = (conversationId: string): Promise<Message[]> => {
    return apiClient
        .get<Message[]>("/messages", {
            params: {
                conversationId,
            },
        })
        .then((response) => response.data);
};

export const sendMessage = (payload: SendMessageDto): Promise<Message> => {
    return apiClient
        .post<Message>("/messages", payload)
        .then((response) => response.data);
};

export interface SendTypingDto {
    conversationId: string;
    userId: string;
    isTyping: boolean;
}

export const sendTyping = (payload: SendTypingDto): Promise<void> => {
    return apiClient
        .post<void>("/typing", payload)
        .then((response) => response.data);
};

export interface MarkAsSeenDto {
    conversationId: string;
    userId: string;
}

export const markAsSeen = (payload: MarkAsSeenDto): Promise<void> => {
    return apiClient
        .post<void>("/seen", payload)
        .then((response) => response.data);
};
