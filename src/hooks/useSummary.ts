import { useState, useMemo } from "react";
import { useChatStore } from "@/store/chat.store";
import dayjs from "dayjs";
import { message as antMessage } from "antd";
import { useMessageSummary } from "@/hooks/useMessageSummary";

export const useSummary = () => {
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const conversations = useChatStore((s) => s.conversations);
  const messages = useChatStore((s) => s.messages);

  const [isOpen, setIsOpen] = useState(false);
  const { isSummarizing, summary, error, generateSummary, clearSummary } = useMessageSummary();
  const [senderFilter, setSenderFilter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  const activeConversation = useMemo(() => {
    return conversations.find((c) => c.id === activeConversationId);
  }, [conversations, activeConversationId]);

  const toggleOpen = () => setIsOpen((prev) => !prev);
  const close = () => setIsOpen(false);

  const handleSummarize = async () => {
    if (!activeConversationId || !activeConversation) {
      antMessage.error("Please select a conversation first");
      return;
    }

    if (messages.length === 0) {
      antMessage.warning("No messages to summarize");
      return;
    }

    // Format messages: "Sender: Content"
    const rawMessages = messages
      .map((m) => {
        const member = activeConversation.members.find((mem) => mem.id === m.senderId);
        const senderName = member ? member.fullName : "Unknown";
        return `${senderName}: ${m.content}`;
      })
      .join("\n");

    try {
      await generateSummary({
        messages: rawMessages,
        senderFilter: senderFilter || undefined,
        startTime: dateRange?.[0]?.toISOString(),
        endTime: dateRange?.[1]?.toISOString(),
      });
    } catch (err) {
      console.error("Summarization failed:", err);
    }
  };

  const setQuickPreset = (preset: 'today' | '24h' | '7d') => {
    const now = dayjs();
    let start: dayjs.Dayjs;

    switch (preset) {
      case 'today':
        start = now.startOf('day');
        break;
      case '24h':
        start = now.subtract(24, 'hour');
        break;
      case '7d':
        start = now.subtract(7, 'day');
        break;
      default:
        return;
    }

    setDateRange([start, now]);
  };

  return {
    isOpen,
    isSummarizing,
    summary,
    error,
    senderFilter,
    dateRange,
    activeConversation,
    toggleOpen,
    close,
    handleSummarize,
    handleClear: clearSummary,
    setSenderFilter,
    setDateRange,
    setQuickPreset,
    hasActiveConversation: !!activeConversationId,
  };
};
