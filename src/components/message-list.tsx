import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useChatStore } from "@/store/chat.store";
import { useAuthStore } from "@/store/auth.store";
import { motion } from "framer-motion";
import { MessageBubble } from "./message-bubble";
import type { Message, User } from "@/types/chat.types";

const VIRTUALIZE_THRESHOLD = 100;
const ESTIMATED_ITEM_HEIGHT = 76;
const OVERSCAN = 10;

function formatDateDivider(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  
  if (d.toDateString() === now.toDateString()) {
    return "Today";
  }
  
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }
  
  const diffTime = Math.abs(now.getTime() - d.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays < 7) {
    return d.toLocaleDateString(undefined, { weekday: 'long' });
  }
  
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

interface MessageRowProps {
  message: Message;
  currentUserId: string;
  sender?: User;
  sameGroupPrev: boolean;
  sameGroupNext: boolean;
  isFirst: boolean;
}

const MessageRow = memo(function MessageRow({
  message,
  currentUserId,
  sender,
  sameGroupPrev,
  sameGroupNext,
  isFirst,
}: MessageRowProps) {
  const isOwnMessage = message.senderId === currentUserId;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.98 }} 
      animate={{ opacity: 1, y: 0, scale: 1 }} 
      transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
      className={!sameGroupPrev && !isFirst ? "mt-3" : ""}
    >
      <MessageBubble
        message={message}
        isOwnMessage={isOwnMessage}
        showAvatar={!sameGroupNext}
        showTimestamp={!sameGroupNext}
        seen={false} // Simplified for now
        sender={sender}
      />
    </motion.div>
  );
});

export const MessageList = memo(function MessageList() {
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [isNearBottom, setIsNearBottom] = useState(true);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  const { activeConversationId, messages, getUser } = useChatStore(
    useShallow((s) => ({
      activeConversationId: s.activeConversationId,
      messages: s.messages,
      getUser: s.getUser,
    }))
  );

  const { id: currentUserId } = useAuthStore((state) => state.user) || {};

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop: nextScrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - nextScrollTop - clientHeight;
      const nearBottom = distanceFromBottom < 100;

      setIsNearBottom((prev) => (prev === nearBottom ? prev : nearBottom));
      setScrollTop((prev) => (prev === nextScrollTop ? prev : nextScrollTop));
    };

    const handleResize = () => {
      const nextHeight = container.clientHeight;
      setContainerHeight((prev) => (prev === nextHeight ? prev : nextHeight));
    };

    handleScroll();
    handleResize();

    const observer = new ResizeObserver(handleResize);
    observer.observe(container);

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      observer.disconnect();
      container.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    if (isNearBottom && messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, isNearBottom]);

  useEffect(() => {
    if (activeConversationId) {
      bottomRef.current?.scrollIntoView({ behavior: "auto" });
      setIsNearBottom(true);
      setScrollTop(0);
    }
  }, [activeConversationId]);

  const shouldVirtualize = messages.length > VIRTUALIZE_THRESHOLD;

  const { startIndex, endIndex, topSpacerHeight, bottomSpacerHeight } = useMemo(() => {
    if (!shouldVirtualize || messages.length === 0) {
      return {
        startIndex: 0,
        endIndex: messages.length - 1,
        topSpacerHeight: 0,
        bottomSpacerHeight: 0,
      };
    }

    const viewportHeight = containerHeight || 1;
    const start = Math.max(
      0,
      Math.floor(scrollTop / ESTIMATED_ITEM_HEIGHT) - OVERSCAN
    );
    const end = Math.min(
      messages.length - 1,
      Math.ceil((scrollTop + viewportHeight) / ESTIMATED_ITEM_HEIGHT) + OVERSCAN
    );

    return {
      startIndex: start,
      endIndex: end,
      topSpacerHeight: start * ESTIMATED_ITEM_HEIGHT,
      bottomSpacerHeight: Math.max(
        0,
        (messages.length - end - 1) * ESTIMATED_ITEM_HEIGHT
      ),
    };
  }, [shouldVirtualize, messages.length, containerHeight, scrollTop]);

  const visibleMessages = useMemo(() => {
    if (!shouldVirtualize) return messages;
    if (endIndex < startIndex) return [];
    return messages.slice(startIndex, endIndex + 1);
  }, [messages, shouldVirtualize, startIndex, endIndex]);

  if (!activeConversationId) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        Select a conversation to start messaging
      </div>
    );
  }

  return (
    <div
      ref={scrollContainerRef}
      className="flex flex-1 flex-col overflow-y-auto px-3 py-4 md:px-6"
    >
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-1">
        {shouldVirtualize && topSpacerHeight > 0 ? (
          <div style={{ height: topSpacerHeight }} />
        ) : null}

        {visibleMessages.map((message, index) => {
          const actualIndex = shouldVirtualize ? startIndex + index : index;
          const prev = messages[actualIndex - 1];
          const next = messages[actualIndex + 1];

          let showDateDivider = false;
          if (!prev) {
             showDateDivider = true;
          } else {
             const prevDate = new Date(prev.timestamp).toDateString();
             const currDate = new Date(message.timestamp).toDateString();
             showDateDivider = prevDate !== currDate;
          }

          const isNextDifferentDate = next && new Date(next.timestamp).toDateString() !== new Date(message.timestamp).toDateString();
          const sameGroupPrev = !showDateDivider && prev?.senderId === message.senderId;
          const sameGroupNext = !isNextDifferentDate && next?.senderId === message.senderId;

          return (
            <div key={message.id} className="flex flex-col">
              {showDateDivider && (
                 <div className="flex justify-center my-4">
                    <span className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground font-medium">
                       {formatDateDivider(message.timestamp)}
                    </span>
                 </div>
              )}
              <MessageRow
                message={message}
                currentUserId={currentUserId || ""}
                sender={getUser(message.senderId)}
                sameGroupPrev={sameGroupPrev}
                sameGroupNext={sameGroupNext}
                isFirst={actualIndex === 0 || showDateDivider}
              />
            </div>
          );
        })}

        {shouldVirtualize && bottomSpacerHeight > 0 ? (
          <div style={{ height: bottomSpacerHeight }} />
        ) : null}

        <div ref={bottomRef} />
      </div>
    </div>
  );
});
