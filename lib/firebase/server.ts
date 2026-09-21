import { cert, getApp, getApps, initializeApp, type ServiceAccount } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import type { PushNotification } from "./types";

function sanitizeFCMData(raw: Record<string, unknown> | undefined): Record<string, string> {
  if (!raw) return {};
  return Object.fromEntries(
    Object.entries(raw).map(([key, value]) => [
      key,
      typeof value === "string" ? value : JSON.stringify(value ?? ""),
    ])
  );
}

function adminMessaging() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not configured");
  let serviceAccount: ServiceAccount;
  try {
    const parsed = JSON.parse(raw) as { project_id?: string; client_email?: string; private_key?: string };
    if (!parsed.project_id || !parsed.client_email || !parsed.private_key) throw new Error("missing service account fields");
    serviceAccount = { projectId: parsed.project_id, clientEmail: parsed.client_email, privateKey: parsed.private_key };
  } catch {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON must be valid JSON");
  }
  const app = getApps().length ? getApp() : initializeApp({ credential: cert(serviceAccount), projectId: serviceAccount.projectId });
  return getMessaging(app);
}

export async function sendFCMNotification(token: string, notification: PushNotification) {
  try {
    const messageId = await adminMessaging().send({
      token,
      notification: { title: notification.title, body: notification.body, imageUrl: notification.image },
      data: sanitizeFCMData({ ...notification.data, link: notification.link || "/dashboard", type: notification.type }),
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
      data: sanitizeFCMData({ ...notification.data, link: notification.link || "/dashboard", type: notification.type }),
      webpush: { headers: { Urgency: "high" }, notification: { icon: "/logo.svg", data: { link: notification.link || "/dashboard" } } },
    });
    const invalidTokens = response.responses.flatMap((result, index) => {
      const code = result.error?.code;
      return !result.success && (code === "messaging/registration-token-not-registered" || code === "messaging/invalid-registration-token") ? [tokens[index]] : [];
    });
    return { success: true, successCount: response.successCount, failureCount: response.failureCount, invalidTokens };
  } catch (error) { return { success: false, successCount: 0, failureCount: tokens.length, invalidTokens: [], error: error instanceof Error ? error.message : "FCM send failed" }; }
}
