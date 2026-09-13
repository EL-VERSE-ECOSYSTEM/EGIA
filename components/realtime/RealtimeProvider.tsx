"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { REALTIME_SUBSCRIBE_STATES } from "@supabase/supabase-js";
import { Toaster, toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { createMessageQueue } from "@/lib/resilience";
import { LiveIndicator } from "./LiveIndicator";

type ConnectionStatus = REALTIME_SUBSCRIBE_STATES | "CONNECTING" | "ONLINE";
const RealtimeContext = createContext<{ status: ConnectionStatus; isOnline: boolean }>({
  status: "CONNECTING",
  isOnline: true,
});

export const useRealtime = () => useContext(RealtimeContext);
const realtimeUiQueue = createMessageQueue("realtime-ui", { concurrency: 1, maxSize: 250 });

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 15_000,
            retry: 2,
            refetchOnWindowFocus: true,
            refetchInterval: 30_000,
          },
        },
      })
  );

  const [isOnline, setIsOnline] = useState(true);
  const [status, setStatus] = useState<ConnectionStatus>("CONNECTING");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
    }

    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Back online", { description: "Reconnected to EL LEARN App services." });
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("Network connection lost", { description: "App is running in offline mode." });
    };

    if (typeof window !== "undefined") {
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
    }

    const supabase = createClient();

    // Notification real-time stream subscription with automatic background polling fallback
    const notifications = supabase
      .channel("notification-alerts")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notification" }, (event) => {
        void realtimeUiQueue
          .enqueue(async () => {
            const record = event.new as { title?: string; message?: string };
            toast(record.title ?? "New notification", { description: record.message });
            await queryClient.invalidateQueries({ queryKey: ["notifications"] });
          })
          .catch((error) => {
            console.warn("Realtime notification queue failed.", error);
          });
      })
      .subscribe((nextStatus) => {
        if (nextStatus === "SUBSCRIBED") {
          setStatus("SUBSCRIBED" as ConnectionStatus);
        } else if (nextStatus === "CLOSED" || nextStatus === "CHANNEL_ERROR" || nextStatus === "TIMED_OUT") {
          setStatus("CONNECTING");
          queryClient.invalidateQueries({ queryKey: ["notifications"] }).catch(() => {});
        }
      });

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      void supabase.removeChannel(notifications);
    };
  }, [queryClient]);

  const value = useMemo(() => ({ status, isOnline }), [status, isOnline]);

  return (
    <QueryClientProvider client={queryClient}>
      <RealtimeContext.Provider value={value}>
        {children}
        <Toaster richColors position="top-right" />
        <LiveIndicator />
      </RealtimeContext.Provider>
    </QueryClientProvider>
  );
}
