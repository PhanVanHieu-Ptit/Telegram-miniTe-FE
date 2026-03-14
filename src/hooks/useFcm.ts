import { useState, useCallback } from 'react';
import { requestForToken } from '@/firebase/messaging';
import { notificationService } from '@/services/notificationService';

/**
 * Custom hook to manage FCM token registration and notification permissions
 */
export const useFcm = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const registerFcm = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Request browser notification permission
      const permission = await Notification.requestPermission();
      
      if (permission === 'denied') {
        throw new Error('Notification permission denied');
      }

      if (permission === 'granted') {
        // 2. Generate FCM token
        const token = await requestForToken();
        
        if (token) {
          // 3. Send token to backend if not already registered
          if (!notificationService.isTokenRegistered(token)) {
            await notificationService.registerToken(token);
          }
        }
      }
    } catch (err) {
      console.error('FCM Registration Error:', err);
      setError(err instanceof Error ? err : new Error('Unknown FCM error'));
    } finally {
      setLoading(false);
    }
  }, []);

  const unregisterFcm = useCallback(async () => {
    setLoading(true);
    try {
      await notificationService.removeToken();
    } catch (err) {
      console.error('FCM Unregistration Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    registerFcm,
    unregisterFcm,
    loading,
    error,
  };
};
