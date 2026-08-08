"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { REALTIME_SUBSCRIBE_STATES, RealtimeChannel } from "@supabase/supabase-js";
import { Toaster, toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { LiveIndicator } from "./LiveIndicator";

type ConnectionStatus = REALTIME_SUBSCRIBE_STATES | "CONNECTING";
const RealtimeContext = createContext<{ status: ConnectionStatus }>({ status: "CONNECTING" });
export const useRealtime = () => useContext(RealtimeContext);

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: true } } }));
  const [status, setStatus] = useState<ConnectionStatus>("CONNECTING");

  useEffect(() => {
    const supabase = createClient();
    const channel: RealtimeChannel = supabase.channel("connection-health").subscribe((nextStatus) => setStatus(nextStatus));
    const notifications = supabase.channel("notification-alerts")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notification" }, (event) => {
        const record = event.new as { title?: string; message?: string };
        toast(record.title ?? "New notification", { description: record.message });
        void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      }).subscribe();
    return () => { void supabase.removeChannel(channel); void supabase.removeChannel(notifications); };
  }, [queryClient]);

  const value = useMemo(() => ({ status }), [status]);
  return <QueryClientProvider client={queryClient}><RealtimeContext.Provider value={value}>{children}<Toaster richColors position="top-right" /><LiveIndicator /></RealtimeContext.Provider></QueryClientProvider>;
}
