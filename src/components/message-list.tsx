

import { useEffect, useRef } from "react";
import type { Message, User } from "@/lib/types";
import { MessageBubble } from "./message-bubble";

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  getUser?: (id: string) => User | undefined;
}

export function MessageList({
  messages,
  currentUserId,
  getUser,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  return (
    <div className="flex flex-1 flex-col overflow-y-auto px-3 py-4 md:px-6">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-1">
        {messages.map((msg, idx) => {
          const isMe = msg.senderId === currentUserId;
          const prev = messages[idx - 1];
          const next = messages[idx + 1];
          const sameGroupPrev = prev?.senderId === msg.senderId;
          const sameGroupNext = next?.senderId === msg.senderId;

          const showAvatar = !sameGroupNext;
          const showTimestamp = !sameGroupNext;
          const sender = getUser ? getUser(msg.senderId) : undefined;

          return (
            <div
              key={msg.id}
              className={!sameGroupPrev && idx > 0 ? "mt-3" : ""}
            >
              <MessageBubble
                message={msg}
                isOwnMessage={isMe}
                showAvatar={showAvatar}
                showTimestamp={showTimestamp}
                seen={msg.read}
                sender={sender}
              />
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
