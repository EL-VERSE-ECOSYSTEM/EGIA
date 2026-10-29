import { createBrowserClient } from "@supabase/ssr";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import type { Database, RealtimeTable } from "@/types/database.types";
import { getSupabasePublishableKey, getSupabaseUrl } from "./config";

const supabaseUrl = getSupabaseUrl();
const supabaseKey = getSupabasePublishableKey();

let browserClient: ReturnType<typeof createBrowserClient<Database>> | undefined;

/** A browser client shared for the lifetime of the tab. */
export const createClient = () =>
  (browserClient ??= createBrowserClient<Database>(
    supabaseUrl,
    supabaseKey,
    {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce",
        persistSession: true,
      },
      realtime: {
        params: { eventsPerSecond: 10 },
      },
    },
  ));

export type RealtimeEvent<T extends { [key: string]: unknown }> = RealtimePostgresChangesPayload<T>;

export interface TableSubscriptionOptions<T extends { [key: string]: unknown }> {
  event?: "INSERT" | "UPDATE" | "DELETE" | "*";
  filter?: string;
  callback: (payload: RealtimeEvent<T>) => void;
  statusCallback?: (status: string, error?: Error) => void;
}

/** Subscribe to database changes and return the channel for later cleanup. */
export function subscribeToTable<T extends Record<string, unknown> = Record<string, unknown>>(
  table: RealtimeTable | string,
  { event = "*", filter, callback, statusCallback }: TableSubscriptionOptions<T>,
): RealtimeChannel {
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
  const channel = createClient().channel(`table:${table}:${id}`);
  channel
    .on("postgres_changes", { event, schema: "public", table, ...(filter ? { filter } : {}) }, callback)
    .subscribe((status, error) => statusCallback?.(status, error));
  return channel;
}

export function subscribeToTableTyped<T extends Record<string, unknown>>(
  table: RealtimeTable,
  options: TableSubscriptionOptions<T>,
) {
  return subscribeToTable<T>(table, options);
}

export function unsubscribeFromTable(channel: RealtimeChannel) {
  return createClient().removeChannel(channel);
}

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
      // Retry on network/transient DB pool errors
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
