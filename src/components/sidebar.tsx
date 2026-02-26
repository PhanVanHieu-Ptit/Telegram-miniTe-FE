import { Input, Dropdown } from "antd";
import type { MenuProps } from "antd";
import { Menu, Search, Settings, Users, BookmarkIcon, Moon } from "lucide-react";
import { useChatStore } from "@/lib/store";
import { ChatListItem } from "./chat-list-item";

const menuItems: MenuProps["items"] = [
  { key: "new-group", label: "New Group", icon: <Users className="h-4 w-4" /> },
  { key: "bookmarks", label: "Saved Messages", icon: <BookmarkIcon className="h-4 w-4" /> },
  { key: "settings", label: "Settings", icon: <Settings className="h-4 w-4" /> },
  { key: "dark-mode", label: "Dark Mode", icon: <Moon className="h-4 w-4" /> },
];

export function Sidebar() {
  const searchQuery = useChatStore((s) => s.searchQuery);
  const setSearchQuery = useChatStore((s) => s.setSearchQuery);
  const getFilteredConversations = useChatStore((s) => s.getFilteredConversations);
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const openConversation = useChatStore((s) => s.openConversation);
  const setSidebarOpen = useChatStore((s) => s.setSidebarOpen);

  const filteredConversations = getFilteredConversations();
  const pinned = filteredConversations.filter((c) => c.pinned);
  const regular = filteredConversations.filter((c) => !c.pinned);

  const handleConversationClick = (id: string) => {
    void openConversation(id);
    setSidebarOpen(false);
  };

  return (
    <aside className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Header */}
      <header className="flex items-center gap-2 px-3 py-3">
        <Dropdown menu={{ items: menuItems }} trigger={["click"]} placement="bottomLeft">
          <button
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent"
            aria-label="Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </Dropdown>
        <Input
          placeholder="Search"
          prefix={<Search className="h-4 w-4 text-muted-foreground" />}
          variant="filled"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          allowClear
          className="flex-1"
          styles={{
            input: { backgroundColor: "transparent" },
          }}
          style={{
            backgroundColor: "var(--input)",
            borderColor: "transparent",
            borderRadius: "20px",
            height: "36px",
          }}
        />
      </header>

      {/* Chat list */}
      <nav className="flex-1 overflow-y-auto" role="list">
        {pinned.length > 0 && (
          <div>
            {pinned.map((convo) => (
              <ChatListItem
                key={convo.id}
                conversation={convo}
                active={convo.id === activeConversationId}
                onClick={() => handleConversationClick(convo.id)}
              />
            ))}
          </div>
        )}
        {regular.map((convo) => (
          <ChatListItem
            key={convo.id}
            conversation={convo}
            active={convo.id === activeConversationId}
            onClick={() => handleConversationClick(convo.id)}
          />
        ))}
        {filteredConversations.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No chats found
          </div>
        )}
      </nav>
    </aside>
  );
}
