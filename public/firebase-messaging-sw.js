importScripts('https://www.gstatic.com/firebasejs/11.10.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.10.0/firebase-messaging-compat.js');
firebase.initializeApp({apiKey:'AIzaSyAih9Mm-8SSaxMmAEmsFvXq6NaiM3XNCqg',authDomain:'goodnews-ebd4a.firebaseapp.com',projectId:'goodnews-ebd4a',storageBucket:'goodnews-ebd4a.firebasestorage.app',messagingSenderId:'386371308698',appId:'1:386371308698:web:01b21894092efc459de323'});
const messaging = firebase.messaging();
messaging.onBackgroundMessage((payload) => self.registration.showNotification(payload.notification?.title || "EL GOODNEWS INT'L ACADEMY", { body: payload.notification?.body || "You have a new notification", icon: "/logo.svg", data: payload.data || {} }));
self.addEventListener('notificationclick', (event) => { event.notification.close(); event.waitUntil(clients.openWindow(event.notification.data?.link || '/dashboard-redirect')); });
