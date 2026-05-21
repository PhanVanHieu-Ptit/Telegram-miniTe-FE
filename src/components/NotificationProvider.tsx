import { onMessageListener } from '@/firebase/messaging';
import { useFcm } from '@/hooks/useFcm';
import { useAuthStore } from '@/store/auth.store';
import { useChatStore } from '@/store/chat.store';
import { notification } from 'antd';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import NotificationItem, { type NotificationType } from './Notifications/NotificationItem';

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
  const { t } = useTranslation();

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
    let avatarUrl = note?.icon || data?.senderAvatar || '/logo192.png';
    let actionPath = '';
    let title = note?.title || data?.senderName || t('notifications.type_system');
    let message = note?.body || '';

    // Handle media message previews
    if (data?.messageType && data.messageType !== 'text') {
      const typeKey = `notifications.media_${data.messageType.toLowerCase()}`;
      const translatedType = t(typeKey, { defaultValue: data.messageType });
      message = t('notifications.sent_a', { type: translatedType });
    }

    if (data?.type === 'CALL_INCOMING') {
      type = 'alert';
      title = t('notifications.incoming_call_title');
      message = t('notifications.someone_calling', { name: data?.callerName ?? t('unknown') });
    } else if (data?.type === 'CHAT_MESSAGE' || data?.type === 'chat_message' || data?.conversationId) {
      type = 'chat';
      const msgId = data?.messageId || data?.id;
      actionPath = `/chat?id=${data.conversationId}${msgId ? `&msgId=${msgId}` : ''}`;
    } else if (data?.type === 'SYSTEM_ALERT') {
      type = 'alert';
    } else if (data?.type === 'USER_ACTIVITY') {
      type = 'activity';
    }

    return {
      title,
      message,
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
        // Prevent showing notification for self-sent messages
        const currentUser = useAuthStore.getState().user;
        if (payload.data?.senderId && currentUser?.id && payload.data.senderId === currentUser.id) {
          return;
        }

        // Prevent showing notification for current active conversation
        const activeConversationId = useChatStore.getState().activeConversationId;
        if (payload.data?.conversationId && activeConversationId && payload.data.conversationId === activeConversationId) {
          return;
        }

        const { title, message, type, avatarUrl, actionPath, timestamp } = parseNotification(payload);
        const key = `notification-${Date.now()}`;

        // Small delay for smoother entrance when many things happen at once
        setTimeout(() => {
          api.open({
            key,
            message: null,
            description: (
              <NotificationItem
                title={title}
                message={message}
                type={type}
                avatarUrl={avatarUrl}
                timestamp={timestamp}
                onView={() => {
                  if (actionPath) navigate(actionPath);
                  api.destroy(key);
                }}
                onDismiss={() => {
                  api.destroy(key);
                }}
              />
            ),
            placement: 'topRight',
            duration: 8,
            className: 'custom-notification-notice',
            style: { padding: 0 },
          });
        }, 100);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isAuthenticated, api, navigate, t]);

  return (
    <>
      {contextHolder}
      {children}
    </>
  );
};

export default NotificationProvider;
