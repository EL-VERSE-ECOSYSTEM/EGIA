"use client";

import { Wifi, WifiOff, LoaderCircle } from "lucide-react";
import { useRealtime } from "./RealtimeProvider";

export function LiveIndicator() {
  const { status } = useRealtime();
  const connected = status === "SUBSCRIBED";
  const connecting = status === "CONNECTING" || status === "TIMED_OUT";
  return (
    <div aria-live="polite" className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full border border-slate-200 bg-white/95 px-3 py-2 text-xs font-bold shadow-lg backdrop-blur">
      {connecting ? <LoaderCircle className="h-3.5 w-3.5 animate-spin text-amber-500" /> : connected ? <Wifi className="h-3.5 w-3.5 text-emerald-600" /> : <WifiOff className="h-3.5 w-3.5 text-rose-600" />}
      <span className={connected ? "text-emerald-700" : "text-slate-600"}>{connected ? "Live updates" : connecting ? "Connecting…" : "Updates offline"}</span>
      <span className={`h-2 w-2 rounded-full ${connected ? "animate-pulse bg-emerald-500" : connecting ? "bg-amber-400" : "bg-rose-500"}`} />
    </div>
  );
}
