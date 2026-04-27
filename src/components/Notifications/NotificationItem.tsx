import { cn } from '@/lib/utils';
import { Avatar, Button, Typography } from 'antd';
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
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="group relative w-full overflow-hidden"
    >
      <div className="flex flex-col gap-3 p-4">
        {/* Header Metadata */}
        <div className="flex items-center justify-between">
          <div className={cn(
            "flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider",
            theme.bg, theme.color, theme.border
          )}>
            {theme.icon}
            <span>{theme.label}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-slate-500">
              {formatTime(timestamp)}
            </span>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onDismiss?.();
              }}
              className="p-1 rounded-full hover:bg-white/10 text-slate-500 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Core Content */}
        <div className="flex gap-4">
          <div className="relative shrink-0">
            <Avatar 
              src={avatarUrl} 
              size={48}
              className="ring-2 ring-white/5 bg-slate-800 object-cover"
            />
            <div className={cn(
              "absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#141414] shadow-lg",
              theme.bg, theme.color
            )}>
              {theme.icon}
            </div>
          </div>

          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <Text className="!text-white font-semibold text-[15px] leading-tight truncate">
              {title}
            </Text>
            <p className="text-[13px] leading-snug text-slate-400 line-clamp-2">
              {message}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-2 mt-1">
          <Button 
            type="primary" 
            size="small" 
            icon={<ExternalLink size={14} />}
            onClick={(e) => {
              e.stopPropagation();
              onView?.();
            }}
            className="h-8 rounded-lg bg-blue-600 hover:bg-blue-500 border-none px-4 text-xs font-semibold shadow-md shadow-blue-500/20"
          >
            {t('notifications.view_details')}
          </Button>
          <Button 
            type="text" 
            size="small" 
            onClick={(e) => {
              e.stopPropagation();
              onDismiss?.();
            }}
            className="h-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 px-3 text-xs font-medium"
          >
            {t('notifications.ignore')}
          </Button>
        </div>
      </div>

      {/* Decorative gradient background (subtle) */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none" />
    </motion.div>
  );
};

export default NotificationItem;


