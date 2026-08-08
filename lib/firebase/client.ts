"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import { getMessaging, getToken, isSupported, onMessage, type MessagePayload, type Unsubscribe } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAih9Mm-8SSaxMmAEmsFvXq6NaiM3XNCqg",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "goodnews-ebd4a.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "goodnews-ebd4a",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "goodnews-ebd4a.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "386371308698",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:386371308698:web:01b21894092efc459de323",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-L7E5H57Q02",
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

async function messaging() {
  if (typeof window === "undefined" || !(await isSupported())) return null;
  return getMessaging(firebaseApp);
}

export async function requestNotificationPermission() {
  const client = await messaging();
  if (!client || Notification.permission === "denied") return null;
  if (Notification.permission !== "granted" && await Notification.requestPermission() !== "granted") return null;
  const vapidKey = process.env.NEXT_PUBLIC_FCM_VAPID_KEY;
  if (!vapidKey) {
    console.error("NEXT_PUBLIC_FCM_VAPID_KEY is not configured");
    return null;
  }
  return getToken(client, { vapidKey });
}

export async function listenForForegroundMessages(callback: (payload: MessagePayload) => void): Promise<Unsubscribe | undefined> {
  const client = await messaging();
  return client ? onMessage(client, callback) : undefined;
}
