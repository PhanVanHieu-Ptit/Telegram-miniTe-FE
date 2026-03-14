import apiClient from '@/api/axios';

const FCM_TOKEN_KEY = 'fcm_token';

export interface RegisterTokenDto {
  token: string;
  platform: 'web' | 'android' | 'ios';
}

/**
 * Service for handling notification-related API calls and local storage
 */
export const notificationService = {
  /**
   * Register FCM token to backend
   */
  registerToken: async (token: string): Promise<void> => {
    try {
      const data: RegisterTokenDto = {
        token,
        platform: 'web',
      };
      
      await apiClient.post('/notifications/token', data);
      
      // Store token locally to avoid duplicate registration
      localStorage.setItem(FCM_TOKEN_KEY, token);
    } catch (error) {
      console.error('Failed to register FCM token to backend:', error);
      throw error;
    }
  },

  /**
   * Get stored FCM token
   */
  getStoredToken: (): string | null => {
    return localStorage.getItem(FCM_TOKEN_KEY);
  },

  /**
   * Remove stored FCM token (for logout)
   */
  removeToken: async (): Promise<void> => {
    const token = localStorage.getItem(FCM_TOKEN_KEY);
    if (!token) return;

    try {
      await apiClient.delete('/notifications/token', { data: { token } });
    } catch (error) {
      console.error('Failed to remove FCM token from backend:', error);
    } finally {
      localStorage.removeItem(FCM_TOKEN_KEY);
    }
  },

  /**
   * Check if token is already registered
   */
  isTokenRegistered: (token: string): boolean => {
    return localStorage.getItem(FCM_TOKEN_KEY) === token;
  }
};
