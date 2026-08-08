import { createBrowserClient } from "@supabase/ssr";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import type { Database, RealtimeTable } from "@/types/database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

let browserClient: ReturnType<typeof createBrowserClient<Database>> | undefined;

/** A browser client shared for the lifetime of the tab. */
export const createClient = () =>
  (browserClient ??= createBrowserClient<Database>(
    supabaseUrl!,
    supabaseKey!,
  ));

export type RealtimeEvent<T extends { [key: string]: unknown }> = RealtimePostgresChangesPayload<T>;

export interface TableSubscriptionOptions<T extends { [key: string]: unknown }> {
  event?: "INSERT" | "UPDATE" | "DELETE" | "*";
  filter?: string;
  callback: (payload: RealtimeEvent<T>) => void;
}

/** Subscribe to database changes and return the channel for later cleanup. */
export function subscribeToTable<T extends Record<string, unknown> = Record<string, unknown>>(
  table: RealtimeTable | string,
  { event = "*", filter, callback }: TableSubscriptionOptions<T>,
): RealtimeChannel {
  const channel = createClient().channel(`table:${table}:${crypto.randomUUID()}`);
  channel
    .on("postgres_changes", { event, schema: "public", table, ...(filter ? { filter } : {}) }, callback)
    .subscribe();
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
