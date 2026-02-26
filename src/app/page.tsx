import { useEffect } from "react";
import { Sidebar } from "@/components/sidebar";
import { ChatPanel } from "@/components/chat-panel";
import { useChatStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function Home() {
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const sidebarOpen = useChatStore((s) => s.sidebarOpen);
  const initialize = useChatStore((s) => s.initialize);

  useEffect(() => {
    void initialize();
  }, [initialize]);

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
