
import { useMemo } from "react";
import { useChatStore } from "@/store/chat.store";
import { ChatHeader } from "./chat-header";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import { TypingIndicator } from "./typing-indicator";
import { MessageSquare } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";

export function ChatPanel() {
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const conversations = useChatStore((s) => s.conversations);
  const setActiveConversationId = useChatStore((s) => s.setActiveConversationId);
  const setSidebarOpen = useChatStore((s) => s.setSidebarOpen);
  const typingUsers = useChatStore((s) => s.typingUsers);
  const { id: currentUserId } = useAuthStore((state) => state.user) || {};
  const getUser = useChatStore((s) => s.getUser);

  const handleBack = () => {
    setActiveConversationId(null);
    setSidebarOpen(true);
  };

  console.log("ChatPanel state:", { activeConversationId, conversationsCount: conversations.length });

  const sortedConversations = useMemo(() => {
    return [...conversations].sort((a: { updatedAt: string }, b: { updatedAt: string }) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [conversations]);

  const activeConversation = sortedConversations.find((c: { id: string }) => c.id === activeConversationId);
  const partner = useMemo(() => {
    if (!activeConversation || !activeConversation.members || activeConversation.members.length === 0) return undefined;
    let member;
    if (activeConversation.members.length === 2) {
      member = activeConversation.members.find((m: { id: string }) => m.id !== currentUserId);
    } else {
      member = activeConversation.members.find((m: { id: string }) => m.id !== currentUserId) || activeConversation.members[0];
    }
    if (!member) return undefined;
    // Map ConversationMember to User
    return {
      id: member.id,
      displayName: member.fullName,
      avatarUrl: member.avatarUrl ?? "",
      online: false,
      lastSeenAt: undefined,
    };
  }, [activeConversation, currentUserId]);

  // Get typing user names for the active conversation
  const typingUserNames = activeConversationId
    ? (typingUsers[activeConversationId] || [])
      .filter((userId) => userId !== currentUserId)
      .map((userId) => getUser(userId)?.name || "Someone")
    : [];

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
