
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
      <div className="flex flex-1 flex-col items-center justify-center bg-transparent text-white/40">
        <div className="flex flex-col items-center gap-6 max-w-sm text-center px-4">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-[40px] rounded-full" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl">
              <MessageSquare className="h-10 w-10 text-primary/60" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold tracking-tight text-white/80">Celestial Messaging</h3>
            <p className="text-sm leading-relaxed">Select a transmission terminal from the sidebar to establish a secure link and begin communication.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-transparent">
      <ChatHeader partner={partner} onBack={handleBack} conversationId={activeConversation.id} />
      <MessageList />
      <TypingIndicator usersTyping={typingUserNames} />
      <MessageInput key={activeConversation.id} conversationId={activeConversation.id} />
    </div>
  );
}
