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
    <div className={cn("fixed bottom-6 right-6 z-50", className)}>
      <Tooltip title={isOpen ? "Close Summary" : "AI Message Summary"} placement="left">
        <Button
          type="primary"
          shape="circle"
          size="large"
          icon={<Sparkles className={cn("h-6 w-6 transition-transform", isOpen && "rotate-180")} />}
          onClick={onClick}
          className={cn(
            "h-14 w-14 shadow-2xl flex items-center justify-center border-none",
            "bg-gradient-to-tr from-blue-600 to-indigo-500 hover:from-blue-700 hover:to-indigo-600 transition-all duration-300",
            isOpen ? "scale-90 opacity-90" : "hover:scale-110"
          )}
          aria-label="Toggle message summary"
        />
      </Tooltip>
    </div>
  );
};
