import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { Avatar, Badge } from "antd";
import { Pin, VolumeOff } from "lucide-react";
import type { Conversation } from "@/types/chat.types";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import dayjs from "dayjs";
import { getMessagePreview } from "@/lib/message-utils";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

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

const ChatListItemComponent = ({ conversation, active, onClick }: ChatListItemProps) => {
  // Connect to Zustand store to get conversation partner
  // Find the other member for 1-1 chat
  const { id: currentUserId } = useAuthStore((state) => state.user) || {};
  const otherMember = useMemo(() => {
    if (!conversation.members || conversation.members.length === 0) return null;
    if (conversation.members.length === 2) {
      return conversation.members.find((m) => m.id !== currentUserId);
    }
    // For group chat, fallback to first member not current user
    return conversation.members.find((m) => m.id !== currentUserId) || conversation.members[0];
  }, [conversation.members, currentUserId]);

  const avatarColor = useMemo(() => {
    if (!otherMember) return avatarColors[0];
    return getAvatarColor(otherMember.fullName);
  }, [otherMember]);


  if (!otherMember) return null;

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 px-3 py-2 text-left transition-colors duration-300 rounded-xl my-0.5 border border-transparent",
        active
          ? "bg-primary text-white shadow-[0_10px_20px_rgba(0,0,0,0.3)] scale-[1.02] z-10"
          : "hover:bg-white/5 hover:border-white/10",
        "text-muted-foreground"
      )}
      role="listitem"
      aria-current={active ? "true" : undefined}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <Badge dot={false} color="var(--online)" offset={[-4, 36]}>
          <Avatar
            size={48}
            src={otherMember.avatarUrl || undefined}
            style={{ backgroundColor: avatarColor, fontSize: 16, fontWeight: 600 }}
          >
            {!otherMember.avatarUrl && getInitials(otherMember.fullName)}
          </Avatar>
        </Badge>
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between">
          <span className={cn("truncate text-sm font-semibold", active ? "text-white" : "text-white")}>
            {conversation?.chatName !== '' ? conversation?.chatName : otherMember.fullName}
          </span>
          <span className={cn("shrink-0 text-[10px] font-medium tracking-wide opacity-60", active ? "text-white/80" : "text-secondary")}>
            {dayjs(conversation.updatedAt).isSame(dayjs(), "day")
              ? dayjs(conversation.updatedAt).format("HH:mm")
              : dayjs(conversation.updatedAt).format("MM/DD/YYYY")}
          </span>
        </div>
        <div className="flex items-center justify-between gap-1">
          <p className={cn("truncate text-[13px] leading-relaxed", active ? "text-white/70 font-medium" : "text-secondary")}>
            {conversation.lastMessage?.senderId === currentUserId && (
              <span className={cn("mr-0.5 font-semibold", active ? "text-white/90" : "text-white/40")}>
                {"You: "}
              </span>
            )}
            {getMessagePreview(conversation.lastMessage)}
          </p>
          <div className="flex shrink-0 items-center gap-1">
            {conversation.pinned && (
              <Pin strokeWidth={1.5} className={cn("h-3 w-3 rotate-45", active ? "text-white" : "text-secondary opacity-60")} />
            )}
            {conversation.muted && (
              <VolumeOff strokeWidth={1.5} className={cn("h-3 w-3", active ? "text-white" : "text-secondary opacity-60")} />
            )}
            {conversation.unreadCount > 0 && (
              <Badge
                count={conversation.unreadCount}
                size="small"
                style={{
                  backgroundColor: active
                    ? "rgba(255,255,255,0.2)"
                    : conversation.muted
                      ? "rgba(255,255,255,0.1)"
                      : "#2563eb",
                  fontSize: 10,
                  fontWeight: 700,
                  minWidth: 18,
                  height: 18,
                  lineHeight: "18px",
                  border: 'none',
                  color: 'white'
                }}
              />
            )}
          </div>
        </div>
      </div>
    </motion.button>
  );
};

// Memoize component to prevent unnecessary re-renders in chat list
export const ChatListItem = memo(ChatListItemComponent);
