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
  X,
  List,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type { User, Message } from "@/types/chat.types";
import { cn } from "@/lib/utils";
import { useWebRTCContext } from "@/contexts/webrtc.context";
import { useAuthStore } from "@/store/auth.store";
import { Modal, message } from "antd";
import { useChatStore } from "@/store/chat.store";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

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
  pinnedMessages?: Message[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ChatHeader({ partner, onBack, conversationId, onOpenSearch, pinnedMessages = [] }: ChatHeaderProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { startCall } = useWebRTCContext();
  const currentUser = useAuthStore((s) => s.user);
  const deleteConversation = useChatStore((s) => s.deleteConversation);
  const unpinMessage = useChatStore((s) => s.unpinMessage);
  const [isPinnedModalOpen, setIsPinnedModalOpen] = useState(false);

  const lastPinned = pinnedMessages[pinnedMessages.length - 1];

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
    <header className="flex h-[72px] items-center gap-4 border-b border-white/5 px-4 bg-background/60 backdrop-blur-3xl z-20 overflow-hidden">
      {/* Pinned Messages Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-primary">
            <Pin className="w-5 h-5" />
            <span>{t('notifications.pinned_messages_count', { count: pinnedMessages.length })}</span>
          </div>
        }
        open={isPinnedModalOpen}
        onCancel={() => setIsPinnedModalOpen(false)}
        footer={null}
        width={400}
        centered
        className="premium-modal"
      >
        <div className="flex flex-col gap-3 mt-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar pb-2">
          {[...pinnedMessages].reverse().map((msg) => (
            <div 
              key={msg.id} 
              className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer border border-white/5 group"
              onClick={() => {
                const element = document.getElementById(`msg-${msg.id}`);
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                } else {
                  navigate(`/chat?id=${conversationId}&msgId=${msg.id}`);
                }
                setIsPinnedModalOpen(false);
              }}
            >
              <div className="w-[3px] self-stretch bg-primary rounded-full shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                   <span className="text-xs font-bold text-primary truncate">
                     {msg.senderId === currentUser?.id ? t('you') : partner.displayName}
                   </span>
                   <span className="text-[10px] text-muted-foreground/50 shrink-0">
                     {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                   </span>
                </div>
                <p className="text-[13px] text-foreground/90 line-clamp-2 leading-relaxed">
                  {msg.content || t('notifications.attachment')}
                </p>
              </div>
              <button 
                className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground/30 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  unpinMessage(conversationId, msg.id);
                }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </Modal>

      {/* Mobile back button */}
      <button
        onClick={onBack}
        className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent md:hidden"
      >
        <ArrowLeft className="h-5 w-5" strokeWidth={1.5} />
      </button>

      {/* User info (Left Side) */}
      <div className={cn("flex items-center gap-3", lastPinned ? "max-w-[200px] shrink-0" : "flex-1")}>
        <Avatar
          size={44}
          style={{
            backgroundColor: getAvatarColor(partner.displayName || ""),
            fontSize: 16,
            fontWeight: 600,
          }}
        >
          {getInitials(partner.displayName)}
        </Avatar>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-bold text-foreground leading-tight">
            {partner.displayName}
          </span>
          <span
            className={cn(
              "text-[12px] font-medium tracking-tight",
              partner.online ? "text-primary/90" : "text-muted-foreground/60"
            )}
          >
            {partner.online
              ? t('online')
              : `${t('last_seen')} ${partner.lastSeenAt ?? t('recently')}`}
          </span>
        </div>
      </div>

      {/* Pinned Message Section (Middle/Right) */}
      {lastPinned && (
        <div 
          className="flex-1 flex items-center gap-3 px-4 h-full cursor-pointer hover:bg-white/5 transition-colors relative group/pin"
          onClick={() => {
            const element = document.getElementById(`msg-${lastPinned.id}`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
              navigate(`/chat?id=${conversationId}&msgId=${lastPinned.id}`);
            }
          }}
        >
          {/* Blue Vertical Line */}
          <div className="absolute left-4 top-[20%] bottom-[20%] w-[2px] bg-primary rounded-full shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
          
          <div className="flex flex-col flex-1 min-w-0 pl-3">
            <span className="text-[13px] font-bold text-primary tracking-tight leading-tight">
              {pinnedMessages.length > 1 
                ? t('notifications.pinned_messages_count', { count: pinnedMessages.length }) 
                : t('notifications.pinned_message')}
            </span>
            <span className="truncate text-[13px] text-foreground/80 font-medium">
              {lastPinned.content || t('notifications.attachment')}
            </span>
          </div>

          {/* Pin List Button */}
          <button 
            className="flex items-center justify-center p-2 rounded-xl text-foreground/30 hover:text-primary hover:bg-primary/10 transition-all group"
            title="View pin list"
            onClick={(e) => {
               e.stopPropagation();
               setIsPinnedModalOpen(true); 
            }}
          >
            <div className="relative">
              <List className="w-5 h-5" strokeWidth={1.5} />
              <Pin className="w-3 h-3 absolute -right-1.5 -top-1.5 fill-current opacity-40 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>
        </div>
      )}

      {/* Actions (Right Side) */}
      <div className="flex items-center gap-1 shrink-0 ml-auto">
        <button
          onClick={() => void startCall(partner.id, currentUser?.displayName ?? 'You')}
          className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary"
        >
          <Phone className="h-5 w-5" strokeWidth={1.5} />
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
            className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-all hover:bg-accent"
          >
            <MoreVertical className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </Dropdown>
      </div>
    </header>
  );
}
