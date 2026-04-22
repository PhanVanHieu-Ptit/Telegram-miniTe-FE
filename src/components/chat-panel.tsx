
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useChatStore } from "@/store/chat.store";
import { ChatHeader } from "./chat-header";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import { TypingIndicator } from "./typing-indicator";
import { MessageSquare, Pin, X } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { SearchSidebar } from "./search-sidebar";

export function ChatPanel() {
  const { t } = useTranslation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const conversations = useChatStore((s) => s.conversations);
  const setActiveConversationId = useChatStore((s) => s.setActiveConversationId);
  const setSidebarOpen = useChatStore((s) => s.setSidebarOpen);
  const typingUsers = useChatStore((s) => s.typingUsers);
  const { id: currentUserId } = useAuthStore((state) => state.user) || {};
  const getUser = useChatStore((s) => s.getUser);
  const messages = useChatStore((s) => s.messages);
  const unpinMessage = useChatStore((s) => s.unpinMessage);

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
      .map((userId) => getUser(userId)?.name || t('someone'))
    : [];

  if (!activeConversation || !partner) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-transparent text-white/40">
        <div className="flex flex-col items-center gap-8 max-w-md text-center px-8">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full animate-pulse" />
            <div className="relative flex h-32 w-32 items-center justify-center rounded-3xl bg-white/5 border border-white/10 backdrop-blur-3xl shadow-2xl neon-border">
              <MessageSquare className="h-12 w-12 text-primary/80" />
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="headline-premium text-3xl">{t('neural_interface')}</h3>
            <p className="sub-header-premium !text-white/40 !tracking-widest !normal-case">{t('select_terminal')}</p>
            <p className="text-sm leading-relaxed text-white/30 max-w-xs mx-auto">{t('encryption_notice')}</p>
          </div>
        </div>
      </div>
    );
  }

  // Get pinned messages
  const pinnedMessages = messages.filter(m => m.isPinned);

  return (
    <div className="flex flex-1 flex-col bg-transparent relative">
      <ChatHeader partner={partner} onBack={handleBack} conversationId={activeConversation.id} onOpenSearch={() => setIsSearchOpen(true)} />
      
      <SearchSidebar 
        open={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
        conversationId={activeConversation.id} 
      />
      
      {/* Pinned Messages Banner */}
      {pinnedMessages.length > 0 && (
        <div className="bg-black/20 border-b border-white/5 px-4 py-2 flex flex-col gap-1 z-10 shadow-md">
          {pinnedMessages.map((msg) => (
            <div key={msg.id} className="flex items-center justify-between text-xs p-1.5 bg-white/5 rounded hover:bg-white/10 transition">
              <div className="flex items-center gap-2 overflow-hidden">
                <Pin className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                <span className="font-semibold text-white/70 shrink-0">{getUser(msg.senderId)?.displayName || t('someone')}:</span>
                <span className="truncate text-white/50">{msg.content || t('attachment')}</span>
              </div>
              <button
                className="text-white/30 hover:text-red-400 p-1 rounded-full hover:bg-white/10 transition shrink-0 ml-2"
                onClick={() => unpinMessage(activeConversation.id, msg.id)}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <MessageList />
      <TypingIndicator usersTyping={typingUserNames} />
      <MessageInput key={activeConversation.id} conversationId={activeConversation.id} />
    </div>
  );
}
