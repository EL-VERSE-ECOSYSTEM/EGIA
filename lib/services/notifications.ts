import { createClient } from "@supabase/supabase-js";
import { sendMulticastFCM } from "@/lib/firebase/server";

export type NotificationData = {
  userId: string;
  title: string;
  body: string;
  type: string;
  data?: Record<string, unknown>;
  link?: string;
  /** A stable source event id makes delivery safe to retry. */
  eventKey: string;
};

type DeliveryResult = { delivered: boolean; tokenCount: number; successCount: number; failureCount: number };

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Supabase service credentials are not configured");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

function fcmData(data: Record<string, unknown> | undefined, type: string, link: string | undefined) {
  return Object.fromEntries(Object.entries({ ...data, type, link: link || "/dashboard", timestamp: new Date().toISOString() })
    .map(([key, value]) => [key, typeof value === "string" ? value : JSON.stringify(value ?? "")]));
}

/** Sends FCM and persists the in-app notification used by realtime clients. */
export async function sendPushNotification(notification: NotificationData): Promise<DeliveryResult> {
  const supabase = serviceClient();
  const { data: tokenRows, error: tokenError } = await supabase
    .from("user_fcm_tokens").select("token").eq("user_id", notification.userId).eq("is_active", true);
  if (tokenError) throw new Error(`Unable to load FCM tokens: ${tokenError.message}`);

  const tokens = [...new Set((tokenRows ?? []).map(({ token }) => token).filter(Boolean))];
  let successCount = 0;
  let failureCount = 0;
  const invalidTokens: string[] = [];

  // Firebase limits a multicast request to 500 registration tokens.
  for (let index = 0; index < tokens.length; index += 500) {
    const batch = tokens.slice(index, index + 500);
    const outcome = await sendMulticastFCM(batch, {
      title: notification.title,
      body: notification.body,
      type: notification.type as never,
      link: notification.link,
      data: fcmData(notification.data, notification.type, notification.link),
    });
    successCount += outcome.successCount;
    failureCount += outcome.failureCount;
    invalidTokens.push(...outcome.invalidTokens);
  }

  if (invalidTokens.length) {
    const { error } = await supabase.from("user_fcm_tokens").update({ is_active: false, updated_at: new Date().toISOString() }).in("token", invalidTokens);
    if (error) console.error("Could not deactivate invalid FCM tokens", { error: error.message, count: invalidTokens.length });
  }

  const delivered = tokens.length > 0 && failureCount === 0;
  const { error: historyError } = await supabase.from("notification_history").upsert({
    user_id: notification.userId, event_key: notification.eventKey, title: notification.title, body: notification.body,
    type: notification.type, data: notification.data ?? {}, link: notification.link ?? "/dashboard", delivered,
    metadata: { token_count: tokens.length, success_count: successCount, failure_count: failureCount }, sent_at: new Date().toISOString(),
  }, { onConflict: "user_id,event_key" });
  if (historyError) throw new Error(`Unable to record notification: ${historyError.message}`);

  return { delivered, tokenCount: tokens.length, successCount, failureCount };
}
