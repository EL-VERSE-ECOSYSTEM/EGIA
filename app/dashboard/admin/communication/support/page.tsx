'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, LifeBuoy, CheckCircle, Loader2 } from 'lucide-react'
import { getAdminSupportTickets, resolveSupportTicket } from '@/app/actions/admin-ops'
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'
import { toast } from 'sonner'

export default function AdminSupportDashboard() {
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null)
  const [resolutionText, setResolutionText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchTickets = async () => {
    try {
      const data = await getAdminSupportTickets()
      setTickets(data || [])
    } catch (err: any) {
      console.error('Failed to load support tickets:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [])

  // Real-time Supabase Database Sync
  useRealtimeSubscription('support_ticket', () => {
    fetchTickets()
    toast('Support tickets updated in real time')
  })

  const handleResolve = async () => {
    if (!selectedTicket || !resolutionText.trim()) {
      return toast.error('Please enter resolution notes.')
    }
    setSubmitting(true)
    try {
      await resolveSupportTicket(selectedTicket.id, resolutionText)
      toast.success('Support ticket resolved!')
      setSelectedTicket(null)
      setResolutionText('')
      fetchTickets()
    } catch (err: any) {
      toast.error(err.message || 'Action failed')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredTickets = tickets.filter(t => {
    const num = (t.ticketNumber || '').toLowerCase()
    const title = (t.title || '').toLowerCase()
    const name = (t.userName || '').toLowerCase()
    return num.includes(search.toLowerCase()) || title.includes(search.toLowerCase()) || name.includes(search.toLowerCase())
  })

  const openCount = tickets.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length

  return (
    <DashboardLayout role="admin">
      <div className="p-8 max-w-7xl mx-auto space-y-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Support Tickets</h1>
            <p className="text-slate-500 font-medium text-lg">Manage technical support requests from students, teachers, and parents in real time.</p>
          </div>
          <div className="flex gap-4">
             <div className="bg-blue-100 px-6 py-4 rounded-2xl flex items-center gap-3">
                <LifeBuoy className="text-blue-600" />
                <div className="leading-none">
                   <p className="text-2xl font-black text-blue-700">{openCount}</p>
                   <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Open Tickets</p>
                </div>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <Card className="lg:col-span-7 border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="p-8 border-b border-slate-50 bg-slate-50/30">
              <div className="relative max-w-md w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  className="pl-12 h-14 rounded-2xl bg-white border-none font-medium shadow-sm"
                  placeholder="Search tickets by ID, title, or user name..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
               {loading ? (
                 <div className="p-20 text-center text-slate-400 font-bold">Loading support tickets...</div>
               ) : (
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead>
                          <tr className="bg-slate-50/50">
                             <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ticket</th>
                             <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">User</th>
                             <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                             <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                             <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50">
                          {filteredTickets.length === 0 ? (
                            <tr><td colSpan={5} className="p-16 text-center text-slate-400 font-bold">No support tickets found in database.</td></tr>
                          ) : filteredTickets.map(t => (
                             <tr
                               key={t.id}
                               onClick={() => setSelectedTicket(t)}
                               className={`cursor-pointer hover:bg-slate-50/50 transition-colors ${selectedTicket?.id === t.id ? 'bg-blue-50/30' : ''}`}
                             >
                                <td className="p-6">
                                   <p className="font-black text-slate-900">{t.ticketNumber}</p>
                                   <p className="text-[10px] font-bold text-slate-400">{t.title}</p>
                                </td>
                                <td className="p-6">
                                   <p className="font-bold text-slate-700 text-sm">{t.userName}</p>
                                   <p className="text-[10px] text-slate-400 font-medium">{t.userEmail}</p>
                                </td>
                                <td className="p-6">
                                   <Badge className="bg-slate-100 text-slate-700 border-none font-bold px-2.5 py-0.5 text-[10px]">
                                     {t.category || 'TECHNICAL'}
                                   </Badge>
                                </td>
                                <td className="p-6">
                                   <Badge className={t.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}>
                                     {t.status}
                                   </Badge>
                                </td>
                                <td className="p-6 text-right">
                                   <Button size="sm" className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 font-black text-xs">
                                      VIEW
                                   </Button>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
               )}
            </CardContent>
          </Card>

          <div className="lg:col-span-5">
            {selectedTicket ? (
              <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white p-8 space-y-6">
                <div>
                  <Badge className="bg-blue-100 text-blue-800 font-black text-[10px] mb-2">{selectedTicket.ticketNumber}</Badge>
                  <h2 className="text-2xl font-black text-slate-900">{selectedTicket.title}</h2>
                  <p className="text-xs font-bold text-slate-400 mt-1">Priority: {selectedTicket.priority} • User: {selectedTicket.userName}</p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <p className="text-[10px] font-black uppercase text-slate-400">Issue Description</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedTicket.description}</p>
                </div>

                {selectedTicket.status === 'RESOLVED' ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl space-y-1">
                    <p className="text-[10px] font-black uppercase text-emerald-700">Resolution Remarks</p>
                    <p className="text-sm font-semibold text-emerald-900">{selectedTicket.resolution || 'Resolved by Administrator.'}</p>
                  </div>
                ) : (
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <p className="text-xs font-black uppercase text-slate-700">Resolve & Respond to User</p>
                    <textarea
                      placeholder="Input resolution instructions or response for the user..."
                      value={resolutionText}
                      onChange={e => setResolutionText(e.target.value)}
                      className="w-full min-h-[100px] p-4 rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Button
                      onClick={handleResolve}
                      disabled={submitting}
                      className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs gap-2"
                    >
                      {submitting ? <Loader2 className="animate-spin w-4 h-4" /> : <CheckCircle size={16} />}
                      RESOLVE SUPPORT TICKET
                    </Button>
                  </div>
                )}
              </Card>
            ) : (
              <div className="h-full min-h-[300px] flex items-center justify-center border-2 border-dashed border-slate-200 rounded-[2.5rem] text-slate-400 font-bold p-8 text-center">
                Select a support ticket from the list to view details and manage response/resolution.
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
