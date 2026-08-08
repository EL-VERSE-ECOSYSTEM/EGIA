import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

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

  // Realtime clients receive Postgres events directly. This endpoint is the
  // server-side extension point for payment receipts, email/push delivery and
  // durable audit logging without trusting the browser.
  console.info("Supabase webhook received", { type: parsed.data.type, table: parsed.data.table });
  return NextResponse.json({ received: true });
}
