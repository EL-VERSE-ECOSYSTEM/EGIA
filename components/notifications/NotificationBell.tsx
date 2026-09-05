"use client";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
type Item = { id: string; title: string; body: string; link: string | null; readAt: string | null };
export function NotificationBell() {
  const [items, setItems] = useState<Item[]>([]); const [open, setOpen] = useState(false);
  const load = async () => { const response = await fetch("/api/fcm/notifications"); if (response.ok) setItems(await response.json()); };
  useEffect(() => { void load(); }, []); useRealtimeSubscription("notification", () => { void load(); });
  const unread = items.filter((item) => !item.readAt).length;
  const markRead = async (ids: string[]) => { if (!ids.length) return; await fetch("/api/fcm/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids }) }); setItems((current) => current.map((item) => ids.includes(item.id) ? { ...item, readAt: new Date().toISOString() } : item)); };
  return <div className="relative"><button aria-label="Notifications" onClick={() => setOpen(!open)} className="relative p-2.5 rounded-xl bg-white border border-slate-100 text-slate-500 hover:bg-slate-50 transition-colors shadow-sm"><Bell className="w-5 h-5" />{unread > 0 && <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-rose-600 px-1 text-[10px] font-black text-white">{unread}</span>}</button>{open && <div className="absolute right-0 top-12 z-50 max-h-96 w-80 overflow-y-auto rounded-xl border bg-white shadow-2xl"><div className="flex items-center justify-between p-3 text-sm font-bold">Notifications {unread > 0 && <button className="text-xs text-blue-600" onClick={() => void markRead(items.filter((item) => !item.readAt).map((item) => item.id))}>Mark all read</button>}</div>{items.length ? items.map((item) => <button key={item.id} className={`block w-full border-t p-3 text-left ${!item.readAt ? "bg-blue-50" : ""}`} onClick={() => { if (!item.readAt) void markRead([item.id]); if (item.link) window.location.assign(item.link); }}><p className="text-sm font-semibold">{item.title}</p><p className="mt-1 text-xs text-slate-500">{item.body}</p></button>) : <p className="p-4 text-center text-sm text-slate-500">No notifications</p>}</div>}</div>;
}
