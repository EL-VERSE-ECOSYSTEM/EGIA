import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { notificationTemplates } from "@/lib/notifications/templates";
import { notifyParentProfile, notifyStudentAndParent } from "@/lib/notifications/triggers";

const webhookEvent = z.object({
  type: z.string().min(1),
  table: z.string().min(1),
  record: z.record(z.string(), z.unknown()).optional(),
  old_record: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Receives Supabase Database Webhooks. Configure SUPABASE_WEBHOOK_SECRET in
 * Vercel and set the same value in the webhook's `x-webhook-secret` header.
 */
export async function POST(request: NextRequest) {
  const expected = process.env.SUPABASE_WEBHOOK_SECRET;
  if (!expected || request.headers.get("x-webhook-secret") !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = webhookEvent.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });

  const record = parsed.data.record as Record<string, unknown> | undefined;
  // Database column casing follows the existing production schema.
  if (record && parsed.data.type === "INSERT" && parsed.data.table === "assessment_result" && typeof record.studentId === "string") {
    await notifyStudentAndParent(record.studentId, notificationTemplates.assessmentResult("A student", "Assessment", "Published", Number(record.score || 0)));
  }
  if (record && ["INSERT", "UPDATE"].includes(parsed.data.type) && parsed.data.table === "attendance" && typeof record.studentId === "string" && String(record.status).toLowerCase() === "absent") {
    await notifyStudentAndParent(record.studentId, notificationTemplates.attendanceAbsent("A student", String(record.date || "today"), "Class"));
  }
  if (record && ["INSERT", "UPDATE"].includes(parsed.data.type) && parsed.data.table === "payment" && typeof record.parentid === "string" && ["success", "completed"].includes(String(record.status).toLowerCase())) {
    await notifyParentProfile(record.parentid, notificationTemplates.paymentConfirmed("your child", Number(record.amount || 0), String(record.transactionreference || record.id || "N/A")));
  }
  console.info("Supabase webhook received", { type: parsed.data.type, table: parsed.data.table });
  return NextResponse.json({ received: true });
}
