import React from 'react';
import { Button, Card } from 'antd';
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
  senderFilter: string | null;
  dateRange: [dayjs.Dayjs, dayjs.Dayjs] | null;
  activeConversation: any;
  handleSummarize: () => void;
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
  senderFilter,
  dateRange,
  activeConversation,
  handleSummarize,
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
        className="shadow-2xl border-border overflow-hidden flex flex-col h-[520px] md:h-[600px]"
        styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column', height: '100%' } }}
      >
        <SummaryHeader onClose={onClose} />
        
        <div className="flex-1 overflow-y-auto">
          {hasActiveConversation ? (
            <>
              <SummaryFilters 
                senderFilter={senderFilter}
                setSenderFilter={setSenderFilter}
                dateRange={dateRange}
                setDateRange={setDateRange}
                members={activeConversation?.members || []}
                onPresetClick={setQuickPreset}
              />
              <SummaryResult 
                summary={summary} 
                loading={isSummarizing} 
              />
            </>
          ) : (
            <div className="p-12 text-center text-muted-foreground">
              Select a conversation to use the AI summarizer.
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border bg-muted/10">
          <Button 
            type="primary" 
            block 
            size="large" 
            icon={<Sparkles className="h-4 w-4" />}
            onClick={handleSummarize}
            loading={isSummarizing}
            disabled={!hasActiveConversation}
            className="bg-primary hover:bg-primary/90 shadow-md h-12 text-base font-semibold"
          >
            Generate Summary
          </Button>
        </div>
      </Card>
    </div>
  );
};
