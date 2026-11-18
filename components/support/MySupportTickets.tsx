'use client'

import { useCallback, useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { getMySupportTickets, reopenSupportTicket } from '@/app/actions/support'
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'
import { toast } from 'sonner'

export default function MySupportTickets({ role }: { role: 'parent' | 'student' }) {
  const [tickets, setTickets] = useState<Awaited<ReturnType<typeof getMySupportTickets>>>([])
  const load = useCallback(async () => { try { setTickets(await getMySupportTickets()) } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not load tickets.') } }, [])
  useEffect(() => { void load() }, [load])
  useRealtimeSubscription('support_ticket', () => void load())
  useRealtimeSubscription('support_ticket_replies', () => void load())
  return <DashboardLayout role={role}><main className="mx-auto max-w-5xl space-y-6 p-6 sm:p-8"><div><h1 className="text-3xl font-black">My Support Tickets</h1><p className="mt-2 text-sm text-slate-500">Super Admin resolutions and replies appear here in real time.</p></div>
    {!tickets.length ? <div className="rounded-2xl border border-dashed bg-white p-12 text-center text-slate-500">You have no support tickets yet.</div> : tickets.map(ticket => <article key={ticket.id} className="space-y-4 rounded-2xl border bg-white p-6"><header className="flex flex-wrap justify-between gap-3"><h2 className="font-bold">{ticket.title}</h2><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{ticket.status}</span></header><p className="text-xs text-slate-400">{ticket.ticketNumber} · Updated {new Date(ticket.updatedAt).toLocaleString()}</p><p className="whitespace-pre-wrap text-sm text-slate-700">{ticket.description}</p>
      {ticket.resolution && <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900"><strong>Super Admin resolution:</strong> {ticket.resolution}</p>}
      <section className="space-y-2 border-t pt-3"><h3 className="text-sm font-bold">Replies</h3>{ticket.replies.map(reply => <div key={reply.id} className="rounded-xl bg-slate-50 p-3 text-sm"><p>{reply.message}</p><time className="text-xs text-slate-400">{new Date(reply.createdAt).toLocaleString()}</time></div>)}</section>
      {ticket.status === 'RESOLVED' && <button onClick={async () => { const update = window.prompt('Describe what is still wrong so Support can continue working on it.'); if (!update?.trim()) return; try { await reopenSupportTicket(ticket.id, update); toast.success('Ticket reopened. Support has been notified.'); await load() } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not reopen ticket.') } }} className="rounded-xl bg-orange-600 px-4 py-2 text-xs font-bold text-white">Reopen if issue persists</button>}
    </article>)}</main></DashboardLayout>
}
