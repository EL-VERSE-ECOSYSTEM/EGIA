"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { Bell, CheckCheck, Inbox } from "lucide-react";
import { toast } from "sonner";

type Item = { id: string; title: string; body: string; type: string; sentAt: string; delivered: boolean; readAt: string | null; link: string | null; data: unknown };

export default function NotificationCenter({ role }: { role: "parent" | "student" | "teacher" | "admin" | "super-admin" }) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/fcm/notifications?limit=200", { cache: "no-store" });
      if (!response.ok) throw new Error("Unable to load notifications");
      const next = await response.json();
      setItems(Array.isArray(next) ? next : []);
    } catch { toast.error("Could not load your notifications."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  useRealtimeSubscription("notification_history", () => { void load(); });
  const unread = useMemo(() => items.filter(item => !item.readAt), [items]);
  const markRead = async (ids: string[]) => {
    if (!ids.length) return;
    const response = await fetch("/api/fcm/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids }) });
    if (!response.ok) { toast.error("Could not mark notifications as read."); return; }
    const now = new Date().toISOString();
    setItems(current => current.map(item => ids.includes(item.id) ? { ...item, readAt: now } : item));
  };
  return <DashboardLayout role={role}>
    <main className="mx-auto max-w-5xl space-y-6 p-6 sm:p-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div><h1 className="text-3xl font-black text-slate-900">Notifications</h1><p className="mt-1 text-sm text-slate-500">Live updates for your account. Read notifications are kept for 72 hours.</p></div>
        {!!unread.length && <button onClick={() => void markRead(unread.map(item => item.id))} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-bold text-white"><CheckCheck className="h-4 w-4"/>Mark all read ({unread.length})</button>}
      </header>
      {loading ? <div className="rounded-2xl bg-white p-12 text-center text-slate-500">Loading notifications…</div> : !items.length ? <div className="rounded-2xl border border-dashed bg-white p-14 text-center"><Inbox className="mx-auto mb-3 h-9 w-9 text-slate-300"/><p className="font-bold text-slate-600">Your inbox is clear.</p></div> : <div className="space-y-3">{items.map(item => <article key={item.id} className={`rounded-2xl border p-5 ${item.readAt ? "bg-white" : "border-orange-200 bg-orange-50/50"}`}>
        <div className="flex items-start gap-4"><Bell className="mt-1 h-5 w-5 shrink-0 text-orange-600"/><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-bold text-slate-900">{item.title}</h2><time className="text-xs text-slate-400">{new Date(item.sentAt).toLocaleString()}</time></div><p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{item.body}</p><div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400"><span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold">{item.type}</span><span>{item.delivered ? "Push delivered" : "In-app alert"}</span>{item.readAt && <span>Read {new Date(item.readAt).toLocaleString()}</span>}{!item.readAt && <button onClick={() => void markRead([item.id])} className="font-bold text-orange-700">Mark read</button>}{item.link && <a href={item.link} onClick={() => !item.readAt && void markRead([item.id])} className="font-bold text-orange-700">View details</a>}</div>
        {item.data != null && <details className="mt-3 text-xs text-slate-500"><summary className="cursor-pointer font-semibold">Event details</summary><pre className="mt-2 overflow-x-auto rounded-lg bg-slate-50 p-3">{JSON.stringify(item.data, null, 2)}</pre></details>}
        </div></div></article>)}</div>}
    </main>
  </DashboardLayout>;
}
