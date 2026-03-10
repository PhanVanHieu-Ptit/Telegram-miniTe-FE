import React from 'react';
import { SummaryFloatingButton } from './SummaryFloatingButton';
import { SummaryBubble } from './SummaryBubble';
import { useSummary } from '@/hooks/useSummary';

export const SummaryWidget: React.FC = () => {
  const summaryState = useSummary();

  return (
    <>
      <SummaryFloatingButton 
        isOpen={summaryState.isOpen} 
        onClick={summaryState.toggleOpen} 
      />
      <SummaryBubble 
        {...summaryState}
        onClose={summaryState.close} 
      />
    </>
  );
};
