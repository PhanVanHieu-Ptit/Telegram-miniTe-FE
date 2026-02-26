

import { useChatStore } from "@/lib/store";
import { ChatHeader } from "./chat-header";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import { TypingIndicator } from "./typing-indicator";
import { MessageSquare } from "lucide-react";

export function ChatPanel() {
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const conversations = useChatStore((s) => s.conversations);
  const getConversationPartner = useChatStore((s) => s.getConversationPartner);
  const openConversation = useChatStore((s) => s.openConversation);
  const setSidebarOpen = useChatStore((s) => s.setSidebarOpen);
  const typingUsers = useChatStore((s) => s.typingUsers);
  const currentUserId = useChatStore((s) => s.currentUserId);
  const getUser = useChatStore((s) => s.getUser);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const partner = activeConversation ? getConversationPartner(activeConversation) : undefined;

  // Get typing user names for the active conversation
  const typingUserNames = activeConversationId
    ? (typingUsers[activeConversationId] || [])
      .filter((userId) => userId !== currentUserId)
      .map((userId) => getUser(userId)?.name || "Someone")
    : [];

  const handleBack = () => {
    void openConversation(null);
    setSidebarOpen(true);
  };

  if (!activeConversation || !partner) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-background text-muted-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <MessageSquare className="h-8 w-8" />
          </div>
          <p className="text-sm">Select a chat to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-background">
      <ChatHeader partner={partner} onBack={handleBack} />
      <MessageList />
      <TypingIndicator usersTyping={typingUserNames} />
      <MessageInput key={activeConversation.id} conversationId={activeConversation.id} />
    </div>
  );
}
