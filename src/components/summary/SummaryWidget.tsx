import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SummaryFloatingButton } from './SummaryFloatingButton';
import { SummaryBubble } from './SummaryBubble';
import { useSummary } from '@/hooks/useSummary';

export const SummaryWidget: React.FC = () => {
  const summaryState = useSummary();

  return (
    <AnimatePresence>
      {summaryState.hasActiveConversation && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <SummaryFloatingButton 
            isOpen={summaryState.isOpen} 
            onClick={summaryState.toggleOpen} 
          />
          <SummaryBubble 
            {...summaryState}
            onClose={summaryState.close} 
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
