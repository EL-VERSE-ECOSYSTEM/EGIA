const isProduction = process.env.NODE_ENV === "production";

export function getSupabaseUrl() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  if (!value) {
    if (isProduction) {
      throw new Error("Missing required NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL environment variable in production.");
    }
    return "http://localhost:54321";
  }
  return value;
}

export function getSupabasePublishableKey() {
  const value =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_KEY;

  if (!value) {
    if (isProduction) {
      throw new Error("Missing required Supabase publishable key environment variable in production.");
    }
    return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.local";
  }

  return value;
}

export function getSupabaseSecretKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || null;
}

export function getSiteUrl() {
  return (process.env.NEXT_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_KEY;

  return Boolean(url?.trim() && publishableKey?.trim());
}

type SupabaseCookieOptions = {
  path?: string;
  sameSite?: "lax" | "strict" | "none" | boolean;
  secure?: boolean;
  [key: string]: unknown;
};

export function normalizeSupabaseCookieOptions(options: SupabaseCookieOptions = {}) {
  return {
    ...options,
    path: options.path ?? "/",
    sameSite: options.sameSite ?? "lax",
    secure: options.secure ?? isProduction,
  };
}
