"use client";

import { useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import type { RealtimeEvent } from "@/lib/supabase/client";
import type { RealtimeTable } from "@/types/database.types";

type Options<T> = {
  queryKey: QueryKey;
  table: RealtimeTable | string;
  queryFn: () => Promise<T>;
  filter?: string;
  enabled?: boolean;
  onEvent?: (current: T | undefined, event: RealtimeEvent<Record<string, unknown>>) => T | undefined;
};

/** Fetch server data once, then keep React Query's cache synchronized with Postgres changes. */
export function useRealtimeQuery<T>({ queryKey, table, queryFn, filter, enabled = true, onEvent }: Options<T>) {
  const client = useQueryClient();
  const query = useQuery({ queryKey, queryFn, enabled });

  useRealtimeSubscription(table, (event) => {
    if (onEvent) client.setQueryData<T>(queryKey, (current) => onEvent(current, event));
    else void client.invalidateQueries({ queryKey });
  }, { filter, enabled });

  return query;
}
