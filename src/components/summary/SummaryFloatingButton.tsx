import React from 'react';
import { Button, Tooltip } from 'antd';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SummaryFloatingButtonProps {
  onClick: () => void;
  isOpen: boolean;
  className?: string;
}

export const SummaryFloatingButton: React.FC<SummaryFloatingButtonProps> = ({ 
  onClick, 
  isOpen,
  className 
}) => {
  return (
    <div className={cn("fixed bottom-6 right-6 z-[60]", className)}>
      <Tooltip title={isOpen ? "Close Summary" : "AI Message Summary"} placement="left">
        <Button
          type="primary"
          shape="circle"
          size="large"
          icon={<Sparkles className={cn("h-7 w-7 transition-all duration-500", isOpen ? "rotate-180 scale-90" : "scale-100")} />}
          onClick={onClick}
          className={cn(
            "h-16 w-16 shadow-[0_10px_30px_rgba(168,85,247,0.5)] flex items-center justify-center border-none",
            "primary-gradient transition-all duration-300",
            isOpen ? "scale-90 opacity-80" : "hover:scale-110 hover:shadow-[0_15px_40px_rgba(168,85,247,0.6)]"
          )}
          aria-label="Toggle message summary"
        />
      </Tooltip>
    </div>
  );
};
