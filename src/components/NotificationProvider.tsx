import React, { useEffect } from 'react';
import { notification } from 'antd';
import { onMessageListener } from '@/firebase/messaging';
import { useFcm } from '@/hooks/useFcm';
import { useAuthStore } from '@/store/auth.store';
import NotificationItem, { type NotificationType } from './Notifications/NotificationItem';
import { useNavigate } from 'react-router-dom';

interface NotificationProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component to handle foreground notifications and FCM initialization
 */
const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { registerFcm, unregisterFcm, error: fcmError } = useFcm();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [api, contextHolder] = notification.useNotification();
  const navigate = useNavigate();

  // 1. Initialize FCM when the app starts or user logs in
  useEffect(() => {
    if (isAuthenticated) {
      registerFcm();
    } else {
      unregisterFcm();
    }
  }, [isAuthenticated, registerFcm, unregisterFcm]);

  // Handle FCM errors
  useEffect(() => {
    if (fcmError) {
      api.warning({
        message: 'Notification Support',
        description: fcmError.message || 'Failed to initialize notifications.',
        placement: 'bottomRight',
      });
    }
  }, [fcmError, api]);

  /**
   * Parse FCM payload to determine notification type and other attributes
   */
  const parseNotification = (payload: any) => {
    const { notification: note, data } = payload;
    
    let type: NotificationType = 'system';
    let avatarUrl = note?.icon || '/logo192.png'; // Fallback to logo
    let actionPath = '';

    // Example logic to determine type based on data
    if (data?.type === 'CALL_INCOMING') {
      type = 'alert';
      actionPath = '';
      return {
        title: note?.title || 'Incoming Call',
        message: note?.body || `${data?.callerName ?? 'Someone'} is calling you`,
        type,
        avatarUrl,
        actionPath,
        timestamp: data?.timestamp || new Date(),
      };
    } else if (data?.type === 'CHAT_MESSAGE' || data?.type === 'chat_message' || data?.conversationId) {
      type = 'chat';
      avatarUrl = data?.senderAvatar || avatarUrl;
      actionPath = `/chat?id=${data.conversationId}`;
    } else if (data?.type === 'SYSTEM_ALERT') {
      type = 'alert';
    } else if (data?.type === 'USER_ACTIVITY') {
      type = 'activity';
    }

    return {
      title: note?.title || 'New Notification',
      message: note?.body || '',
      type,
      avatarUrl,
      actionPath,
      timestamp: data?.timestamp || new Date(),
    };
  };

  // 2. Listen for foreground messages
  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubscribe = onMessageListener((payload) => {
      if (payload) {
        const { title, message, type, avatarUrl, actionPath, timestamp } = parseNotification(payload);
        const key = `notification-${Date.now()}`;

        api.open({
          key,
          message: null, // We use custom content so we set this to null or simple text
          description: (
            <NotificationItem
              title={title}
              message={message}
              type={type}
              avatarUrl={avatarUrl}
              timestamp={timestamp}
              onView={() => {
                if (actionPath) navigate(actionPath);
                notification.destroy(key);
              }}
              onDismiss={() => {
                notification.destroy(key);
              }}
            />
          ),
          placement: 'topRight',
          duration: 10, // Longer duration for structured notifications
          className: 'custom-notification-notice',
          style: { padding: 0 }, // Let NotificationItem handle padding
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isAuthenticated, api, navigate]);

  return (
    <>
      {contextHolder}
      {children}
    </>
  );
};

export default NotificationProvider;
