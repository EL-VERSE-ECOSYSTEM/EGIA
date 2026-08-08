import type { WebhookPayload } from "@/types/webhook.types";
import { handleAttendanceWebhook } from "./attendance";
import { handlePaymentWebhook } from "./payments";
import { handleResultWebhook } from "./results";

export async function processWebhook(payload: WebhookPayload, eventKey: string) {
  switch (payload.table) {
    case "payments": return handlePaymentWebhook(payload, eventKey);
    case "results": return handleResultWebhook(payload, eventKey);
    case "attendance_records": return handleAttendanceWebhook(payload, eventKey);
    default: return;
  }
}
