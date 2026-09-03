importScripts('https://www.gstatic.com/firebasejs/11.10.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.10.0/firebase-messaging-compat.js');
firebase.initializeApp({apiKey:'AIzaSyAih9Mm-8SSaxMmAEmsFvXq6NaiM3XNCqg',authDomain:'goodnews-ebd4a.firebaseapp.com',projectId:'goodnews-ebd4a',storageBucket:'goodnews-ebd4a.firebasestorage.app',messagingSenderId:'386371308698',appId:'1:386371308698:web:01b21894092efc459de323'});
const messaging = firebase.messaging();
messaging.onBackgroundMessage((payload) => self.registration.showNotification(payload.notification?.title || "EL LEARNERS App", { body: payload.notification?.body || "You have a new notification", icon: "/logo.svg", badge: "/logo.svg", data: payload.data || {} }));
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const requested = event.notification.data?.link;
  // Only accept local, absolute paths from a push payload.
  const destination = typeof requested === 'string' && requested.startsWith('/') && !requested.startsWith('//') ? requested : '/dashboard-redirect';
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
    const existing = windows.find((client) => new URL(client.url).origin === self.location.origin);
    if (existing) return existing.focus().then(() => existing.navigate(destination));
    return clients.openWindow(destination);
  }));
});
