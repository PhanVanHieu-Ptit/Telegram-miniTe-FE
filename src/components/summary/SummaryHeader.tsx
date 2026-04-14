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
    <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/5 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      <div className="flex items-center gap-3 relative z-10">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary border border-primary/20 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
          <Sparkles className="h-6 w-6" />
        </div>
        <div>
          <Title level={5} style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'white' }}>
            {title}
          </Title>
          <Text style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
            Powered by AI
          </Text>
        </div>
      </div>
      <Button 
        type="text" 
        icon={<X className="h-5 w-5" />} 
        onClick={onClose}
        className="text-white! hover:text-white! hover:bg-white/10! rounded-full transition-all opacity-80 hover:opacity-100"
      />
    </div>
  );
};
