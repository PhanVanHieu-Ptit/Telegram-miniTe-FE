import { createConversation, type CreateConversationDto } from "@/api/chat.api";
import { transformHttpError } from "@/lib/http-error-handler";
import type { Conversation } from "@/types/chat.types";

/**
 * Service to handle conversation-related business logic
 */
export class ConversationService {
    /**
     * Create a new conversation
     * @param data - The conversation creation Data Transfer Object
     * @returns Promise of the created conversation
     * @throws {AuthError} If the API call fails
     */
    async create(data: CreateConversationDto): Promise<Conversation> {
        try {
            return await createConversation(data);
        } catch (error) {
            throw transformHttpError(error);
        }
    }
}

export const conversationService = new ConversationService();
