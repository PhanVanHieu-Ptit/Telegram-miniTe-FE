import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { Avatar, Badge, Dropdown, Modal, message } from "antd";
import type { MenuProps } from "antd";
import { Pin, PinOff, VolumeOff, Trash2 } from "lucide-react";
import type { Conversation } from "@/types/chat.types";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import { useChatStore } from "@/store/chat.store";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { getMessagePreview } from "@/lib/message-utils";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import { useTranslation } from "react-i18next";
import { BookmarkIcon } from "lucide-react";

dayjs.extend(utc);
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
  const { t } = useTranslation();
  const { id: currentUserId } = useAuthStore((state) => state.user) || {};
  
  const isSavedMessages = useMemo(() => {
    return conversation.members?.length === 1 && conversation.members[0].id === currentUserId;
  }, [conversation.members, currentUserId]);

  const isGroup = conversation.type === 'group' || (conversation.participantIds && conversation.participantIds.length > 2);

  const otherMember = useMemo(() => {
    if (isSavedMessages) return conversation.members[0];
    if (!conversation.members || conversation.members.length === 0) return null;
    if (conversation.members.length === 2) {
      return conversation.members.find((m) => m.id !== currentUserId);
    }
    // For group chat, fallback to first member not current user
    return conversation.members.find((m) => m.id !== currentUserId) || conversation.members[0];
  }, [conversation.members, currentUserId, isSavedMessages]);

  const avatarColor = useMemo(() => {
    if (isGroup && conversation.chatName) return getAvatarColor(conversation.chatName);
    if (!otherMember) return avatarColors[0];
    return getAvatarColor(otherMember.fullName);
  }, [otherMember, isGroup, conversation.chatName]);

  const displayName = useMemo(() => {
    if (isSavedMessages) return t('saved_messages');
    if (isGroup) {
      return (conversation.chatName && conversation.chatName.trim() !== '') 
        ? conversation.chatName 
        : conversation.members?.map(m => m.fullName).join(", ") || "Group";
    }
    return conversation?.chatName && conversation.chatName.trim() !== '' ? conversation.chatName : (otherMember?.fullName || "");
  }, [isSavedMessages, isGroup, conversation, otherMember, t]);


  const pinConversation = useChatStore((s) => s.pinConversation);
  const unpinConversation = useChatStore((s) => s.unpinConversation);
  const deleteConversation = useChatStore((s) => s.deleteConversation);

  const handleMenuClick: MenuProps["onClick"] = ({ key, domEvent }) => {
    domEvent.stopPropagation();
    if (key === "pin") {
      void pinConversation(conversation.id);
      message.success(t('conversation_pinned', { defaultValue: 'Conversation pinned' }));
    } else if (key === "unpin") {
      void unpinConversation(conversation.id);
      message.success(t('conversation_unpinned', { defaultValue: 'Conversation unpinned' }));
    } else if (key === "delete") {
      Modal.confirm({
        title: t('delete_chat_modal_title'),
        content: t('delete_chat_modal_content'),
        okText: t('delete_chat'),
        okType: "danger",
        cancelText: t('cancel'),
        onOk: async () => {
          try {
            await deleteConversation(conversation.id);
            message.success(t('chat_deleted_successfully'));
          } catch (error) {
            message.error(t('failed_to_delete_chat'));
            console.error(error);
          }
        },
      });
    }
  };

  const contextMenuItems: MenuProps["items"] = [
    conversation.pinned
      ? {
          key: "unpin",
          label: t('unpin_conversation', { defaultValue: 'Unpin conversation' }),
          icon: <PinOff className="h-4 w-4" strokeWidth={1.5} />,
        }
      : {
          key: "pin",
          label: t('pin_conversation'),
          icon: <Pin className="h-4 w-4" strokeWidth={1.5} />,
        },
    { type: "divider" },
    {
      key: "delete",
      label: <span className="item-destructive">{t('delete_chat')}</span>,
      icon: <Trash2 className="h-4 w-4 item-destructive" strokeWidth={1.5} />,
      danger: true,
    },
  ];

  if (!otherMember) return null;

  return (
    <Dropdown menu={{ items: contextMenuItems, onClick: handleMenuClick }} trigger={['contextMenu']}>
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
            src={isSavedMessages ? undefined : isGroup ? undefined : (otherMember.avatarUrl || undefined)}
            style={{ 
                backgroundColor: isSavedMessages ? '#54a7f2' : avatarColor, 
                fontSize: 16, 
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
            icon={isSavedMessages ? <BookmarkIcon className="w-6 h-6 text-white" /> : null}
          >
            {!isSavedMessages && !isGroup && !otherMember.avatarUrl && getInitials(otherMember.fullName)}
            {!isSavedMessages && isGroup && getInitials(displayName)}
          </Avatar>
        </Badge>
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between">
          <span className={cn("truncate text-sm font-semibold", active ? "text-white" : "text-white")}>
            {displayName}
          </span>
          <span className={cn("shrink-0 text-[10px] font-medium tracking-wide opacity-60", active ? "text-white/80" : "text-secondary")}>
            {dayjs.utc(conversation.updatedAt).local().isSame(dayjs(), "day")
              ? dayjs.utc(conversation.updatedAt).local().format("HH:mm")
              : dayjs.utc(conversation.updatedAt).local().format("MM/DD/YYYY")}
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
    </Dropdown>
  );
};

// Memoize component to prevent unnecessary re-renders in chat list
export const ChatListItem = memo(ChatListItemComponent);
