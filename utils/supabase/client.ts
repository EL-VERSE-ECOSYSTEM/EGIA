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
