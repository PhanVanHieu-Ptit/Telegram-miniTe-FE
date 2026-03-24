import { useAuthStore } from "@/store/auth.store";
import { useChatStore } from "@/store/chat.store";
import type { MenuProps } from "antd";
import { Avatar, Dropdown, Input, Typography } from "antd";
import { BookmarkIcon, LogOut, Menu, Moon, Search, Settings, Sparkles, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChatListItem } from "./chat-list-item";
import { CreateConversationButton } from "./chat/CreateConversationButton";
import { CreateConversationModal } from "./chat/CreateConversationModal";

const { Text } = Typography;

export function Sidebar() {
  const navigate = useNavigate();
  const searchQuery = useChatStore((s) => s.searchQuery);
  const setSearchQuery = useChatStore((s) => s.setSearchQuery);
  const filteredConversations = useChatStore((s) => s.getFilteredConversations());
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const setActiveConversationId = useChatStore((s) => s.setActiveConversationId);
  const setSidebarOpen = useChatStore((s) => s.setSidebarOpen);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigate("/sign-in");
  };

  function getInitials(name: string = "") {
    if (!name) return "";
    return name
      .split(" ")
      .map((w) => w[0])
      .filter(Boolean)
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  const avatarColors = [
    "#5B8DEF",
    "#E17076",
    "#FAA05A",
    "#7BC862",
    "#6EC9CB",
    "#EE7AAE",
    "#E8A64A",
    "#65AADD",
  ];

  function getAvatarColor(name: string) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return avatarColors[Math.abs(hash) % avatarColors.length];
  }

  const avatarColor = useMemo(() => {
    return getAvatarColor(user?.displayName || "");
  }, [user?.displayName]);

  const menuItems: MenuProps["items"] = [
    {
      key: "user-info",
      label: (
        <div className="px-1 py-1 flex items-center">
          <Avatar
            size={32}
            src={user?.avatarUrl}
            style={{
              backgroundColor: avatarColor,
              fontSize: 12,
              fontWeight: 600,
              border: "none"
            }}
          >
            {getInitials(user?.displayName)}
          </Avatar>
          <Text strong style={{ fontSize: '12px', lineHeight: '1', marginLeft: '8px' }}>{user?.displayName}</Text>
        </div>
      ),
    },
    { type: "divider" },
    {
      key: "summarize",
      label: "Summarize Chat",
      icon: <Sparkles className="h-4 w-4" />,
      onClick: () => navigate("/summarize")
    },
    {
      key: "new-group",
      label: "New Group",
      icon: <Users className="h-4 w-4" />,
      onClick: () => setCreateModalOpen(true)
    },
    { key: "bookmarks", label: "Saved Messages", icon: <BookmarkIcon className="h-4 w-4" /> },
    { key: "settings", label: "Settings", icon: <Settings className="h-4 w-4" /> },
    { key: "dark-mode", label: "Dark Mode", icon: <Moon className="h-4 w-4" /> },
    { type: "divider" },
    {
      key: "logout",
      label: "Logout",
      icon: <LogOut className="h-4 w-4" />,
      danger: true,
      onClick: handleLogout,
    },
  ];

  const pinned = filteredConversations.filter((c) => c.pinned);
  const regular = filteredConversations.filter((c) => !c.pinned);

  const handleConversationClick = (id: string) => {
    setActiveConversationId(id);
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

      {/* Action Button */}
      <CreateConversationButton />

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
            onClick={() => {
              handleConversationClick(convo.id)
            }
            }
          />
        ))}
        {filteredConversations.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No chats found
          </div>
        )}
      </nav>

      <CreateConversationModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
    </aside>
  );
}
