import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useChatStore } from "@/store/chat.store";
import { useAuthStore } from "@/store/auth.store";
import { conversationService } from "@/services/conversation.service";
import type { Conversation } from "@/types/chat.types";
import { message } from "antd";
import { useNavigate } from "react-router-dom";

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
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const currentUser = useAuthStore((s) => s.user);
    const fetchConversations = useChatStore((s) => s.fetchConversations);
    const navigate = useNavigate();

    const createConversation = useCallback(async (params: CreateConversationParams): Promise<Conversation | undefined> => {
        if (!currentUser) {
            message.error(t('notifications.login_required_error'));
            return;
        }

        // 1. Validation Logic
        if (params.type === "group" && !params.name) {
            message.error(t('notifications.group_name_required_error'));
            return;
        }

        if (params.type === "private" && params.userIds.length < 1) {
            message.error(t('notifications.private_chat_member_error'));
            return;
        }

        if (params.type === "group" && params.userIds.length < 2) {
            message.error(t('notifications.group_chat_member_error'));
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
            // Update URL which will trigger setActiveConversationId in ChatPage
            navigate(`/chat?id=${result.id}`);
            message.success(t('notifications.conversation_created_success'));

            return result;
        } catch (error: any) {
            const errorMessage = error.message || t('notifications.conversation_create_failed');
            message.error(errorMessage);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [currentUser, fetchConversations, navigate, t]);

    return {
        createConversation,
        loading,
    };
};
