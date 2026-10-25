import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

export interface SafeActionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  requestId?: string;
}

export function sanitizeServerError(
  operation: string,
  error: unknown,
  fallbackMessage = "We could not complete that request. Please try again."
): { success: false; error: string; requestId: string } {
  const requestId = randomUUID();
  const detailedError = error instanceof Error ? error.message : String(error);

  console.error(`[SERVER ERROR] ${operation}`, {
    requestId,
    error: detailedError,
    stack: error instanceof Error ? error.stack : undefined,
  });

  return {
    success: false,
    error: fallbackMessage,
    requestId,
  };
}

// ===== CANONICAL ERROR MESSAGE CATALOG =====
export const AppError = {
  // Auth & OTP
  AUTH_001: { status: 400, msg: "Please enter a valid email address." },
  AUTH_002: { status: 429, msg: "Please wait {n} seconds before requesting another code.", retryable: true },
  AUTH_003: { status: 429, msg: "Too many codes requested. Please try again in 15 minutes.", retryable: true },
  AUTH_004: { status: 429, msg: "Too many requests from this network. Try again later.", retryable: true },
  AUTH_005: { status: 500, msg: "We couldn't send your code right now. Please try again." },
  AUTH_006: { status: 400, msg: "That code has expired. Request a new one." },
  AUTH_007: { status: 400, msg: "Invalid code. Please check and try again." },
  AUTH_008: { status: 400, msg: "Too many incorrect attempts. Request a new code." },
  AUTH_009: { status: 400, msg: "Please enter the 6-digit code." },
  AUTH_010: { status: 429, msg: "Too many verification attempts. Please wait 15 minutes.", retryable: true },
  AUTH_011: { status: 401, msg: "Your session has expired. Please sign in again." },
  AUTH_012: { status: 403, msg: "You don't have permission to access this." },
  AUTH_013: { status: 401, msg: "Incorrect email or password." },
  AUTH_014: { status: 429, msg: "Too many login attempts. Try again in 15 minutes.", retryable: true },

  // Registration
  REG_001: { status: 409, msg: "An account with this email already exists. Try signing in." },
  REG_002: { status: 400, msg: "Please select your school to continue." },
  REG_003: { status: 404, msg: "We couldn't find that school. Contact your admin." },
  REG_004: { status: 400, msg: "Please enter your full name." },
  REG_005: { status: 400, msg: "Please provide a valid phone number." },
  REG_006: { status: 400, msg: "Please select your employment type." },
  REG_007: { status: 400, msg: "Please provide your qualification." },
  REG_008: { status: 400, msg: "Please provide your specialization." },
  REG_009: { status: 404, msg: "We couldn't find that ward. Check the ward ID and try again." },
  REG_010: { status: 409, msg: "This ward is already linked to another parent." },
  REG_011: { status: 403, msg: "This ward belongs to a different school. Contact your school admin." },
  REG_012: { status: 400, msg: "Please verify your email before continuing." },
  REG_013: { status: 500, msg: "We couldn't complete your registration. Please try again." },
  REG_014: { status: 400, msg: "Password must be at least 12 characters." },

  // Payments / Korapay
  PAY_001: { status: 400, msg: "We couldn't verify this payment reference. Please contact support." },
  PAY_002: { status: 502, msg: "Payment verification is temporarily unavailable. Your payment is safe — we'll confirm it shortly.", retryable: true },
  PAY_003: { status: 409, msg: "This payment has already been confirmed." },
  PAY_004: { status: 400, msg: "Payment amount does not match. Please contact support." },
  PAY_005: { status: 404, msg: "We couldn't find a payment with that reference." },
  PAY_006: { status: 402, msg: "Your payment was declined. Please try a different method." },
  PAY_007: { status: 500, msg: "Something went wrong on our end. Your payment was NOT charged." },
  PAY_008: { status: 429, msg: "Too many payment attempts. Please wait 5 minutes.", retryable: true },

  // Job Queue
  JOB_001: { status: 500, msg: "Job stuck: lease expired before completion." },
  JOB_002: { status: 500, msg: "Job dead-lettered after max attempts." },
  JOB_003: { status: 500, msg: "No handler registered for job type '{type}'." },
  JOB_004: { status: 429, msg: "Queue depth exceeds threshold ({n}).", retryable: true },
  JOB_005: { status: 200, msg: "Worker at capacity — invocation skipped." },
  JOB_006: { status: 400, msg: "Job payload failed schema validation." },
  JOB_007: { status: 200, msg: "Idempotency key collision — job deduplicated." },

  // Rate Limiting
  RATE_001: { status: 429, msg: "Please slow down. Try again in {n} seconds.", retryable: true },
  RATE_002: { status: 429, msg: "Too many requests. Please try again later.", retryable: true },
  RATE_003: { status: 429, msg: "You've reached your daily limit for this action.", retryable: true },

  // API & General
  API_001: { status: 400, msg: "Something was missing from your request. Please try again." },
  API_002: { status: 401, msg: "Please sign in to continue." },
  API_003: { status: 403, msg: "You don't have access to this resource." },
  API_004: { status: 404, msg: "We couldn't find what you're looking for." },
  API_005: { status: 409, msg: "This action was already performed." },
  API_006: { status: 413, msg: "The file you're trying to upload is too large." },
  API_007: { status: 415, msg: "That file type isn't supported." },
  API_008: { status: 429, msg: "Too many requests. Please slow down.", retryable: true },
  API_009: { status: 500, msg: "Something went wrong. We've been notified." },
  API_010: { status: 503, msg: "The service is temporarily unavailable. Please try again shortly.", retryable: true },
  API_011: { status: 504, msg: "This is taking too long. Please refresh and try again.", retryable: true },
  API_012: { status: 400, msg: "This API version is deprecated. Please update your app." },
  API_013: { status: 400, msg: "The data you sent doesn't match our expected format." },

  // Database
  DB_001: { status: 500, msg: "We couldn't save your changes. Please try again." },
  DB_002: { status: 500, msg: "We couldn't retrieve that information right now.", retryable: true },
  DB_003: { status: 500, msg: "We're experiencing high load. Please try again in a moment.", retryable: true },
  DB_004: { status: 500, msg: "Your changes couldn't be saved because another process modified the data.", retryable: true },
  DB_005: { status: 500, msg: "Something went wrong. Please try again." },

  // Storage & Media
  STO_001: { status: 400, msg: "Please select a file to upload." },
  STO_002: { status: 413, msg: "File exceeds the 10 MB limit." },
  STO_003: { status: 413, msg: "Your school has reached its storage quota. Contact your admin." },
  STO_004: { status: 415, msg: "Only JPG, PNG, PDF, and DOCX files are accepted." },
  STO_005: { status: 422, msg: "We couldn't process this image. Please try a different one." },
  STO_006: { status: 500, msg: "Upload failed. Please try again." },
  STO_007: { status: 400, msg: "File appears to be corrupt." },

  // Realtime & Sync
  SYNC_001: { status: 400, msg: "Sync cursor is invalid. Refreshing your data…" },
  SYNC_002: { status: 410, msg: "Your local data is too old to sync. Please refresh." },
  SYNC_003: { status: 409, msg: "Some changes couldn't sync because they conflict." },
  SYNC_004: { status: 503, msg: "Live updates are temporarily unavailable. Retrying…", retryable: true },
  SYNC_005: { status: 500, msg: "We couldn't save your offline changes." },

  // CBT / Assessments
  CBT_001: { status: 409, msg: "You have already submitted this assessment." },
  CBT_002: { status: 403, msg: "This assessment has closed." },
  CBT_003: { status: 403, msg: "You're not enrolled in this assessment." },
  CBT_004: { status: 400, msg: "Your submission was incomplete. Please try again." },
  CBT_005: { status: 500, msg: "Grading is taking longer than usual. Your result will appear shortly.", retryable: true },

  // Super Admin
  ADM_001: { status: 403, msg: "Super Admin access required." },
  ADM_002: { status: 401, msg: "Please re-authenticate to perform this action." },
  ADM_003: { status: 200, msg: "Health check degraded: {component}" },
  ADM_004: { status: 200, msg: "Error rate above threshold ({x}%)." },
  ADM_005: { status: 200, msg: "Dead-letter queue growing ({n} jobs)." },
} as const;

export type ErrorCode = keyof typeof AppError;

export function sendError(code: ErrorCode, vars?: Record<string, string | number>) {
  const e = AppError[code];
  let msg: string = e.msg;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      msg = msg.replace(`{${k}}`, String(v));
    }
  }

  const responseHeaders: Record<string, string> = {};
  if (e.status === 429 && vars?.n) {
    responseHeaders["Retry-After"] = String(vars.n);
  }

  return NextResponse.json(
    {
      error: {
        code,
        message: msg,
        retryable: (e as any).retryable ?? false,
      },
    },
    {
      status: e.status,
      headers: Object.keys(responseHeaders).length > 0 ? responseHeaders : undefined,
    }
  );
}
