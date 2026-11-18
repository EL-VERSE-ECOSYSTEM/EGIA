'use client'

import { useCallback, useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getMySupportTickets, reopenSupportTicket } from '@/app/actions/support'
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'
import { toast } from 'sonner'

export default function ParentSupportTicketsPage() {
  const [tickets, setTickets] = useState<Awaited<ReturnType<typeof getMySupportTickets>>>([])
  const [loading, setLoading] = useState(true)

  const loadTickets = useCallback(async () => {
    try {
      setTickets(await getMySupportTickets())
    } catch (error) {
      toast.error('Could not load your support tickets', {
        description: error instanceof Error ? error.message : 'Refresh and try again.',
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadTickets()
  }, [loadTickets])

  useRealtimeSubscription('support_ticket', () => void loadTickets())
  useRealtimeSubscription('support_ticket_replies', () => void loadTickets())

  return (
    <DashboardLayout role="parent">
      <div className="mx-auto max-w-5xl space-y-6 p-6 sm:p-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900">My Support Tickets</h1>
          <p className="mt-2 text-sm text-slate-500">Ticket status and Super Admin replies update in real time.</p>
        </div>
        {loading ? (
          <div className="rounded-2xl bg-white p-12 text-center text-slate-500">Loading your tickets…</div>
        ) : tickets.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-500">
            You have no support tickets yet.
          </div>
        ) : tickets.map((ticket) => (
          <Card key={ticket.id} className="rounded-2xl border-slate-200">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="text-lg">{ticket.title}</CardTitle>
                <Badge variant="outline">{ticket.status}</Badge>
              </div>
              <p className="text-xs text-slate-500">{ticket.ticketNumber} · Updated {new Date(ticket.updatedAt).toLocaleString()}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="whitespace-pre-wrap text-sm text-slate-700">{ticket.description}</p>
              {ticket.resolution && <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900"><strong>Super Admin resolution:</strong> {ticket.resolution}</p>}
              <div className="space-y-2 border-t pt-4">
                <h2 className="text-sm font-bold text-slate-800">Replies</h2>
                {ticket.replies.length ? ticket.replies.map((reply) => (
                  <div key={reply.id} className="rounded-xl bg-slate-50 p-3">
                    <p className="text-sm text-slate-700">{reply.message}</p>
                    <p className="mt-1 text-xs text-slate-400">{new Date(reply.createdAt).toLocaleString()}</p>
                  </div>
                )) : <p className="text-sm text-slate-500">A support agent will reply here.</p>}
              </div>
              {ticket.status === 'RESOLVED' && <button onClick={async () => {
                const update = window.prompt('Describe what is still wrong so Support can continue working on it.')
                if (!update?.trim()) return
                try { await reopenSupportTicket(ticket.id, update); toast.success('Ticket reopened. Support has been notified.'); await loadTickets() }
                catch (error) { toast.error(error instanceof Error ? error.message : 'Could not reopen ticket.') }
              }} className="rounded-xl bg-orange-600 px-4 py-2 text-xs font-bold text-white">Reopen if issue persists</button>}
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  )
}
