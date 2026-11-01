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
    await storeOtp(email, otp);
    let sentSuccess = false;
    let deliveryChannel = "email";

    // 1. Primary Delivery Channel: Nodemailer SMTP Email
    try {
      await sendOtpEmail(email, otp);
      sentSuccess = true;
    } catch (emailErr: any) {
      console.warn("[otp/send] Primary SMTP email delivery failed:", emailErr?.message || emailErr);

      // 2. Secondary Fallback Delivery Channel: FCM Push Notification
      try {
        const { sendFCMOtp } = await import("@/lib/services/notifications");
        const { db } = await import("@/lib/db");
        const { user } = await import("@/lib/db/schema");
        const { eq } = await import("drizzle-orm");

        const userRows = await db
          .select({ id: user.id })
          .from(user)
          .where(eq(user.email, email))
          .limit(1);

        if (userRows.length > 0 && userRows[0].id) {
          const fcmOutcome = await sendFCMOtp({
            userId: userRows[0].id,
            otpCode: otp,
            type: "CHANGE_PASSWORD",
            title: "Your EL Learners Verification Code",
          });
          if (fcmOutcome.sent) {
            sentSuccess = true;
            deliveryChannel = "push";
          }
        }
      } catch (fcmErr: any) {
        console.warn("[otp/send] Fallback FCM push delivery failed:", fcmErr?.message || fcmErr);
      }
    }

    if (!sentSuccess) {
      return NextResponse.json(
        { error: "Unable to deliver verification code. Delivery services are temporarily unavailable." },
        { status: 502 }
      );
    }

    cache.set(`otp:cooldown:${email}`, true, 60);
    return NextResponse.json({
      success: true,
      message: deliveryChannel === "email" ? "Verification code sent to your email" : "Verification code sent to your active device",
      channel: deliveryChannel
    });
  } catch (err: any) {
    console.error("[otp/send]", err);
    return NextResponse.json(
      { error: err?.message || "Could not send verification code. Please try again." },
      { status: 500 }
    );
  }
}
