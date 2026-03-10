import React from 'react';
import { Typography, Button } from 'antd';
import { X, Sparkles } from 'lucide-react';

const { Title, Text } = Typography;

interface SummaryHeaderProps {
  onClose: () => void;
  title?: string;
}

export const SummaryHeader: React.FC<SummaryHeaderProps> = ({ onClose, title = "AI Summarizer" }) => {
  return (
    <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <Title level={5} style={{ margin: 0, fontSize: '16px' }}>
            {title}
          </Title>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Powered by AI
          </Text>
        </div>
      </div>
      <Button 
        type="text" 
        icon={<X className="h-4 w-4" />} 
        onClick={onClose}
        className="text-muted-foreground hover:text-foreground"
      />
    </div>
  );
};
