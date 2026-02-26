

import { useEffect } from "react";
import { useChatStore } from "@/lib/store";
import { getMqttBridge } from "@/lib/mqtt-bridge";
import { ChatHeader } from "./chat-header";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import { MessageSquare } from "lucide-react";

export function ChatPanel() {
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const conversations = useChatStore((s) => s.conversations);
  const getConversationPartner = useChatStore((s) => s.getConversationPartner);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const setSidebarOpen = useChatStore((s) => s.setSidebarOpen);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const partner = activeConversation ? getConversationPartner(activeConversation) : undefined;
  const markConversationSeenBy = useChatStore((s) => s.markConversationSeenBy);
  const currentUserId = useChatStore((s) => s.currentUserId);

  useEffect(() => {
    if (!activeConversationId) return;

    markConversationSeenBy(activeConversationId, currentUserId);

    try {
      const bridge = getMqttBridge({
        url: process.env.NEXT_PUBLIC_MQTT_URL ?? "ws://localhost:9001",
      });
      void bridge.publishSeen(activeConversationId);
    } catch {
      // MQTT not connected — local-only is fine
    }
  }, [activeConversationId, currentUserId, markConversationSeenBy]);

  const handleBack = () => {
    setActiveConversation(null);
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
      <MessageInput key={activeConversation.id} conversationId={activeConversation.id} />
    </div>
  );
}
