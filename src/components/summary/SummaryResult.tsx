import React from 'react';
import { Typography, Empty, Spin } from 'antd';
import { Sparkles, AlertCircle } from 'lucide-react';

const { Paragraph, Text } = Typography;

interface SummaryResultProps {
  summary: string[] | null;
  loading: boolean;
  error?: string | null;
}

export const SummaryResult: React.FC<SummaryResultProps> = ({ summary, loading, error }) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <Spin indicator={<Sparkles className="h-8 w-8 animate-pulse text-primary" />} />
        <Text strong type="secondary">Generating summary...</Text>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-2 text-center text-destructive">
        <AlertCircle className="h-8 w-8" />
        <Text strong type="danger">Failed to generate summary</Text>
        <Text type="secondary" style={{ fontSize: '12px' }}>{error}</Text>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="p-8">
        <Empty 
          description="Adjust filters and click Generate to see the summary" 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    );
  }

  return (
    <div className="p-5 space-y-3 overflow-y-auto max-h-[300px]">
      <Text strong className="text-primary block mb-2">Key points from the conversation:</Text>
      {summary.map((line, idx) => (
        <div key={idx} className="flex gap-3 items-start">
          <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
          <Paragraph className="m-0 text-sm leading-relaxed text-foreground/90">
            {line}
          </Paragraph>
        </div>
      ))}
    </div>
  );
};
