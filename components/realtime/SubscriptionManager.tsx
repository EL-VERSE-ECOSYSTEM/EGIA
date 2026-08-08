"use client";

import { useEffect } from "react";
import { subscribeToTable, unsubscribeFromTable } from "@/lib/supabase/client";
import type { RealtimeTable } from "@/types/database.types";

export function SubscriptionManager({ tables }: { tables: RealtimeTable[] }) {
  useEffect(() => {
    const channels = tables.map((table) => subscribeToTable(table, { callback: () => undefined }));
    return () => { channels.forEach((channel) => { void unsubscribeFromTable(channel); }); };
  }, [tables]);
  return null;
}
