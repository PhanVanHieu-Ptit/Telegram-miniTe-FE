import { useEffect } from "react";
import { Sidebar } from "@/components/sidebar";
import { ChatPanel } from "@/components/chat-panel";
import { useChatStore } from "@/store/chat.store";
import { cn } from "@/lib/utils";

export default function ChatPage() {
    const activeConversationId = useChatStore((s) => s.activeConversationId);
    const sidebarOpen = useChatStore((s) => s.sidebarOpen);
    const messages = useChatStore((s) => s.messages);
    const fetchConversations = useChatStore((s) => s.fetchConversations);
    const subscribeToConversation = useChatStore((s) => s.subscribeToConversation);
    const unsubscribeFromConversation = useChatStore((s) => s.unsubscribeFromConversation);
    const publishSeenStatus = useChatStore((s) => s.publishSeenStatus);


    // Subscribe to conversation when activeConversationId changes
    useEffect(() => {
        console.log('ChatPage activeConversationId: ', activeConversationId)
        if (activeConversationId) {
            subscribeToConversation(activeConversationId);
        }

        return () => {
            if (activeConversationId) {
                unsubscribeFromConversation(activeConversationId);
            }
        };
    }, [activeConversationId, subscribeToConversation, unsubscribeFromConversation]);

    // Publish seen status when new messages arrive in active conversation
    useEffect(() => {
        if (!activeConversationId || messages.length === 0) {
            return;
        }

        const conversationMessages = messages.filter(
            (msg) => msg.conversationId === activeConversationId
        );
        const lastMessage = conversationMessages[conversationMessages.length - 1];

        if (lastMessage) {
            publishSeenStatus(activeConversationId, lastMessage.id).catch((error) => {
                console.error("Failed to publish seen status:", error);
            });
        }
    }, [messages, activeConversationId, publishSeenStatus]);



    // Fetch conversations on mount
    useEffect(() => {
        void fetchConversations();
    }, [fetchConversations]);

    return (
        <main className="flex h-dvh w-full overflow-hidden">
            {/* Sidebar */}
            <div
                className={cn(
                    "h-full w-full shrink-0 border-r border-border md:w-80",
                    activeConversationId && !sidebarOpen ? "hidden md:block" : "block"
                )}
            >
                <Sidebar />
            </div>

            {/* Chat panel */}
            <div
                className={cn(
                    "h-full flex-1",
                    !activeConversationId || sidebarOpen ? "hidden md:flex" : "flex"
                )}
            >
                <ChatPanel />
            </div>
        </main>
    );
}
