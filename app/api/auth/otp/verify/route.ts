import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { verifyOtp } from "@/lib/otp";

const Schema = z.object({
  email: z.string().email().max(254),
  otp: z.string().regex(/^\d{6}$/, "6-digit code required"),
});

export async function POST(req: NextRequest) {
  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  // Per-IP attempt cap
  const ipLimit = rateLimit(`verify:ip:${ip}`, 20, 15 * 60);
  if (!ipLimit.allowed) {
    return NextResponse.json(
      { error: "Too many attempts." },
      { status: 429, headers: { "Retry-After": String(ipLimit.retryAfter) } }
    );
  }

  const result = await verifyOtp(parsed.data.email, parsed.data.otp);
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 400 });
  }

  // ✅ OTP verified — issue session / create user / mark verified
  return NextResponse.json({ success: true, verified: true });
}
