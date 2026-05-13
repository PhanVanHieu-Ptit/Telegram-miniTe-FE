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
  const [useV2, setUseV2] = useState(false);

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

    try {
      await generateSummary(
        {
          // Use conversationId so backend fetches ALL messages from DB and applies
          // accurate timestamp-based filtering (not limited to the store's last 50)
          conversationId: activeConversationId,
          senderFilter: senderFilter || undefined,
          startTime: dateRange?.[0]?.toISOString(),
          endTime: dateRange?.[1]?.toISOString(),
        },
        useV2
      );
    } catch (err) {
      console.error("Summarization failed:", err);
    }
  };

  const setQuickPreset = (preset: 'today' | '24h' | '7d') => {
    const now = dayjs();
    let start: dayjs.Dayjs;
    let end: dayjs.Dayjs = now;

    switch (preset) {
      case 'today':
        start = now.startOf('day');
        end = now.endOf('day');
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

    setDateRange([start, end]);
  };

  return {
    isOpen,
    isSummarizing,
    summary,
    error,
    senderFilter,
    dateRange,
    activeConversation,
    useV2,
    setUseV2,
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
