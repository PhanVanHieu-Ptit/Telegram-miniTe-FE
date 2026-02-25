

import { Avatar } from "antd";
import { Check, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message, User } from "@/lib/types";

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

export function MessageBubble({
  message,
  isOwnMessage,
  showAvatar,
  showTimestamp,
  seen,
  sender,
}: MessageBubbleProps) {
  return (
    <div
      className={cn(
        "flex items-end gap-2",
        isOwnMessage ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar slot */}
      <div className="w-8 shrink-0">
        {!isOwnMessage && showAvatar && sender ? (
          <Avatar
            size={32}
            src={sender.avatar || undefined}
            style={{
              backgroundColor: sender.avatar
                ? undefined
                : getAvatarColor(sender.id),
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {!sender.avatar && getInitials(sender.name)}
          </Avatar>
        ) : null}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          "relative max-w-[75%] px-3 py-2 text-sm leading-relaxed md:max-w-[60%]",
          isOwnMessage
            ? "rounded-2xl rounded-br-sm bg-bubble-out text-bubble-out-foreground"
            : "rounded-2xl rounded-bl-sm bg-bubble-in text-bubble-in-foreground shadow-[0_1px_2px_rgba(0,0,0,0.06)]",
          showAvatar
            ? ""
            : isOwnMessage
              ? "rounded-br-2xl"
              : "rounded-bl-2xl"
        )}
      >
        <span className="whitespace-pre-wrap break-words">{message.text}</span>

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
            {message.timestamp}
            {isOwnMessage &&
              (seen ? (
                <CheckCheck className="h-3.5 w-3.5 text-primary" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              ))}
          </span>
        )}
      </div>
    </div>
  );
}
