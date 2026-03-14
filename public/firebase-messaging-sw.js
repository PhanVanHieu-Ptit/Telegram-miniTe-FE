/* eslint-disable no-undef */
// Import and configure the Firebase SDK
// These scripts are made available when the app is served or deployed on Firebase Hosting
// If you're not using Firebase Hosting, replace it with the URL of your Firebase SDK
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in the messagingSenderId
// Note: These values must match the ones in your firebase.ts file
firebase.initializeApp({
  apiKey: "AIzaSyASRUgF6NG0dg7QbodolJiqDIXOu7h-AxM",
  authDomain: "app-3hchat.firebaseapp.com",
  projectId: "app-3hchat",
  storageBucket: "app-3hchat.firebasestorage.app",
  messagingSenderId: "476840902328",
  appId: "1:476840902328:web:1da8137c88eb032bdb7e4d",
  measurementId: "G-FL671WGM62"
});

// Retrieve an instance of Firebase Messaging so that it can handle background messages
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new message',
    icon: '/firebase-logo.png',
    data: payload.data, // Important for click handling
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked', event.notification.data);
  event.notification.close();

  // URL to open when notification is clicked
  const clickAction = event.notification.data?.click_action || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window client is already open, focus it
      for (const client of clientList) {
        if (client.url === clickAction && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window client is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(clickAction);
      }
    })
  );
});
