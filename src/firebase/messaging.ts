import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging';
import app from './firebase';

const messaging: Messaging = getMessaging(app);

export const requestForToken = async () => {
  try {
    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };
    const configString = encodeURIComponent(JSON.stringify(firebaseConfig));
    const registration = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?config=${configString}`);
    
    // 🛠️ CRITICAL FIX: Wait for the service worker to be fully ready/active
    await navigator.serviceWorker.ready;

    // Optional: force an update to ensure the latest SW is active
    await registration.update().catch(() => {});

    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    console.log('[FCM] Requesting token with vapidKey:', vapidKey ? 'Present' : 'Missing');

    const currentToken = await getToken(messaging, {
      vapidKey: vapidKey,
      serviceWorkerRegistration: registration,
    });
    
    if (currentToken) {
      console.log('[FCM] Token generated successfully');
      return currentToken;
    } else {
      console.warn('No registration token available. Request permission to generate one.');
      return null;
    }
  } catch (err: any) {
    console.error('An error occurred while retrieving token. ', err);
    if (err?.message?.includes('Registration failed - push service error')) {
      console.error('🔥 FCM Push Service Error Fixes: \n1. Check if VAPID Key is correct.\n2. Ensure the app is served over HTTPS or localhost.\n3. Make sure the Service Worker is correctly initialized.\n4. If inside Telegram Webview on mobile or Incognito, Push API might be blocked.');
    }
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
