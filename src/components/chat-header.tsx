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
import type { User } from "@/types/chat.types";
import { cn } from "@/lib/utils";
import { useWebRTCContext } from "@/contexts/webrtc.context";
import { useAuthStore } from "@/store/auth.store";

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

const dropdownItems: MenuProps["items"] = [
  {
    key: "search",
    label: "Search messages",
    icon: <Search className="h-4 w-4" />,
  },
  {
    key: "pin",
    label: "Pin conversation",
    icon: <Pin className="h-4 w-4" />,
  },
  {
    key: "mute",
    label: "Mute notifications",
    icon: <VolumeOff className="h-4 w-4" />,
  },
  { type: "divider" },
  {
    key: "delete",
    label: "Delete chat",
    icon: <Trash2 className="h-4 w-4" />,
    danger: true,
  },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ChatHeaderProps {
  partner: User;
  onBack: () => void;
  conversationId: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

import { Modal, message } from "antd";
import { useChatStore } from "@/store/chat.store";

export function ChatHeader({ partner, onBack, conversationId }: ChatHeaderProps) {
  const { startCall } = useWebRTCContext();
  const currentUser = useAuthStore((s) => s.user);
  const deleteConversation = useChatStore((s) => s.deleteConversation);

  const handleCallClick = () => {
    void startCall(partner.id, currentUser?.displayName ?? 'You');
  };

  const handleMenuClick: MenuProps["onClick"] = ({ key }) => {
    if (key === "delete") {
      Modal.confirm({
        title: "Delete Chat",
        content: "Are you sure you want to delete this chat? This action cannot be undone.",
        okText: "Delete",
        okType: "danger",
        cancelText: "Cancel",
        onOk: async () => {
          try {
            await deleteConversation(conversationId);
            message.success("Chat deleted successfully");
            onBack();
          } catch (error) {
            message.error("Failed to delete chat");
            console.error(error);
          }
        },
      });
    }
  };

  return (
    <header className="flex items-center gap-3 border-b border-white/10 px-3 py-2.5 backdrop-blur-md" style={{ background: "rgba(10, 15, 25, 0.4)" }}>
      {/* Mobile back button */}
      <button
        onClick={onBack}
        className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent md:hidden"
        aria-label="Back to chats"
      >
        <ArrowLeft className="h-5 w-5" />
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
              ? "online"
              : `last seen ${partner.lastSeenAt ?? "recently"}`}
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
          aria-label="Video call"
        >
          <Phone className="h-5 w-5" />
        </button>

        <button
          className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent"
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
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
            aria-label="More options"
          >
            <MoreVertical className="h-5 w-5" />
          </button>
        </Dropdown>
      </div>
    </header>
  );
}
