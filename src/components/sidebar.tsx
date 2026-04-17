import { useAuthStore } from "@/store/auth.store";
import { useChatStore } from "@/store/chat.store";
import type { MenuProps } from "antd";
import { Avatar, Dropdown, Input, Typography } from "antd";
import { BookmarkIcon, LogOut, Menu, Moon, Search, Settings, Sparkles, Users, Languages } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChatListItem } from "./chat-list-item";
import { CreateConversationButton } from "./chat/CreateConversationButton";
import { CreateConversationModal } from "./chat/CreateConversationModal";

const { Text } = Typography;

export function Sidebar() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const conversations = useChatStore((s) => s.conversations);
  const searchQuery = useChatStore((s) => s.searchQuery);
  const setSearchQuery = useChatStore((s) => s.setSearchQuery);
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const setActiveConversationId = useChatStore((s) => s.setActiveConversationId);
  const setSidebarOpen = useChatStore((s) => s.setSidebarOpen);

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter((convo) =>
      (convo.chatName && convo.chatName.toLowerCase().includes(q)) ||
      convo.members.some((m) =>
        m.fullName.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q)
      )
    );
  }, [conversations, searchQuery]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigate("/sign-in");
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
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
          <div className="flex flex-col ml-3">
            <Text strong style={{ fontSize: '13px', lineHeight: '1.2', color: 'white' }}>{user?.displayName}</Text>
            <Text style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>{user?.email}</Text>
          </div>
        </div>
      ),
    },
    { type: "divider" },
    {
      key: "summarize",
      label: t('summarize_chat'),
      icon: <Sparkles className="h-4 w-4" strokeWidth={1.5} />,
      onClick: () => navigate("/summarize")
    },
    {
      key: "new-group",
      label: t('new_group'),
      icon: <Users className="h-4 w-4" strokeWidth={1.5} />,
      onClick: () => setCreateModalOpen(true)
    },
    { key: "bookmarks", label: t('saved_messages'), icon: <BookmarkIcon className="h-4 w-4" strokeWidth={1.5} /> },
    {
      key: "language",
      label: t('language'),
      icon: <Languages className="h-4 w-4" strokeWidth={1.5} />,
      children: [
        {
          key: "en",
          label: t('english'),
          onClick: () => changeLanguage('en'),
          active: i18n.language === 'en'
        },
        {
          key: "vi",
          label: t('vietnamese'),
          onClick: () => changeLanguage('vi'),
          active: i18n.language === 'vi'
        }
      ]
    },
    { key: "settings", label: t('settings'), icon: <Settings className="h-4 w-4" strokeWidth={1.5} /> },
    { key: "dark-mode", label: t('dark_mode'), icon: <Moon className="h-4 w-4" strokeWidth={1.5} /> },
    { type: "divider" },
    {
      key: "logout",
      label: <span className="item-destructive">{t('logout')}</span>,
      icon: <LogOut className="h-4 w-4 item-destructive" strokeWidth={1.5} />,
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
    <aside className="flex h-full flex-col border-r border-white/10 bg-black/20 backdrop-blur-3xl">
      {/* Header */}
      <header className="flex items-center gap-2 px-3 py-4">
        <Dropdown menu={{ items: menuItems }} trigger={["click"]} placement="bottomLeft">
          <button
            className="flex h-10 w-10 items-center justify-center rounded-full text-secondary transition-colors hover:bg-white/5"
            aria-label="Menu"
          >
            <Menu className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </Dropdown>
        <Input
          placeholder={t('search_placeholder')}
          prefix={<Search className="h-4 w-4 text-secondary" strokeWidth={1.5} />}
          variant="filled"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          allowClear
          className="flex-1 premium-input h-10"
        />
      </header>

      {/* Action Button */}
      <div className="px-3 mb-2">
        <CreateConversationButton />
      </div>

      {/* Chat list */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 pt-2 pb-4 scrollbar-hide" role="list">
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
            {t('no_chats_found')}
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
