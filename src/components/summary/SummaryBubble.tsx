import React from 'react';
import { Button, Card, Typography } from 'antd';
const { Text } = Typography;
import { Sparkles } from 'lucide-react';
import { SummaryHeader } from './SummaryHeader';
import { SummaryFilters } from './SummaryFilters';
import { SummaryResult } from './SummaryResult';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';

interface SummaryBubbleProps {
  isOpen: boolean;
  onClose: () => void;
  isSummarizing: boolean;
  summary: string[] | null;
  error: string | null;
  senderFilter: string | null;
  dateRange: [dayjs.Dayjs, dayjs.Dayjs] | null;
  activeConversation: any;
  handleSummarize: () => void;
  handleClear: () => void;
  setSenderFilter: (val: string | null) => void;
  setDateRange: (dates: [dayjs.Dayjs, dayjs.Dayjs] | null) => void;
  setQuickPreset: (preset: 'today' | '24h' | '7d') => void;
  hasActiveConversation: boolean;
}

export const SummaryBubble: React.FC<SummaryBubbleProps> = ({
  isOpen,
  onClose,
  isSummarizing,
  summary,
  error,
  senderFilter,
  dateRange,
  activeConversation,
  handleSummarize,
  handleClear,
  setSenderFilter,
  setDateRange,
  setQuickPreset,
  hasActiveConversation
}) => {
  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "fixed bottom-24 right-6 z-50 w-[360px] md:w-[420px] transition-all duration-300 origin-bottom-right",
        isOpen ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 translate-y-4 pointer-events-none"
      )}
    >
      <Card
        className="glass-card rounded-[2rem] overflow-hidden flex flex-col h-[560px] md:h-[640px] shadow-[0_30px_60px_rgba(0,0,0,0.6)]"
        styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column', height: '100%' } }}
        style={{ border: 'none' }}
      >
        <SummaryHeader onClose={onClose} />

        <div className="flex-1 overflow-y-auto scrollbar-none bg-[#0a0f1d]/20">
          {hasActiveConversation ? (
            <div className="flex flex-col min-h-full">
              <SummaryFilters
                senderFilter={senderFilter}
                setSenderFilter={setSenderFilter}
                dateRange={dateRange}
                setDateRange={setDateRange}
                members={activeConversation?.members || []}
                onPresetClick={setQuickPreset}
              />
              <div className="flex-1 bg-white/[0.03]">
                <SummaryResult
                  summary={summary}
                  loading={isSummarizing}
                  error={error}
                />
              </div>
            </div>
          ) : (
            <div className="p-16 text-center space-y-4">
              <div className="h-16 w-16 mx-auto flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 opacity-20">
                <Sparkles className="h-8 w-8" />
              </div>
              <Text style={{ color: 'rgba(255,255,255,0.3)', display: 'block' }}>
                Select a conversation terminal to engage AI summarizer.
              </Text>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-white/10 bg-white/5 backdrop-blur-md">
          {!summary ? (
            <Button
              type="primary"
              block
              size="large"
              icon={<Sparkles className="h-5 w-5" />}
              onClick={handleSummarize}
              loading={isSummarizing}
              disabled={!hasActiveConversation}
              className="h-14 primary-gradient border-none rounded-2xl font-bold tracking-widest text-white shadow-[0_10px_20px_rgba(168,85,247,0.3)] hover:scale-[1.02] transition-all"
            >
              GENERATE SUMMARY
            </Button>
          ) : (
            <div className="flex gap-3">
              <Button
                className="flex-1 h-14 rounded-2xl bg-white/5 border-white/10 text-white font-bold hover:bg-white/10 hover:border-white/20 transition-all"
                onClick={handleClear}
                disabled={isSummarizing}
              >
                CLEAR
              </Button>
              <Button
                type="primary"
                className="flex-[2] h-14 primary-gradient border-none rounded-2xl font-bold tracking-widest text-white shadow-[0_10px_20px_rgba(168,85,247,0.3)] hover:scale-[1.02] transition-all"
                icon={<Sparkles className="h-5 w-5" />}
                onClick={handleSummarize}
                loading={isSummarizing}
              >
                REGENERATE
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
