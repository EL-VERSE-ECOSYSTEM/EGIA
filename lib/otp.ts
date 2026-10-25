import crypto from "crypto";
import { cache } from "./cache";

const OTP_TTL = 10 * 60;      // 10 min
const MAX_ATTEMPTS = 5;

export function generateOtp(): string {
  return crypto.randomInt(100_000, 1_000_000).toString();
}

export function hashOtp(email: string, otp: string): string {
  const secret = process.env.OTP_SECRET;
  if (!secret) {
    throw new Error("Missing required OTP secret environment variable: OTP_SECRET must be set.");
  }
  return crypto
    .createHmac("sha256", secret)
    .update(`${email.toLowerCase()}:${otp}`)
    .digest("hex");
}

type OtpRecord = { hash: string; attempts: number; expiresAt: number };

export function storeOtp(email: string, otp: string) {
  cache.set<OtpRecord>(
    `otp:${email.toLowerCase()}`,
    {
      hash: hashOtp(email, otp),
      attempts: 0,
      expiresAt: Date.now() + OTP_TTL * 1000,
    },
    OTP_TTL
  );
}

export function verifyOtp(
  email: string,
  otp: string
): { ok: true } | { ok: false; reason: string } {
  const key = `otp:${email.toLowerCase()}`;
  const rec = cache.get<OtpRecord>(key);

  if (!rec || Date.now() > rec.expiresAt) {
    cache.delete(key);
    return { ok: false, reason: "Code expired or not found" };
  }

  if (rec.attempts >= MAX_ATTEMPTS) {
    cache.delete(key);
    return { ok: false, reason: "Too many attempts — request a new code" };
  }

  const expected = hashOtp(email, otp);
  const valid =
    rec.hash.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(rec.hash), Buffer.from(expected));

  if (!valid) {
    rec.attempts++;
    cache.set(key, rec, Math.ceil((rec.expiresAt - Date.now()) / 1000));
    return { ok: false, reason: "Invalid code" };
  }

  cache.delete(key); // one-time use
  return { ok: true };
}
