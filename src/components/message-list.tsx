import { useAuthStore } from "@/store/auth.store";
import { useChatStore } from "@/store/chat.store";
import type { Message, User } from "@/types/chat.types";
import { motion } from "framer-motion";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { MessageBubble } from "./message-bubble";
import { cn } from "@/lib/utils";

const VIRTUALIZE_THRESHOLD = 100;
const ESTIMATED_ITEM_HEIGHT = 76;
const OVERSCAN = 10;

interface MessageRowProps {
  message: Message;
  currentUserId: string;
  sender?: User;
  sameGroupPrev: boolean;
  sameGroupNext: boolean;
  isFirst: boolean;
  isHighlighted?: boolean;
}

const MessageRow = memo(function MessageRow({
  message,
  currentUserId,
  sender,
  sameGroupPrev,
  sameGroupNext,
  isFirst,
  isHighlighted,
}: MessageRowProps) {
  const isOwnMessage = message.senderId === currentUserId;

  return (
    <motion.div 
      id={`msg-${message.id}`}
      initial={{ opacity: 0, y: 10, scale: 0.98 }} 
      animate={{ 
        opacity: 1, 
        y: 0, 
        scale: 1,
        backgroundColor: isHighlighted ? "rgba(14, 165, 233, 0.15)" : "transparent"
      }} 
      transition={{ 
        duration: 0.3, 
        type: "spring", 
        stiffness: 200,
        backgroundColor: { duration: 1.5, repeat: isHighlighted ? 2 : 0, repeatType: "reverse" }
      }}
      className={cn(
        "transition-colors duration-500 rounded-2xl",
        !sameGroupPrev && !isFirst ? "mt-3" : "",
        isHighlighted && "ring-1 ring-primary/30"
      )}
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
  const [searchParams, setSearchParams] = useSearchParams();
  const targetMsgId = searchParams.get('msgId');

  const [isNearBottom, setIsNearBottom] = useState(true);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const { t, i18n } = useTranslation();
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const messages = useChatStore((s) => s.messages);
  const getUser = useChatStore((s) => s.getUser);

  const { id: currentUserId } = useAuthStore((state) => state.user) || {};

  // Handle scroll to specific message
  useEffect(() => {
    if (targetMsgId && messages.length > 0) {
      const msgIndex = messages.findIndex(m => m.id === targetMsgId);
      if (msgIndex !== -1) {
        // Find the element if it exists in DOM
        const element = document.getElementById(`msg-${targetMsgId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setHighlightedId(targetMsgId);
          // Clear highligt and URL param after a delay
          const timer = setTimeout(() => {
             setHighlightedId(null);
             // Optionally remove msgId from URL without triggering reload
             const newParams = new URLSearchParams(searchParams);
             newParams.delete('msgId');
             setSearchParams(newParams, { replace: true });
          }, 3000);
          return () => clearTimeout(timer);
        } else if (scrollContainerRef.current) {
          // If virtualized and not in DOM, jump to estimated position
          const estimatedPos = msgIndex * ESTIMATED_ITEM_HEIGHT;
          scrollContainerRef.current.scrollTo({ top: estimatedPos, behavior: 'auto' });
          // The next render cycle should bring the element into DOM, then we scrollIntoView properly
          setIsNearBottom(false);
        }
      }
    }
  }, [targetMsgId, messages, setSearchParams, searchParams]);

  const formatDateDivider = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const lang = i18n.language === 'vi' ? 'vi-VN' : 'en-US';
    
    if (d.toDateString() === now.toDateString()) {
      return t("today");
    }
    
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) {
      return t("yesterday");
    }
    
    const diffTime = Math.abs(now.getTime() - d.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 7) {
      return d.toLocaleDateString(lang, { weekday: 'long' });
    }
    
    return d.toLocaleDateString(lang, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const filteredMessages = useMemo(() => {
    if (!currentUserId) return messages;
    return messages.filter(m => !m.deletedForUsers?.includes(currentUserId));
  }, [messages, currentUserId]);

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
    if (isNearBottom && filteredMessages.length > 0 && !targetMsgId) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [filteredMessages.length, isNearBottom, targetMsgId]);

  useEffect(() => {
    if (activeConversationId && !targetMsgId) {
      bottomRef.current?.scrollIntoView({ behavior: "auto" });
      setIsNearBottom(true);
      setScrollTop(0);
    }
  }, [activeConversationId, targetMsgId]);

  const shouldVirtualize = filteredMessages.length > VIRTUALIZE_THRESHOLD;

  const { startIndex, endIndex, topSpacerHeight, bottomSpacerHeight } = useMemo(() => {
    if (!shouldVirtualize || filteredMessages.length === 0) {
      return {
        startIndex: 0,
        endIndex: filteredMessages.length - 1,
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
      filteredMessages.length - 1,
      Math.ceil((scrollTop + viewportHeight) / ESTIMATED_ITEM_HEIGHT) + OVERSCAN
    );

    return {
      startIndex: start,
      endIndex: end,
      topSpacerHeight: start * ESTIMATED_ITEM_HEIGHT,
      bottomSpacerHeight: Math.max(
        0,
        (filteredMessages.length - end - 1) * ESTIMATED_ITEM_HEIGHT
      ),
    };
  }, [shouldVirtualize, filteredMessages.length, containerHeight, scrollTop]);

  const visibleMessages = useMemo(() => {
    if (!shouldVirtualize) return filteredMessages;
    if (endIndex < startIndex) return [];
    return filteredMessages.slice(startIndex, endIndex + 1);
  }, [filteredMessages, shouldVirtualize, startIndex, endIndex]);

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
      className="flex flex-1 flex-col overflow-y-auto px-3 py-4 md:px-6 scroll-smooth"
    >
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-1">
        {shouldVirtualize && topSpacerHeight > 0 ? (
          <div style={{ height: topSpacerHeight }} />
        ) : null}

        {visibleMessages.map((message, index) => {
          const actualIndex = shouldVirtualize ? startIndex + index : index;
          const prev = filteredMessages[actualIndex - 1];
          const next = filteredMessages[actualIndex + 1];

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
                isHighlighted={highlightedId === message.id}
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
