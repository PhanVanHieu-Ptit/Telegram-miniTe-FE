import { cn } from '@/lib/utils';
import { Avatar, Typography } from 'antd';
import { motion } from 'framer-motion';
import { Bell, ExternalLink, Info, MessageSquare, X, Zap } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

export type NotificationType = 'chat' | 'system' | 'activity' | 'alert';

export interface NotificationItemProps {
  title: string;
  message: string;
  type?: NotificationType;
  avatarUrl?: string;
  timestamp?: string | number | Date;
  onView?: () => void;
  onDismiss?: () => void;
  metadata?: Record<string, any>;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  title,
  message,
  type = 'system',
  avatarUrl,
  timestamp = new Date(),
  onView,
  onDismiss,
}) => {
  const { t } = useTranslation();

  const formatTime = (date: string | number | Date) => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return t('notifications.just_now');

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (diffInSeconds < 60) return t('notifications.just_now');
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}${t('notifications.m')}`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}${t('notifications.h')}`;
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getTheme = () => {
    switch (type) {
      case 'chat':
        return {
          icon: <MessageSquare size={14} />,
          color: 'text-blue-400',
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/20',
          label: t('notifications.type_chat')
        };
      case 'activity':
        return {
          icon: <Zap size={14} />,
          color: 'text-amber-400',
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/20',
          label: t('notifications.type_activity')
        };
      case 'alert':
        return {
          icon: <Bell size={14} />,
          color: 'text-rose-400',
          bg: 'bg-rose-500/10',
          border: 'border-rose-500/20',
          label: t('notifications.type_alert')
        };
      default:
        return {
          icon: <Info size={14} />,
          color: 'text-slate-400',
          bg: 'bg-slate-500/10',
          border: 'border-slate-500/20',
          label: t('notifications.type_system')
        };
    }
  };

  const theme = getTheme();

  return (
    <motion.div
      initial={{ opacity: 0, x: 20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      className="relative w-full overflow-hidden"
    >
      <div className="flex flex-col gap-3 p-4 bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
        {/* Header Metadata */}
        <div className="flex items-center justify-between mb-0.5">
          <div className={cn(
            "flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[9px] font-extrabold uppercase tracking-[0.1em]",
            theme.bg, theme.color, theme.border
          )}>
            {theme.icon}
            <span>{theme.label}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              {formatTime(timestamp)}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDismiss?.();
              }}
              className="p-1.2 rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-300"
            >
              <X size={12} />
            </button>
          </div>
        </div>

        {/* Core Content */}
        <div className="flex gap-4 items-start">
          <div className="relative shrink-0 mt-0.5">
            <Avatar
              src={avatarUrl}
              size={52}
              className="ring-2 ring-white/10 bg-slate-800 object-cover shadow-xl"
            />
            <div className={cn(
              "absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-[1.5px] border-[#0a0f19] shadow-lg",
              theme.bg, theme.color
            )}>
              {theme.icon}
            </div>
          </div>

          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <Text className="!text-white font-bold text-[16px] tracking-tight leading-tight truncate">
              {title}
            </Text>
            <p className="text-[14px] leading-[1.4] text-slate-400/90 font-medium line-clamp-2">
              {message}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-2 mt-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView?.();
            }}
            className="flex-1 flex items-center justify-center gap-2 h-9 rounded-xl bg-primary/20 hover:bg-primary/30 border border-primary/20 text-primary text-[12px] font-bold transition-all duration-300 active:scale-[0.98]"
          >
            <ExternalLink size={14} />
            {t('notifications.view_details')}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDismiss?.();
            }}
            className="flex items-center justify-center h-9 w-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-slate-400 hover:text-white transition-all duration-300"
            title={t('notifications.ignore')}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Glow Effect */}
      <div className={cn(
        "absolute top-0 right-0 w-24 h-24 -z-10 blur-[40px] opacity-20 rounded-full",
        type === 'chat' ? 'bg-blue-500' : type === 'alert' ? 'bg-rose-500' : 'bg-primary'
      )} />
    </motion.div>
  );
};

export default NotificationItem;


