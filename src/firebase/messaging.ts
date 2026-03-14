import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging';
import app from './firebase';

const messaging: Messaging = getMessaging(app);

export const requestForToken = async () => {
  try {
    const currentToken = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    });
    if (currentToken) {
      return currentToken;
    } else {
      console.warn('No registration token available. Request permission to generate one.');
      return null;
    }
  } catch (err) {
    console.error('An error occurred while retrieving token. ', err);
    throw err;
  }
};

/**
 * Listen for foreground messages
 * @param callback Function to call when a message is received
 * @returns Unsubscribe function
 */
export const onMessageListener = (callback: (payload: any) => void) => {
  return onMessage(messaging, (payload) => {
    console.log('[messaging.ts] Received foreground message ', payload);
    callback(payload);
  });
};

export default messaging;
