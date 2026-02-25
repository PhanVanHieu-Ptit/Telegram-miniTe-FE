

import { Avatar, Badge } from "antd";
import { Pin, VolumeOff } from "lucide-react";
import type { Conversation } from "@/lib/types";
import { useChatStore } from "@/lib/store";
import { cn } from "@/lib/utils";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
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

interface ChatListItemProps {
  conversation: Conversation;
  active: boolean;
  onClick: () => void;
}

export function ChatListItem({ conversation, active, onClick }: ChatListItemProps) {
  const getConversationPartner = useChatStore((s) => s.getConversationPartner);
  const partner = getConversationPartner(conversation);

  if (!partner) return null;

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 px-3 py-2 text-left transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "hover:bg-accent",
        !active && partner.online ? "text-online" : "text-muted-foreground"
      )}
      role="listitem"
      aria-current={active ? "true" : undefined}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <Badge dot={partner.online} color="var(--online)" offset={[-4, 36]}>
          <Avatar
            size={48}
            style={{ backgroundColor: getAvatarColor(partner.name), fontSize: 16, fontWeight: 600 }}
          >
            {getInitials(partner.name)}
          </Avatar>
        </Badge>
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between">
          <span className={cn("truncate text-sm font-semibold", active ? "text-primary-foreground" : "text-foreground")}>
            {partner.name}
          </span>
          <span className={cn("shrink-0 text-xs", active ? "text-primary-foreground/70" : "text-muted-foreground")}>
            {conversation.lastMessage?.timestamp}
          </span>
        </div>
        <div className="flex items-center justify-between gap-1">
          <p className={cn("truncate text-sm", active ? "text-primary-foreground/80" : "text-muted-foreground")}>
            {conversation.lastMessage?.senderId === "me" && (
              <span className={cn("mr-0.5 font-medium", active ? "text-primary-foreground/80" : "text-foreground")}>
                {"You: "}
              </span>
            )}
            {conversation.lastMessage?.text}
          </p>
          <div className="flex shrink-0 items-center gap-1">
            {conversation.pinned && (
              <Pin className={cn("h-3.5 w-3.5 rotate-45", active ? "text-primary-foreground/60" : "text-muted-foreground")} />
            )}
            {conversation.muted && (
              <VolumeOff className={cn("h-3.5 w-3.5", active ? "text-primary-foreground/60" : "text-muted-foreground")} />
            )}
            {conversation.unreadCount > 0 && (
              <Badge
                count={conversation.unreadCount}
                size="small"
                style={{
                  backgroundColor: active
                    ? "rgba(255,255,255,0.3)"
                    : conversation.muted
                      ? "var(--muted-foreground)"
                      : "var(--primary)",
                  fontSize: 11,
                  minWidth: 18,
                  height: 18,
                  lineHeight: "18px",
                }}
              />
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
