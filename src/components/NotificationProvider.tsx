import React, { useEffect } from 'react';
import { notification } from 'antd';
import { onMessageListener } from '@/firebase/messaging';
import { useFcm } from '@/hooks/useFcm';
import { useAuthStore } from '@/store/auth.store';

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

  // 1. Initialize FCM when the app starts or user logs in
  useEffect(() => {
    if (isAuthenticated) {
      registerFcm();
    } else {
      // Clean up on logout
      unregisterFcm();
    }
  }, [isAuthenticated, registerFcm, unregisterFcm]);

  // Handle FCM errors
  useEffect(() => {
    if (fcmError) {
      // Don't log out automatically on notification failure.
      // Notifications are non-critical. We just show a warning.
      api.warning({
        message: 'Notification Support',
        description: fcmError.message || 'Failed to initialize notifications.',
        placement: 'bottomRight',
      });
    }
  }, [fcmError, api]);

  // 2. Listen for foreground messages
  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubscribe = onMessageListener((payload) => {
      if (payload) {
        api.info({
          message: payload.notification?.title || 'New Message',
          description: payload.notification?.body || 'You have a new notification',
          placement: 'topRight',
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isAuthenticated, api]);

  return (
    <>
      {contextHolder}
      {children}
    </>
  );
};

export default NotificationProvider;
