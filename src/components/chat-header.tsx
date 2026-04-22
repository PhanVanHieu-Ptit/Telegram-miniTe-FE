import { Avatar, Dropdown } from "antd";
import type { MenuProps } from "antd";
import {
  ArrowLeft,
  Search,
  Phone,
  MoreVertical,
  Trash2,
  VolumeOff,
  Pin,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type { User } from "@/types/chat.types";
import { cn } from "@/lib/utils";
import { useWebRTCContext } from "@/contexts/webrtc.context";
import { useAuthStore } from "@/store/auth.store";
import { Modal, message } from "antd";
import { useChatStore } from "@/store/chat.store";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ChatHeaderProps {
  partner: User;
  onBack: () => void;
  conversationId: string;
  onOpenSearch?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ChatHeader({ partner, onBack, conversationId, onOpenSearch }: ChatHeaderProps) {
  const { t } = useTranslation();
  const { startCall } = useWebRTCContext();
  const currentUser = useAuthStore((s) => s.user);
  const deleteConversation = useChatStore((s) => s.deleteConversation);

  const dropdownItems: MenuProps["items"] = [
    {
      key: "search",
      label: t('search_messages'),
      icon: <Search className="h-4 w-4" strokeWidth={1.5} />,
    },
    {
      key: "pin",
      label: t('pin_conversation'),
      icon: <Pin className="h-4 w-4" strokeWidth={1.5} />,
    },
    {
      key: "mute",
      label: t('mute_notifications'),
      icon: <VolumeOff className="h-4 w-4" strokeWidth={1.5} />,
    },
    { type: "divider" },
    {
      key: "delete",
      label: <span className="item-destructive">{t('delete_chat')}</span>,
      icon: <Trash2 className="h-4 w-4 item-destructive" strokeWidth={1.5} />,
      danger: true,
    },
  ];

  const handleCallClick = () => {
    void startCall(partner.id, currentUser?.displayName ?? 'You');
  };

  const handleMenuClick: MenuProps["onClick"] = ({ key }) => {
    if (key === "delete") {
      Modal.confirm({
        title: t('delete_chat_modal_title'),
        content: t('delete_chat_modal_content'),
        okText: t('delete_chat'),
        okType: "danger",
        cancelText: t('cancel'),
        onOk: async () => {
          try {
            await deleteConversation(conversationId);
            message.success(t('chat_deleted_successfully'));
            onBack();
          } catch (error) {
            message.error(t('failed_to_delete_chat'));
            console.error(error);
          }
        },
      });
    } else if (key === "search") {
      onOpenSearch?.();
    }
  };

  return (
    <header className="flex items-center gap-3 border-b border-white/5 px-4 py-3 bg-black/10 backdrop-blur-2xl">
      {/* Mobile back button */}
      <button
        onClick={onBack}
        className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent md:hidden"
        aria-label={t('back_to_chats')}
      >
        <ArrowLeft className="h-5 w-5" strokeWidth={1.5} />
      </button>

      {/* User info */}
      <div className="flex flex-1 items-center gap-3">
        <Avatar
          size={40}
          style={{
            backgroundColor: getAvatarColor(partner.displayName || ""),
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {getInitials(partner.displayName)}
        </Avatar>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-semibold text-foreground">
            {partner.displayName}
          </span>
          <span
            className={cn(
              "text-xs",
              partner.online ? "text-online" : "text-muted-foreground"
            )}
          >
            {partner.online
              ? t('online')
              : `${t('last_seen')} ${partner.lastSeenAt ?? t('recently')}`}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* ── Video call button ───────────────────────────────────────── */}
        <button
          id="video-call-open-btn"
          onClick={handleCallClick}
          className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent"
          aria-label={t('video_call')}
        >
          <Phone className="h-5 w-5" strokeWidth={1.5} />
        </button>

        <button
          onClick={onOpenSearch}
          className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent"
          aria-label={t('search')}
        >
          <Search className="h-5 w-5" strokeWidth={1.5} />
        </button>

        <Dropdown
          menu={{
            items: dropdownItems,
            onClick: handleMenuClick
          }}
          trigger={["click"]}
          placement="bottomRight"
        >
          <button
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent"
            aria-label={t('more_options')}
          >
            <MoreVertical className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </Dropdown>
      </div>
    </header>
  );
}
