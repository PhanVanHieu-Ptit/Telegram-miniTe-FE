import { useState, useCallback } from "react";
import { useChatStore } from "@/store/chat.store";
import { useAuthStore } from "@/store/auth.store";
import { conversationService } from "@/services/conversation.service";
import type { Conversation } from "@/types/chat.types";
import { message } from "antd";

interface CreateConversationParams {
    name?: string;
    avatar?: string;
    type: "private" | "group";
    userIds: string[];
}

/**
 * Custom hook to manage the creation of a conversation
 * Handles form state, loading, validation, and post-creation side effects
 */
export const useCreateConversation = () => {
    const [loading, setLoading] = useState(false);
    const currentUser = useAuthStore((s) => s.user);
    const fetchConversations = useChatStore((s) => s.fetchConversations);
    const setActiveConversationId = useChatStore((s) => s.setActiveConversationId);

    const createConversation = useCallback(async (params: CreateConversationParams): Promise<Conversation | undefined> => {
        if (!currentUser) {
            message.error("You must be logged in to create a conversation");
            return;
        }

        // 1. Validation Logic
        if (params.type === "group" && !params.name) {
            message.error("Conversation name is required for group chats");
            return;
        }

        if (params.type === "private" && params.userIds.length < 1) {
            message.error("At least 1 user is required for private chat");
            return;
        }

        if (params.type === "group" && params.userIds.length < 2) {
            message.error("At least 2 users are required for group chat");
            return;
        }

        // Prevent duplicate userIds by creating a unique set
        const uniqueUserIds = Array.from(new Set(params.userIds));

        setLoading(true);
        try {
            // 2. Call the API Service layer
            const result = await conversationService.create({
                userIds: uniqueUserIds,
                type: params.type,
                name: params.name || "",
                avatar: params.avatar || "https://cdn-media.sforum.vn/storage/app/media/anh-hoat-hinh-cute-1.jpg",
                createdBy: currentUser.id,
            });

            // 3. Post-Creation side-effects
            await fetchConversations();
            setActiveConversationId(result.id);
            message.success("Conversation created successfully");
            
            return result;
        } catch (error: any) {
            const errorMessage = error.message || "Failed to create conversation";
            message.error(errorMessage);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [currentUser, fetchConversations, setActiveConversationId]);

    return {
        createConversation,
        loading,
    };
};
