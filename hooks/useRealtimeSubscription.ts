"use client";

import { useEffect, useRef } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { subscribeToTable, unsubscribeFromTable, type RealtimeEvent } from "@/lib/supabase/client";
import type { RealtimeTable } from "@/types/database.types";

export function useRealtimeSubscription<T extends Record<string, unknown> = Record<string, unknown>>(
  table: RealtimeTable | string | undefined,
  onChange: ((event: RealtimeEvent<T>) => void) | undefined,
  options: { event?: "INSERT" | "UPDATE" | "DELETE" | "*"; filter?: string; enabled?: boolean } = {},
) {
  const callbackRef = useRef(onChange);
  callbackRef.current = onChange;

  useEffect(() => {
    if (!table || !onChange || options.enabled === false) return;
    const channel: RealtimeChannel = subscribeToTable<T>(table, {
      event: options.event ?? "*",
      filter: options.filter,
      callback: (event) => callbackRef.current?.(event),
      statusCallback: (status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.warn(`Realtime channel status for table ${table}: ${status}. Retrying in background.`);
        }
      },
    });
    return () => { void unsubscribeFromTable(channel); };
  }, [table, options.event, options.filter, options.enabled]);
}
