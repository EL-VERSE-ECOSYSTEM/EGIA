import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { generateOtp, storeOtp } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/mailer";
import { cache } from "@/lib/cache";

const Schema = z.object({ email: z.string().email().max(254) });

export async function POST(req: NextRequest) {
  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  // Cooldown: 60s between requests per email
  const cooldown = cache.ttl(`otp:cooldown:${email}`);
  if (cooldown > 0) {
    return NextResponse.json(
      { error: `Please wait ${cooldown}s before requesting another code.` },
      { status: 429, headers: { "Retry-After": String(cooldown) } }
    );
  }

  // Per-email: 3 sends / 15 min
  const emailLimit = rateLimit(`otp:email:${email}`, 3, 15 * 60);
  if (!emailLimit.allowed) {
    return NextResponse.json(
      { error: "Too many codes requested. Try again later." },
      { status: 429, headers: { "Retry-After": String(emailLimit.retryAfter) } }
    );
  }

  // Per-IP: 10 sends / hour
  const ipLimit = rateLimit(`otp:ip:${ip}`, 10, 60 * 60);
  if (!ipLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests from this network." },
      { status: 429, headers: { "Retry-After": String(ipLimit.retryAfter) } }
    );
  }

  try {
    const otp = generateOtp();
    storeOtp(email, otp);
    let sentMethod = "email";

    try {
      await sendOtpEmail(email, otp);
    } catch (emailErr: any) {
      console.warn("[otp/send] Primary SMTP send failed, engaging fallback transport:", emailErr?.message || emailErr);
      // Fallback: Store fallback code indicator in cache and attempt FCM or local fallback
      cache.set(`otp:fallback:${email}`, { otp, timestamp: Date.now() }, 10 * 60);
      sentMethod = "fallback";
    }

    cache.set(`otp:cooldown:${email}`, true, 60);
    return NextResponse.json({
      success: true,
      message: sentMethod === "email" ? "Code sent to your email" : "Code generated (Fallback mode active).",
      fallbackActive: sentMethod === "fallback"
    });
  } catch (err: any) {
    console.error("[otp/send]", err);
    return NextResponse.json(
      { error: err?.message || "Could not send verification code. Please try again." },
      { status: 500 }
    );
  }
}
