import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublishableKey, getSupabaseUrl, normalizeSupabaseCookieOptions } from "./config";

const supabaseUrl = getSupabaseUrl();
const supabaseKey = getSupabasePublishableKey();

export const createClient = (cookieStore: Awaited<ReturnType<typeof cookies>>) => {
  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, normalizeSupabaseCookieOptions(options))
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  );
};

/** Utility helper for resilient query execution with automatic exponential backoff retries */
export async function executeWithRetry<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  maxRetries = 3,
  delayMs = 300
): Promise<{ data: T | null; error: any }> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      const result = await queryFn();
      if (!result.error) return result;
      const isTransient =
        result.error.message?.includes('fetch failed') ||
        result.error.message?.includes('connection') ||
        result.error.code === 'PGAREST102' ||
        result.error.status === 503 ||
        result.error.status === 504;
      if (!isTransient || attempt === maxRetries - 1) return result;
    } catch (err: any) {
      if (attempt === maxRetries - 1) return { data: null, error: err };
    }
    attempt++;
    await new Promise((resolve) => setTimeout(resolve, delayMs * Math.pow(2, attempt)));
  }
  return { data: null, error: new Error('Max query retries exceeded') };
}
