import { Spin, Typography } from 'antd';
import { motion } from 'framer-motion';
import { AlertCircle, Filter, Sparkles } from 'lucide-react';
import React from 'react';

const { Text } = Typography;

interface SummaryResultProps {
  summary: string[] | null;
  loading: boolean;
  error?: string | null;
}

export const SummaryResult: React.FC<SummaryResultProps> = ({ summary, loading, error }) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full" />
        <Spin indicator={<Sparkles className="h-10 w-10 animate-spin text-primary" />} />
        <div className="text-center space-y-1 relative z-10">
          <Text strong style={{ color: 'white', display: 'block' }}>Neural Processing...</Text>
          <Text style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>Distilling conversation data</Text>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-3 text-center text-destructive">
        <AlertCircle className="h-10 w-10 opacity-50" />
        <Text strong style={{ color: 'var(--destructive)' }}>Transmission Error</Text>
        <Text style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{error}</Text>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="p-16 flex flex-col items-center justify-center opacity-70">
        <div className="h-20 w-20 flex items-center justify-center rounded-3xl bg-white/5 border border-white/10 mb-6 shadow-[0_0_20px_rgba(255,255,255,0.05)]">
          <Filter className="h-8 w-8 text-white/60" />
        </div>
        <Text style={{ color: 'white', fontSize: '13px', textAlign: 'center', lineHeight: '1.6', fontWeight: 500 }}>
          Configure neural filters above to generate a <br />
          <span className="text-primary font-bold">Transmission Summary</span>
        </Text>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5 overflow-y-auto max-h-[350px]">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-1 w-8 bg-primary rounded-full" />
        <Text strong style={{ color: 'var(--primary)', fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase' }}>Intelligence Extract</Text>
      </div>
      {summary.map((line, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.1 }}
          className="flex gap-4 items-start bg-white/5 p-4 rounded-xl border border-white/5 hover:border-primary/20 transition-all"
        >
          <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
          <p className="m-0 text-sm leading-relaxed text-white/80">
            {line}
          </p>
        </motion.div>
      ))}
    </div>
  );
};
