import crypto from "crypto";
import { cache } from "./cache";
import { db } from "./db";
import { otpRecords } from "./db/schema";
import { eq } from "drizzle-orm";

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

export async function storeOtp(email: string, otp: string) {
  const normalizedEmail = email.toLowerCase();
  const hash = hashOtp(normalizedEmail, otp);
  const expiresAt = Date.now() + OTP_TTL * 1000;

  // 1. In-memory fast layer
  cache.set<OtpRecord>(
    `otp:${normalizedEmail}`,
    {
      hash,
      attempts: 0,
      expiresAt,
    },
    OTP_TTL
  );

  // 2. Persistent PostgreSQL layer for multi-replica/serverless resilience
  try {
    await db
      .insert(otpRecords)
      .values({
        id: crypto.randomUUID(),
        email: normalizedEmail,
        hash,
        attempts: 0,
        expiresAt: new Date(expiresAt),
        createdAt: new Date(),
      })
      .onConflictDoUpdate({
        target: otpRecords.email,
        set: {
          hash,
          attempts: 0,
          expiresAt: new Date(expiresAt),
        },
      });
  } catch (err) {
    console.warn("[OTP] Database persistent write fallback to cache:", err);
  }
}

export async function verifyOtp(
  email: string,
  otp: string
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const normalizedEmail = email.toLowerCase();
  const key = `otp:${normalizedEmail}`;
  let rec = cache.get<OtpRecord>(key);

  // If not found in cache (e.g. cross-instance), load from PostgreSQL
  if (!rec) {
    try {
      const rows = await db
        .select()
        .from(otpRecords)
        .where(eq(otpRecords.email, normalizedEmail))
        .limit(1);

      if (rows.length > 0) {
        rec = {
          hash: rows[0].hash,
          attempts: rows[0].attempts,
          expiresAt: new Date(rows[0].expiresAt).getTime(),
        };
      }
    } catch (err) {
      console.warn("[OTP] Database read fallback:", err);
    }
  }

  if (!rec || Date.now() > rec.expiresAt) {
    cache.delete(key);
    try {
      await db.delete(otpRecords).where(eq(otpRecords.email, normalizedEmail));
    } catch {}
    return { ok: false, reason: "Code expired or not found" };
  }

  if (rec.attempts >= MAX_ATTEMPTS) {
    cache.delete(key);
    try {
      await db.delete(otpRecords).where(eq(otpRecords.email, normalizedEmail));
    } catch {}
    return { ok: false, reason: "Too many attempts — request a new code" };
  }

  const expected = hashOtp(normalizedEmail, otp);
  const valid =
    rec.hash.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(rec.hash), Buffer.from(expected));

  if (!valid) {
    rec.attempts++;
    cache.set(key, rec, Math.ceil((rec.expiresAt - Date.now()) / 1000));
    try {
      await db
        .update(otpRecords)
        .set({ attempts: rec.attempts })
        .where(eq(otpRecords.email, normalizedEmail));
    } catch {}
    return { ok: false, reason: "Invalid code" };
  }

  // One-time use: clean up from both cache and DB
  cache.delete(key);
  try {
    await db.delete(otpRecords).where(eq(otpRecords.email, normalizedEmail));
  } catch {}

  return { ok: true };
}
