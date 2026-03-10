import { useState, useMemo } from "react";
import { summarizeMessages } from "@/api/summarize.api";
import type { SummarizeRequest } from "@/api/summarize.api";
import { useChatStore } from "@/store/chat.store";
import dayjs from "dayjs";
import { message } from "antd";

export const useSummary = () => {
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const conversations = useChatStore((s) => s.conversations);

  const [isOpen, setIsOpen] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState<string[] | null>(null);
  const [senderFilter, setSenderFilter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  const activeConversation = useMemo(() => {
    return conversations.find((c) => c.id === activeConversationId);
  }, [conversations, activeConversationId]);

  const toggleOpen = () => setIsOpen((prev) => !prev);
  const close = () => setIsOpen(false);

  const handleSummarize = async () => {
    if (!activeConversationId) {
      message.error("Please select a conversation first");
      return;
    }

    setIsSummarizing(true);
    setSummary(null);

    try {
      const payload: SummarizeRequest = {
        conversationId: activeConversationId,
        senderFilter: senderFilter || undefined,
        startTime: dateRange?.[0]?.toISOString(),
        endTime: dateRange?.[1]?.toISOString(),
      };

      const response = await summarizeMessages(payload);

      if (response.success) {
        setSummary(response.summary);
        message.success("Summary generated successfully!");
      } else {
        message.error("Failed to generate summary");
      }
    } catch (error) {
      console.error("Summarization error:", error);
      message.error("An error occurred while generating the summary");
    } finally {
      setIsSummarizing(false);
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
    senderFilter,
    dateRange,
    activeConversation,
    toggleOpen,
    close,
    handleSummarize,
    setSenderFilter,
    setDateRange,
    setQuickPreset,
    hasActiveConversation: !!activeConversationId,
  };
};
