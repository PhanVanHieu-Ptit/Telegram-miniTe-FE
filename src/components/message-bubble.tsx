

import { memo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { Avatar, Dropdown } from "antd";
import type { MenuProps } from "antd";
import { Check, CheckCheck, SmilePlus, RefreshCw, Pin, EyeOff, MoreVertical, PinOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message, User } from "@/types/chat.types";
import dayjs from "dayjs";
import { MessageRenderer } from "./chat/messages/MessageRenderer";
import { useChatStore } from "@/store/chat.store";

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  showAvatar: boolean;
  showTimestamp: boolean;
  seen: boolean;
  sender?: User;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(id: string): string {
  const colors = [
    "#5B8DEF",
    "#E57373",
    "#81C784",
    "#FFB74D",
    "#BA68C8",
    "#4DB6AC",
    "#F06292",
    "#AED581",
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export const MessageBubble = memo(function MessageBubble({
  message,
  isOwnMessage,
  showAvatar,
  showTimestamp,
  seen,
  sender,
}: MessageBubbleProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { reactMessage, pinMessage, unpinMessage, hideMessage } = useChatStore(
    useShallow((s) => ({
      reactMessage: s.reactMessage,
      pinMessage: s.pinMessage,
      unpinMessage: s.unpinMessage,
      hideMessage: s.hideMessage,
    }))
  );
  
  const REACTION_LIST = ['👍', '❤️', '😂', '😮', '😢', '😡'];



  const handleReact = (emoji: string) => {
    setShowEmojiPicker(false);
    if (!message.id) return;
    void reactMessage(message.conversationId, message.id, emoji);
  };

  const handleActionClick: MenuProps['onClick'] = (e) => {
    if (!message.id) return;
    if (e.key === 'pin') {
      void pinMessage(message.conversationId, message.id);
    } else if (e.key === 'unpin') {
      void unpinMessage(message.conversationId, message.id);
    } else if (e.key === 'hide') {
      void hideMessage(message.conversationId, message.id);
    }
  };

  const actionItems: MenuProps['items'] = [
    message.isPinned
      ? { key: 'unpin', label: 'Unpin Message', icon: <PinOff className="w-4 h-4" /> }
      : { key: 'pin', label: 'Pin Message', icon: <Pin className="w-4 h-4" /> },
    { key: 'hide', label: 'Hide for me', icon: <EyeOff className="w-4 h-4" />, danger: true },
  ];

  return (
    <div
      className={cn(
        "flex items-end gap-2 group",
        isOwnMessage ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar slot */}
      <div className="w-8 shrink-0">
        {!isOwnMessage && showAvatar && sender ? (
          <Avatar
            size={32}
            src={sender.avatarUrl || undefined}
            style={{
              backgroundColor: sender.avatarUrl
                ? undefined
                : getAvatarColor(sender.id),
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {!sender.avatarUrl && getInitials(sender.displayName)}
          </Avatar>
        ) : null}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          "relative max-w-[75%] px-4 py-2.5 text-sm leading-relaxed md:max-w-[60%] backdrop-blur-xl transition-all",
          isOwnMessage
            ? "rounded-2xl rounded-br-sm bg-gradient-to-br from-primary to-accent text-white shadow-lg shadow-primary/20"
            : "rounded-2xl rounded-bl-sm bg-white/5 text-white/90 border border-white/10 shadow-sm",
          showAvatar
            ? ""
            : isOwnMessage
              ? "rounded-br-2xl"
              : "rounded-bl-2xl"
        )}
      >
        {message.isPinned && (
          <div className="absolute -top-2 -right-2 bg-yellow-500/90 rounded-full p-1 shadow-sm text-white border border-yellow-400">
            <Pin className="w-3 h-3 fill-current" />
          </div>
        )}
        <MessageRenderer message={message} />

        {/* Timestamp + seen indicator — hidden during upload */}
        {showTimestamp && message.status !== 'uploading' && (
          <span
            className={cn(
              "ml-2 inline-flex shrink-0 items-center gap-0.5 align-bottom text-[10px] leading-none select-none",
              isOwnMessage
                ? "text-bubble-out-foreground/50"
                : "text-muted-foreground"
            )}
          >
            {dayjs(message.timestamp).isSame(dayjs(), "day")
              ? dayjs(message.timestamp).format("HH:mm")
              : dayjs(message.timestamp).format("MM/DD/YYYY")}
            {isOwnMessage &&
              (seen ? (
                <CheckCheck className="h-3.5 w-3.5 text-primary" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              ))}
          </span>
        )}

        {/* Uploading badge */}
        {message.status === 'uploading' && (
          <span className="inline-flex items-center gap-1 text-[10px] text-white/50 animate-pulse mt-0.5">
            <span className="w-2 h-2 rounded-full border border-white/20 border-t-white animate-spin inline-block" />
            Uploading…
          </span>
        )}

        {/* Failed badge */}
        {message.status === 'failed' && (
          <span className="inline-flex items-center gap-1 text-[10px] text-red-400 mt-0.5">
            <RefreshCw className="h-3 w-3" />
            Failed
          </span>
        )}
        
        {/* Reactions Render */}
        {message.reactions && Object.keys(message.reactions).length > 0 && (
          <div className={cn("absolute -bottom-3 flex gap-1 bg-[#1e2330] p-0.5 px-1 rounded-full border border-white/10 shadow-sm z-10 scale-90", isOwnMessage ? "right-2 origin-bottom-right" : "left-2 origin-bottom-left")}>
            {Object.entries(message.reactions).map(([emoji, users]) => (
              <div key={emoji} className="flex items-center gap-1 bg-white/5 rounded-full px-1.5 py-0.5">
                <span className="text-xs">{emoji}</span>
                <span className="text-[10px] text-white/70 font-semibold">{users.length}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hover actions block */}
      <div className={cn("relative opacity-0 group-hover:opacity-100 transition-opacity flex items-center mb-4 shrink-0", isOwnMessage ? "pr-2" : "pl-2")}>
        <button
           type="button"
           onClick={() => setShowEmojiPicker(!showEmojiPicker)}
           className="w-7 h-7 flex items-center justify-center rounded-full text-white/50 hover:text-white hover:bg-white/10 transition"
        >
           <SmilePlus className="w-4 h-4" />
        </button>
        <Dropdown menu={{ items: actionItems, onClick: handleActionClick }} trigger={['click']} placement="topRight">
          <button
             type="button"
             className="w-7 h-7 flex items-center justify-center rounded-full text-white/50 hover:text-white hover:bg-white/10 transition"
          >
             <MoreVertical className="w-4 h-4" />
          </button>
        </Dropdown>
        {showEmojiPicker && (
          <div className={cn("absolute bottom-full mb-1 z-50 flex gap-1 bg-[#1e2330] border border-white/10 rounded-full p-1.5 shadow-xl", isOwnMessage ? "right-0" : "left-0")}>
            {REACTION_LIST.map(em => (
               <button key={em} onClick={() => handleReact(em)} className="text-lg hover:scale-125 transition-transform hover:bg-white/10 rounded-full w-8 h-8 flex items-center justify-center">
                 {em}
               </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
