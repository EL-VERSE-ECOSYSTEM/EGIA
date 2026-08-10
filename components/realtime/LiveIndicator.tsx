"use client";

import { Wifi, WifiOff, LoaderCircle } from "lucide-react";
import { useRealtime } from "./RealtimeProvider";

export function LiveIndicator() {
  const { status } = useRealtime();
  const connected = status === "SUBSCRIBED";
  const connecting = status === "CONNECTING" || status === "TIMED_OUT";
  return (
    <div
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-full border border-slate-100 bg-white/90 backdrop-blur-md px-4 py-2.5 text-xs font-black shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:scale-105 hover:bg-white transition-all duration-300 ease-out cursor-pointer select-none"
    >
      <div className="flex items-center justify-center">
        {connecting ? (
          <LoaderCircle className="h-4 w-4 animate-spin text-amber-500 transition-all duration-300" />
        ) : connected ? (
          <Wifi className="h-4 w-4 text-emerald-600 transition-all duration-300 animate-pulse" />
        ) : (
          <WifiOff className="h-4 w-4 text-rose-500 transition-all duration-300" />
        )}
      </div>
      <span
        className={`tracking-wide transition-colors duration-300 ${
          connected ? "text-emerald-800" : connecting ? "text-amber-700" : "text-rose-700"
        }`}
      >
        {connected ? "LIVE UPDATES ACTIVE" : connecting ? "CONNECTING..." : "OFFLINE"}
      </span>
      <div className="relative flex h-2 w-2">
        {connected && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
        )}
        {connecting && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
        )}
        <span
          className={`relative inline-flex rounded-full h-2 w-2 transition-all duration-300 ${
            connected ? "bg-emerald-500" : connecting ? "bg-amber-500" : "bg-rose-500"
          }`}
        />
      </div>
    </div>
  );
}
