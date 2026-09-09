"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { REALTIME_SUBSCRIBE_STATES, RealtimeChannel } from "@supabase/supabase-js";
import { Toaster, toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { createMessageQueue } from "@/lib/resilience";
import { LiveIndicator } from "./LiveIndicator";

type ConnectionStatus = REALTIME_SUBSCRIBE_STATES | "CONNECTING";
const RealtimeContext = createContext<{ status: ConnectionStatus }>({ status: "CONNECTING" });
export const useRealtime = () => useContext(RealtimeContext);
const realtimeUiQueue = createMessageQueue("realtime-ui", { concurrency: 1, maxSize: 250 });

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: true } } }));
  const [status, setStatus] = useState<ConnectionStatus>("CONNECTING");

  useEffect(() => {
    const handleOnline = () => {
      toast.success("Back online", { description: "Reconnected to EL LEARN App services." });
    };
    const handleOffline = () => {
      toast.warning("Network connection lost", { description: "App is running in offline mode." });
    };

    if (typeof window !== "undefined") {
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
    }

    const supabase = createClient();
    const channel: RealtimeChannel = supabase.channel("connection-health").subscribe((nextStatus) => {
      setStatus(nextStatus);
      if ((nextStatus === "CHANNEL_ERROR" || nextStatus === "TIMED_OUT") && navigator.onLine) {
        toast.error("Realtime connection interrupted", { description: "Live updates will retry automatically." });
      }
    });
    const notifications = supabase.channel("notification-alerts")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notification" }, (event) => {
        void realtimeUiQueue.enqueue(async () => {
          const record = event.new as { title?: string; message?: string };
          toast(record.title ?? "New notification", { description: record.message });
          await queryClient.invalidateQueries({ queryKey: ["notifications"] });
        }).catch((error) => {
          console.warn("Realtime notification queue failed.", error);
        });
      }).subscribe((nextStatus) => {
        if (nextStatus === "CHANNEL_ERROR" || nextStatus === "TIMED_OUT") {
          if (navigator.onLine) {
            toast.error("Notification stream interrupted", { description: "New notification alerts will retry automatically." });
          }
        }
      });
    return () => { void supabase.removeChannel(channel); void supabase.removeChannel(notifications); };
  }, [queryClient]);

  const value = useMemo(() => ({ status }), [status]);
  return <QueryClientProvider client={queryClient}><RealtimeContext.Provider value={value}>{children}<Toaster richColors position="top-right" /><LiveIndicator /></RealtimeContext.Provider></QueryClientProvider>;
}
