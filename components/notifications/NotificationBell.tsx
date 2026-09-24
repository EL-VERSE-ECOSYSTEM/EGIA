"use client";

import { useEffect, useState, useRef } from "react";
import { Bell, Sparkles, Inbox } from "lucide-react";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import {
  formatUnreadAriaLabel,
  getUnreadCount,
  filterNotifications,
  NotificationItem,
} from "@/lib/notifications/bell-utils";

export function NotificationBell() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const popoverRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    try {
      const response = await fetch("/api/fcm/notifications");
      if (response.ok) {
        const data = await response.json();
        setItems(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.warn("Could not fetch notifications:", err);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      window.addEventListener("keydown", handleKeyDown);
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  useRealtimeSubscription("notification", () => {
    void load();
  });

  const unread = getUnreadCount(items);

  const markRead = async (ids: string[]) => {
    if (!ids.length) return;
    try {
      await fetch("/api/fcm/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      setItems((current) =>
        current.map((item) =>
          ids.includes(item.id) ? { ...item, readAt: new Date().toISOString() } : item
        )
      );
    } catch (err) {
      console.error("Failed to mark notifications as read:", err);
    }
  };

  const filteredItems = filterNotifications(items, filter);

  return (
    <div className="relative" ref={popoverRef}>
      <button
        aria-label={formatUnreadAriaLabel(unread)}
        aria-expanded={open}
        aria-controls="notification-popover"
        onClick={() => setOpen(!open)}
        className="relative p-2.5 rounded-2xl bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 active:translate-y-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
      >
        <Bell
          aria-hidden="true"
          className={`w-5 h-5 transition-transform motion-reduce:animate-none motion-reduce:transition-none ${
            unread > 0 ? "animate-bounce text-orange-600" : "group-hover:rotate-12 text-slate-600"
          }`}
        />
        {unread > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-orange-600 px-1 text-[10px] font-black text-white shadow-lg shadow-rose-500/30 border-2 border-white animate-pulse motion-reduce:animate-none">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          id="notification-popover"
          role="region"
          aria-label="Notifications inbox"
          className="absolute right-0 top-14 z-50 w-80 sm:w-96 overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/95 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] animate-in fade-in slide-in-from-top-3 duration-300 motion-reduce:animate-none"
        >
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-orange-950 p-5 text-white flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-orange-500/20 border border-orange-500/30 text-orange-400">
                <Sparkles aria-hidden="true" className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-black text-sm tracking-tight text-white flex items-center gap-2">
                  Notifications
                  {unread > 0 && (
                    <span className="bg-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                      {unread} New
                    </span>
                  )}
                </h3>
                <p className="text-[10px] font-bold text-slate-400">Real-time alerts inbox</p>
              </div>
            </div>

            {unread > 0 && (
              <button
                className="text-[10px] font-black text-orange-400 hover:text-orange-300 uppercase tracking-wider bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                onClick={() =>
                  void markRead(items.filter((item) => !item.readAt).map((item) => item.id))
                }
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Filter Bar */}
          <div className="flex border-b border-slate-100 bg-slate-50/50 p-2 gap-1">
            <button
              aria-pressed={filter === "all"}
              onClick={() => setFilter("all")}
              className={`flex-1 py-1.5 rounded-xl text-[11px] font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${
                filter === "all"
                  ? "bg-white shadow-sm text-slate-900"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              All ({items.length})
            </button>
            <button
              aria-pressed={filter === "unread"}
              onClick={() => setFilter("unread")}
              className={`flex-1 py-1.5 rounded-xl text-[11px] font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${
                filter === "unread"
                  ? "bg-white shadow-sm text-orange-600"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Unread ({unread})
            </button>
          </div>

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100/80">
            {filteredItems.length ? (
              filteredItems.map((item) => (
                <button
                  key={item.id}
                  className={`block w-full p-4 text-left transition-all hover:bg-slate-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${
                    !item.readAt ? "bg-orange-500/5 font-semibold" : "opacity-80"
                  }`}
                  onClick={() => {
                    if (!item.readAt) void markRead([item.id]);
                    if (item.link) window.location.assign(item.link);
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          !item.readAt
                            ? "bg-orange-100 text-orange-600"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        <Bell aria-hidden="true" className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <p
                          className={`text-xs ${
                            !item.readAt ? "font-black text-slate-900" : "font-bold text-slate-700"
                          }`}
                        >
                          {item.title}
                        </p>
                        <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">
                          {item.body}
                        </p>
                      </div>
                    </div>
                    {!item.readAt && (
                      <span
                        aria-hidden="true"
                        className="w-2 h-2 rounded-full bg-orange-600 shrink-0 mt-1.5 animate-ping motion-reduce:animate-none"
                      />
                    )}
                  </div>
                </button>
              ))
            ) : (
              <div className="p-8 text-center space-y-2">
                <Inbox aria-hidden="true" className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs font-black text-slate-500">No notifications found</p>
                <p className="text-[10px] text-slate-400 font-bold">You are completely up to date.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
