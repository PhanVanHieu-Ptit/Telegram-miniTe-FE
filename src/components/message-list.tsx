import { useAuthStore } from "@/store/auth.store";
import { useChatStore } from "@/store/chat.store";
import type { Message, User } from "@/types/chat.types";
import { motion } from "framer-motion";
import {
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { useVirtualizer } from "@tanstack/react-virtual";
import { MessageBubble } from "./message-bubble";
import { cn } from "@/lib/utils";

/* =========================
   Message Row
========================= */
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
      initial={{ opacity: 0, y: 10 }}
      animate={{
        opacity: 1,
        y: 0,
        backgroundColor: isHighlighted
          ? "rgba(14,165,233,0.15)"
          : "transparent",
      }}
      transition={{
        duration: 0.25,
        backgroundColor: {
          duration: 1.2,
          repeat: isHighlighted ? 2 : 0,
          repeatType: "reverse",
        },
      }}
      className={cn(
        "rounded-2xl transition-colors",
        !sameGroupPrev && !isFirst ? "mt-3" : "",
        isHighlighted && "ring-1 ring-primary/30"
      )}
    >
      <MessageBubble
        message={message}
        isOwnMessage={isOwnMessage}
        showAvatar={!sameGroupNext}
        showTimestamp={!sameGroupNext}
        seen={false}
        sender={sender}
      />
    </motion.div>
  );
});

/* =========================
   Message List
========================= */

export const MessageList = memo(function MessageList() {
  const parentRef = useRef<HTMLDivElement>(null);
  const prevHeightRef = useRef(0);
  const hasScrolledToBottomRef = useRef(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const targetMsgId = searchParams.get("msgId");

  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const { t, i18n } = useTranslation();

  const activeConversationId = useChatStore(
    (s) => s.activeConversationId
  );
  const messages = useChatStore((s) => s.messages);
  const getUser = useChatStore((s) => s.getUser);
  const hasMoreMessages = useChatStore((s) => s.hasMoreMessages);
  const loading = useChatStore((s) => s.loading);

  const { id: currentUserId } =
    useAuthStore((state) => state.user) || {};

  /* =========================
     Filter messages
  ========================= */
  const filteredMessages = useMemo(() => {
    if (!currentUserId) return messages;
    return messages.filter(
      (m) => !m.deletedForUsers?.includes(currentUserId)
    );
  }, [messages, currentUserId]);

  /* =========================
     Virtualizer
  ========================= */
  const rowVirtualizer = useVirtualizer({
    count: filteredMessages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
    overscan: 10,
    getItemKey: useCallback(
      (index: number) => filteredMessages[index]?.id || index,
      [filteredMessages]
    ),
  });

  /* =========================
     Helpers
  ========================= */
  const isNearBottom = useCallback(() => {
    const el = parentRef.current;
    if (!el) return true;

    const distance =
      el.scrollHeight - el.scrollTop - el.clientHeight;

    return distance < el.clientHeight * 0.2;
  }, []);

  const scrollToBottom = useCallback(
    (smooth = true) => {
      if (filteredMessages.length === 0) return;

      rowVirtualizer.scrollToIndex(filteredMessages.length - 1, {
        align: "end",
        behavior: smooth ? "smooth" : "auto",
      });
    },
    [filteredMessages.length, rowVirtualizer]
  );

  const scrollToMessage = useCallback(
    (msgId: string) => {
      const index = filteredMessages.findIndex(
        (m) => m.id === msgId
      );
      if (index === -1) return;

      rowVirtualizer.scrollToIndex(index, {
        align: "center",
      });

      setHighlightedId(msgId);

      setTimeout(() => {
        setHighlightedId(null);
      }, 2000);
    },
    [filteredMessages, rowVirtualizer]
  );

  /* =========================
     Auto scroll new message
  ========================= */
  useEffect(() => {
    if (targetMsgId) return;

    if (!hasScrolledToBottomRef.current) {
      // First time messages load for this conversation — always scroll to bottom
      if (filteredMessages.length > 0) {
        hasScrolledToBottomRef.current = true;
        scrollToBottom(false);
      }
    } else if (isNearBottom()) {
      // Subsequent additions (new MQTT message) — scroll only if already near bottom
      scrollToBottom(true);
    }
  }, [filteredMessages.length]);

  /* =========================
     Conversation change — reset initial-scroll flag
  ========================= */
  useEffect(() => {
    hasScrolledToBottomRef.current = false;
  }, [activeConversationId]);

  /* =========================
     Deep link msgId
  ========================= */
  useEffect(() => {
    if (targetMsgId && filteredMessages.length > 0) {
      scrollToMessage(targetMsgId);

      const timer = setTimeout(() => {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("msgId");
        setSearchParams(newParams, { replace: true });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [targetMsgId, filteredMessages]);

  /* =========================
     Anchor scroll (load older)
  ========================= */
  const handleLoadMore = async () => {
    const el = parentRef.current;
    if (!el) return;

    prevHeightRef.current = el.scrollHeight;

    await useChatStore.getState().loadOlderMessages?.();

    requestAnimationFrame(() => {
      const newHeight = el.scrollHeight;
      el.scrollTop += newHeight - prevHeightRef.current;
    });
  };

  /* =========================
     Date format
  ========================= */
  const formatDateDivider = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const lang = i18n.language === "vi" ? "vi-VN" : "en-US";

    if (d.toDateString() === now.toDateString()) return t("today");

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === yesterday.toDateString())
      return t("yesterday");

    return d.toLocaleDateString(lang, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  /* =========================
     Empty state
  ========================= */
  if (!activeConversationId) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        Select a conversation
      </div>
    );
  }

  /* =========================
     Render
  ========================= */
  return (
    <div
      ref={parentRef}
      className="flex flex-1 flex-col overflow-y-auto px-3 py-4 md:px-6"
    >
      <div
        style={{
          height: rowVirtualizer.getTotalSize(),
          position: "relative",
        }}
        className="mx-auto w-full max-w-2xl"
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const message = filteredMessages[virtualRow.index];

          const prev = filteredMessages[virtualRow.index - 1];
          const next = filteredMessages[virtualRow.index + 1];

          const showDateDivider =
            !prev ||
            new Date(prev.timestamp).toDateString() !==
              new Date(message.timestamp).toDateString();

          const sameGroupPrev =
            !showDateDivider &&
            prev?.senderId === message.senderId;

          const sameGroupNext =
            next &&
            new Date(next.timestamp).toDateString() ===
              new Date(message.timestamp).toDateString() &&
            next.senderId === message.senderId;

          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={rowVirtualizer.measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {showDateDivider && (
                <div className="flex justify-center my-4">
                  <span className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
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
                isFirst={virtualRow.index === 0 || showDateDivider}
                isHighlighted={highlightedId === message.id}
              />
            </div>
          );
        })}
      </div>

      {/* Load more button */}
      {hasMoreMessages && (
        <div className="flex justify-center py-4">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="text-xs text-primary hover:underline disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />}
            {t("load_older_messages", { defaultValue: "Load older messages" })}
          </button>
        </div>
      )}
    </div>
  );
});