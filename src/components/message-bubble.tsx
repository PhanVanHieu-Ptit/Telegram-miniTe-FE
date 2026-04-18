

import { memo, useState } from "react";
import { Avatar } from "antd";
import { Check, CheckCheck, SmilePlus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message, User } from "@/types/chat.types";
import dayjs from "dayjs";
import { ImageMessage } from "./chat/messages/ImageMessage";
import { VoiceMessage } from "./chat/messages/VoiceMessage";
import { FileMessage } from "./chat/messages/FileMessage";
import { LocationMessage } from "./chat/messages/LocationMessage";
import { ContactMessage } from "./chat/messages/ContactMessage";
import { BankMessage } from "./chat/messages/BankMessage";
import { PollMessage } from "./chat/messages/PollMessage";
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
  const reactMessage = useChatStore((s) => s.reactMessage);
  
  const REACTION_LIST = ['👍', '❤️', '😂', '😮', '😢', '😡'];

  const safeParse = (str?: string) => {
    try {
      return JSON.parse(str || '{}');
    } catch {
      return {};
    }
  };

  const handleReact = (emoji: string) => {
    setShowEmojiPicker(false);
    if (!message.id) return;
    void reactMessage(message.conversationId, message.id, emoji);
  };

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
        {(() => {
          const msgType = message.type ? message.type.toUpperCase() : 'TEXT';
          return (
            <>
              {msgType === 'IMAGE' && <ImageMessage attachments={message.attachments} />}
              {msgType === 'FILE' && <FileMessage attachments={message.attachments} />}
              {msgType === 'VOICE' && <VoiceMessage url={message.attachments?.[0]?.url} duration={message.metadata?.duration} />}
              {msgType === 'LOCATION' && <LocationMessage payload={safeParse(message.content)} />}
              {msgType === 'CONTACT' && <ContactMessage payload={safeParse(message.content)} />}
              {msgType === 'BANK' && <BankMessage payload={safeParse(message.content)} />}
              {msgType === 'POLL' && <PollMessage payload={safeParse(message.content)} />}
              {msgType === 'TEXT' && (
                <span className="whitespace-pre-wrap break-words">{message.content}</span>
              )}
            </>
          );
        })()}

        {/* Timestamp + seen indicator */}
        {showTimestamp && (
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
