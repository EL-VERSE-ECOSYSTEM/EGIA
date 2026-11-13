"use client";

import { Wifi, WifiOff } from "lucide-react";
import { useRealtime } from "./RealtimeProvider";

export function LiveIndicator() {
  const { isOnline, status } = useRealtime();
  const connected = isOnline && status === "SUBSCRIBED";
  const offline = !isOnline;
  const label = offline ? "Offline" : connected ? "Live data connected" : "Reconnecting";

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border border-slate-200 bg-white/95 px-3 py-2 text-[11px] font-semibold shadow-lg shadow-slate-900/10 backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/95 sm:bottom-6 sm:right-6 sm:px-4 sm:py-2.5 sm:text-xs"
    >
      <div className="flex items-center justify-center">
        {offline ? (
          <WifiOff className="h-4 w-4 text-rose-500 transition-all duration-300" />
        ) : (
          <Wifi className={`h-4 w-4 transition-all duration-300 ${connected ? 'text-emerald-600' : 'text-amber-500'}`} />
        )}
      </div>
      <span
        className={`tracking-wide transition-colors duration-300 ${
          offline ? "text-rose-700 dark:text-rose-300" : connected ? "text-emerald-800 dark:text-emerald-300" : "text-amber-800 dark:text-amber-300"
        }`}
      >
        {label}
      </span>
      <div className="relative flex h-2 w-2">
        {connected && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
        )}
        <span
          className={`relative inline-flex rounded-full h-2 w-2 transition-all duration-300 ${
          offline ? "bg-rose-500" : connected ? "bg-emerald-500" : "bg-amber-500"
          }`}
        />
      </div>
    </div>
  );
}
