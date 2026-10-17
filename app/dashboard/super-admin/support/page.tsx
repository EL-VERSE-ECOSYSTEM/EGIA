'use client'

import React, { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import {
  getSuperAdminSupportTicketsAction,
  replyToSupportTicketAction,
  quickReplySupportTicketAction
} from '@/app/actions/super-admin'
import { HelpCircle, RefreshCw, Send, MessageSquare, CheckCircle, Clock, Search } from 'lucide-react'
import { toast } from 'sonner'
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'

export default function SupportTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [replyText, setReplyText] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const loadTickets = async () => {
    setLoading(true)
    const res = await getSuperAdminSupportTicketsAction()
    if (res.success) {
      setTickets(res.tickets || [])
    } else {
      toast.error('Failed to load support tickets')
    }
    setLoading(false)
  }

  useEffect(() => {
    loadTickets()
  }, [])

  useRealtimeSubscription('support_ticket', () => {
    loadTickets()
    toast.info('Support Tickets updated in real time')
  })

  useRealtimeSubscription('support_ticket_replies', () => {
    loadTickets()
  })

  const handleSendReply = async (ticketId: string) => {
    const message = replyText[ticketId]
    if (!message || !message.trim()) {
      toast.error('Please enter a reply message.')
      return
    }

    setSubmitting(ticketId)
    const res = await replyToSupportTicketAction(ticketId, message)
    if (res.success) {
      toast.success('Reply submitted successfully!')
      setReplyText(prev => ({ ...prev, [ticketId]: '' }))
      loadTickets()
    } else {
      toast.error('error' in res ? res.error : 'Failed to send reply.')
    }
    setSubmitting(null)
  }

  const filtered = tickets.filter(t =>
    t.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.category?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <DashboardLayout role="super-admin">
      <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 text-xs font-black uppercase mb-2">
              <HelpCircle className="w-3.5 h-3.5" /> Support Desk
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Platform Support Tickets Desk</h1>
            <p className="text-slate-500 text-sm font-semibold mt-1">
              Respond to support inquiries and ticket messages from teachers, parents, and students across all schools in real time.
            </p>
          </div>
          <button
            onClick={loadTickets}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs transition shadow-md"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Desk
          </button>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-4 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ticket subject, user email, or category..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-600 shadow-sm"
          />
        </div>

        {loading ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-purple-600 mb-2" />
            <p className="text-xs font-bold text-slate-500">Loading support tickets...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
            <HelpCircle className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <p className="text-sm font-black text-slate-900">No Support Tickets Found</p>
            <p className="text-xs font-semibold text-slate-400 mt-1">No pending support inquiries matching your search criteria.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(ticket => (
              <div key={ticket.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-base font-black text-slate-900">{ticket.subject}</h3>
                    <p className="text-xs font-bold text-slate-400">By: {ticket.userEmail || ticket.userId} • Category: {ticket.category || 'General'}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                    ticket.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {ticket.status}
                  </span>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl text-xs font-medium text-slate-700 leading-relaxed">
                  {ticket.description || ticket.message}
                </div>

                {ticket.replies && ticket.replies.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <p className="text-[10px] font-black uppercase text-slate-400">Previous Replies ({ticket.replies.length})</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {ticket.replies.map((rep: any) => (
                        <div key={rep.id} className="p-3 bg-slate-100 rounded-xl text-xs space-y-1">
                          <p className="font-bold text-slate-900 text-[11px]">{rep.senderRole}: {rep.message}</p>
                          <p className="text-[9px] text-slate-400">{new Date(rep.createdAt).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2 flex gap-2">
                  <input
                    type="text"
                    placeholder="Type official Super Admin response..."
                    value={replyText[ticket.id] || ''}
                    onChange={e => setReplyText({ ...replyText, [ticket.id]: e.target.value })}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-600"
                  />
                  <button
                    onClick={() => handleSendReply(ticket.id)}
                    disabled={submitting === ticket.id}
                    className="px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs uppercase flex items-center gap-2 shadow-sm transition disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" /> Reply
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
