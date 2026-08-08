import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import type { PushNotification } from "./types";

function adminMessaging() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not configured");
  const serviceAccount = JSON.parse(raw);
  const app = getApps().length ? getApp() : initializeApp({ credential: cert(serviceAccount), projectId: serviceAccount.project_id });
  return getMessaging(app);
}

export async function sendFCMNotification(token: string, notification: PushNotification) {
  try {
    const messageId = await adminMessaging().send({
      token,
      notification: { title: notification.title, body: notification.body, imageUrl: notification.image },
      data: { ...notification.data, link: notification.link || "/dashboard", type: notification.type },
      webpush: { headers: { Urgency: "high" }, notification: { icon: "/logo.svg", data: { link: notification.link || "/dashboard" } } },
    });
    return { success: true, messageId };
  } catch (error) { return { success: false, error: error instanceof Error ? error.message : "FCM send failed" }; }
}

export async function sendMulticastFCM(tokens: string[], notification: PushNotification) {
  if (!tokens.length) return { success: true, successCount: 0, failureCount: 0, invalidTokens: [] as string[] };
  try {
    const response = await adminMessaging().sendEachForMulticast({
      tokens, notification: { title: notification.title, body: notification.body, imageUrl: notification.image },
      data: { ...notification.data, link: notification.link || "/dashboard", type: notification.type },
      webpush: { headers: { Urgency: "high" }, notification: { icon: "/logo.svg", data: { link: notification.link || "/dashboard" } } },
    });
    const invalidTokens = response.responses.flatMap((result, index) => result.success ? [] : [tokens[index]]);
    return { success: true, successCount: response.successCount, failureCount: response.failureCount, invalidTokens };
  } catch (error) { return { success: false, successCount: 0, failureCount: tokens.length, invalidTokens: [], error: error instanceof Error ? error.message : "FCM send failed" }; }
}
