import apiClient from "./axios";
import type {
    Conversation as ConversationType,
    Message as MessageType,
    MessageType as ChatMessageType,
    Attachment
} from "../types/chat.types";

export type Conversation = ConversationType;
export type Message = MessageType;

export interface SendMessageDto {
    senderId: string;
    conversationId: string;
    content: string;
    type?: ChatMessageType;
    attachments?: Attachment[];
    metadata?: any;
    mentions?: string[];
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

export interface GetConversationsParams {
    userId: string;
}

export const getConversations = (params: GetConversationsParams): Promise<Conversation[]> => {
    return apiClient
        .get<Conversation[]>("/conversations", {
            params: {
                userId: params.userId,
            },
        })
        .then((response) => response.data);
};

export interface GetMessagesParams {
    conversationId: string;
    cursor?: string;
    limit?: number;
}


export const getMessages = async (params: GetMessagesParams): Promise<Message[]> => {
    try {
        const response = await apiClient.get<Message[]>("/messages", {
            params: {
                conversationId: params.conversationId,
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error in getMessages /messages:", error);
        throw error;
    }
};

export const sendMessage = async (payload: SendMessageDto): Promise<Message> => {
    try {
        const response = await apiClient.post<Message>("/messages", payload);
        return response.data;
    } catch (error) {
        console.error("Error in sendMessage /messages:", error);
        throw error;
    }
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

export const deleteConversation = (conversationId: string): Promise<void> => {
    return apiClient
        .delete<void>(`/conversations/${conversationId}`)
        .then((response) => response.data);
};

export interface ReactMessageDto {
    conversationId: string;
    messageId: string;
    emoji: string;
}

export const reactMessage = (payload: ReactMessageDto): Promise<void> => {
    return apiClient
        .post<void>(`/messages/${payload.messageId}/react`, payload)
        .then((response) => response.data);
};

export interface MessageActionDto {
    conversationId: string;
    messageId: string;
}

export const hideMessage = (payload: MessageActionDto): Promise<void> => {
    return apiClient
        .post<void>(`/messages/${payload.messageId}/hide`, { conversationId: payload.conversationId })
        .then((response) => response.data);
};

export const unhideMessage = (payload: MessageActionDto): Promise<void> => {
    return apiClient
        .post<void>(`/messages/${payload.messageId}/unhide`, { conversationId: payload.conversationId })
        .then((response) => response.data);
};

export const pinMessage = (payload: MessageActionDto): Promise<void> => {
    return apiClient
        .post<void>(`/messages/${payload.messageId}/pin`, { conversationId: payload.conversationId })
        .then((response) => response.data);
};

export const unpinMessage = (payload: MessageActionDto): Promise<void> => {
    return apiClient
        .post<void>(`/messages/${payload.messageId}/unpin`, { conversationId: payload.conversationId })
        .then((response) => response.data);
};

export interface SearchMessagesParams {
    conversationId?: string;
    keyword?: string;
    type?: string | string[];
    senderId?: string | string[];
    fromDate?: string;
    toDate?: string;
    cursor?: string;
}

export const searchMessages = async (params: SearchMessagesParams): Promise<Message[]> => {
    try {
        const response = await apiClient.get<Message[]>("/messages/search", { params });
        return response.data;
    } catch (error) {
        console.error("Error in searchMessages:", error);
        throw error;
    }
};
