import React from 'react';
import { Avatar, Button, Space, Typography, Tag } from 'antd';
import { Bell, MessageSquare, Info, ExternalLink } from 'lucide-react';

const { Text, Title, Paragraph } = Typography;

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

/**
 * Format timestamp to a human-readable string
 */
const formatTime = (date: string | number | Date) => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'just now';
  
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return d.toLocaleDateString();
};

const NotificationItem: React.FC<NotificationItemProps> = ({
  title,
  message,
  type = 'system',
  avatarUrl,
  timestamp = new Date(),
  onView,
  onDismiss,
}) => {
  const getIcon = () => {
    switch (type) {
      case 'chat':
        return <MessageSquare size={16} className="text-blue-500" />;
      case 'activity':
        return <Bell size={16} className="text-orange-500" />;
      case 'alert':
        return <Info size={16} className="text-red-500" />;
      default:
        return <Info size={16} className="text-gray-500" />;
    }
  };

  const getTypeTag = () => {
    switch (type) {
      case 'chat':
        return <Tag color="blue" bordered={false}>Message</Tag>;
      case 'activity':
        return <Tag color="orange" bordered={false}>Update</Tag>;
      case 'system':
        return <Tag color="default" bordered={false}>System</Tag>;
      case 'alert':
        return <Tag color="error" bordered={false}>Alert</Tag>;
      default:
        return null;
    }
  };

  return (
    <div className="notification-item-content">
      <div className="flex items-start gap-3">
        {/* Left Side: Avatar or Icon */}
        <div className="relative pt-1">
          <Avatar 
            src={avatarUrl} 
            icon={!avatarUrl && getIcon()} 
            size={44}
            className="shadow-sm border border-gray-100 bg-gray-50 flex items-center justify-center p-0"
          />
          <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-gray-50 flex items-center justify-center">
            {getIcon()}
          </div>
        </div>

        {/* Middle: Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <Title level={5} className="!mb-0 !text-sm font-bold truncate" style={{ margin: 0, fontSize: '14px' }}>
              {title}
            </Title>
            <Text type="secondary" style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>
              {formatTime(timestamp)}
            </Text>
          </div>
          
          <div className="mb-2">
            {getTypeTag()}
          </div>

          <Paragraph 
            ellipsis={{ rows: 2 }} 
            className="!mb-3 text-gray-600 text-[13px] leading-relaxed"
            style={{ margin: 0, marginBottom: '12px', color: '#4b5563' }}
          >
            {message}
          </Paragraph>

          {/* Actions */}
          <Space size={8} className="w-full justify-start mt-1">
            <Button 
              type="primary" 
              size="small" 
              icon={<ExternalLink size={12} />}
              onClick={(e) => {
                e.stopPropagation();
                onView?.();
              }}
              className="rounded-md px-3 text-[12px] h-7 flex items-center gap-1"
            >
              View
            </Button>
            <Button 
              type="text" 
              size="small" 
              onClick={(e) => {
                e.stopPropagation();
                onDismiss?.();
              }}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md text-[12px] h-7 px-2"
            >
              Dismiss
            </Button>
          </Space>
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;
