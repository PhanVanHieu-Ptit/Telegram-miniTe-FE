import { useState, useCallback } from 'react';
import { messageSummaryService } from '@/services/messageSummary.service';
import type { SummarizeRequest } from '@/services/messageSummary.service';
import { message as antMessage } from 'antd';

interface UseMessageSummaryReturn {
  isSummarizing: boolean;
  summary: string[] | null;
  error: string | null;
  generateSummary: (params: SummarizeRequest) => Promise<void>;
  clearSummary: () => void;
}

export const useMessageSummary = (): UseMessageSummaryReturn => {
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateSummary = useCallback(async (params: SummarizeRequest) => {
    if (!params.messages.trim()) {
      antMessage.warning('No messages to summarize');
      return;
    }

    setIsSummarizing(true);
    setError(null);
    setSummary(null);

    try {
      const response = await messageSummaryService.summarize(params);
      
      if (response.success) {
        setSummary(response.summary);
        antMessage.success('Summary generated successfully!');
      } else {
        throw new Error('Failed to generate summary');
      }
    } catch (err: any) {
      console.error('Error generating summary:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Server error occurred';
      setError(errorMessage);
      antMessage.error(errorMessage);
    } finally {
      setIsSummarizing(false);
    }
  }, []);

  const clearSummary = useCallback(() => {
    setSummary(null);
    setError(null);
  }, []);

  return {
    isSummarizing,
    summary,
    error,
    generateSummary,
    clearSummary,
  };
};
