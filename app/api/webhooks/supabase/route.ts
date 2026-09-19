import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { processWebhook } from "@/lib/webhook/handlers";
import { logger } from "@/lib/webhook/logger";
import { supabaseAdmin } from "@/lib/webhook/handlers/shared";
import type { WebhookPayload } from "@/types/webhook.types";

const schema = z.object({
  type: z.enum(["INSERT", "UPDATE", "DELETE"]),
  table: z.enum(["payments", "results", "attendance_records"]),
  schema: z.string().optional(),
  record: z.record(z.string(), z.unknown()).optional(),
  old_record: z.record(z.string(), z.unknown()).optional(),
  timestamp: z.string().optional(),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function validSecret(received: string | null, expected: string) {
  if (!received) return false;
  const left = Buffer.from(received);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

function eventKey(payload: WebhookPayload) {
  const id = typeof payload.record?.id === "string" ? payload.record.id : typeof payload.old_record?.id === "string" ? payload.old_record.id : "no-record-id";
  const state = typeof payload.record?.status === "string" ? payload.record.status : String(payload.record?.is_graded ?? "");
  const ts = payload.timestamp || "";
  return `${payload.table}:${id}:${state}:${ts}`;
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const expected = process.env.SUPABASE_WEBHOOK_SECRET?.trim();
  if (!expected) {
    logger.error("Webhook secret is not configured", undefined, { requestId });
    return NextResponse.json({ error: "Server configuration error", requestId }, { status: 500 });
  }
  if (!validSecret(request.headers.get("x-webhook-secret")?.trim() ?? null, expected)) {
    logger.warn("Webhook authentication failed", { requestId });
    return NextResponse.json({ error: "Unauthorized", requestId }, { status: 401 });
  }

  const raw = await request.text();
  if (raw.length > 1_000_000) return NextResponse.json({ error: "Payload too large", requestId }, { status: 413 });
  let json: unknown;
  try { json = JSON.parse(raw); } catch { return NextResponse.json({ error: "Invalid JSON payload", requestId }, { status: 400 }); }
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    logger.warn("Webhook payload validation failed", { requestId, issues: parsed.error.issues.map((issue) => issue.path.join(".")) });
    return NextResponse.json({ error: "Invalid payload structure", requestId }, { status: 400 });
  }

  const payload = parsed.data;
  const key = eventKey(payload);
  const supabase = supabaseAdmin();

  // Atomic event claim to avoid race condition
  const { error: claimError } = await supabase
    .from("webhook_events")
    .insert({
      event_key: key,
      table_name: payload.table,
      event_type: payload.type,
      record_id: typeof payload.record?.id === "string" ? payload.record.id : null,
      status: "processing",
      payload
    });

  if (claimError) {
    // If conflict on event_key, check existing status
    if (claimError.code === '23505' || claimError.message?.includes('duplicate key') || claimError.message?.includes('unique constraint')) {
      const { data: existing } = await supabase
        .from("webhook_events")
        .select("status")
        .eq("event_key", key)
        .maybeSingle();

      if (existing?.status === "processed" || existing?.status === "processing") {
        return NextResponse.json({ success: true, duplicate: true, requestId });
      }
    } else {
      logger.error("Webhook idempotency claim failed", claimError, { requestId });
      return NextResponse.json({ error: "Temporary processing error", requestId }, { status: 500 });
    }
  }

  try {
    await processWebhook(payload, key);
    const now = new Date().toISOString();
    const { error: completionError } = await supabase.from("webhook_events").update({ status: "processed", error_message: null, processed_at: now, updated_at: now }).eq("event_key", key);
    if (completionError) throw completionError;
    logger.info("Webhook processed", { requestId, table: payload.table, type: payload.type });
    return NextResponse.json({ success: true, requestId, processed: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await supabase.from("webhook_events").update({ status: "failed", error_message: message, updated_at: new Date().toISOString() }).eq("event_key", key);
    logger.error("Webhook processing failed", error, { requestId, table: payload.table, type: payload.type });
    return NextResponse.json({ error: "Processing failed", requestId }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
