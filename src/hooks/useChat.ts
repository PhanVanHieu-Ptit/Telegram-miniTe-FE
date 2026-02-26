import { useChatStore } from "@/store/chat.store";
import type { Conversation, Message } from "@/types/chat.types";
import type { SendMessageDto } from "@/api/chat.api";

interface UseChatResult {
    conversations: Conversation[];
    messages: Message[];
    fetchMessages: (conversationId: string) => Promise<void>;
    sendMessage: (payload: SendMessageDto) => Promise<Message | undefined>;
}

const useChat = (): UseChatResult => {
    const conversations = useChatStore((state) => state.conversations);
    const messages = useChatStore((state) => state.messages);
    const fetchMessages = useChatStore((state) => state.fetchMessages);
    const sendMessage = useChatStore((state) => state.sendMessage);

    return {
        conversations,
        messages,
        fetchMessages,
        sendMessage,
    };
};

export default useChat;
