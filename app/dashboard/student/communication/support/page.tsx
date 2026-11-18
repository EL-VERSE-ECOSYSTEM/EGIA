'use client'

import React, { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { LifeBuoy, Clock } from 'lucide-react'
import { createSupportTicket, getMySupportTickets } from '@/app/actions/support'
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'
import { toast } from 'sonner'

export default function StudentSupportPage() {
  const [isAdding, setIsAdding] = useState(false)
  const [tickets, setTickets] = useState<Awaited<ReturnType<typeof getMySupportTickets>>>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'TECHNICAL_ISSUE',
    supportType: 'APP' as 'APP' | 'SCHOOL',
  })

  const loadTickets = async () => {
    try {
      setTickets(await getMySupportTickets())
    } catch (error) {
      toast.error('Could not load your support tickets', {
        description: error instanceof Error ? error.message : 'Refresh and try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadTickets()
  }, [])

  useRealtimeSubscription('support_ticket', () => void loadTickets())
  useRealtimeSubscription('support_ticket_replies', () => void loadTickets())

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      return toast.error('Add a title and describe the problem.')
    }
    setSubmitting(true)
    try {
      await createSupportTicket({
        ...formData,
        priority: 'MEDIUM',
      })
      toast.success('Support ticket created.')
      setIsAdding(false)
      setFormData({ title: '', description: '', category: 'TECHNICAL_ISSUE', supportType: 'APP' })
      await loadTickets()
    } catch (error) {
      toast.error('Could not create support ticket', {
        description: error instanceof Error ? error.message : 'Try again.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardLayout role="student">
      <div className="p-8 max-w-7xl mx-auto space-y-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Help & Support</h1>
            <p className="text-slate-500 font-medium text-lg">Facing technical issues or need help with your CBT?</p>
          </div>
          <Button
            onClick={() => setIsAdding(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white h-14 px-8 rounded-2xl font-black text-lg shadow-xl shadow-orange-100"
          >
             <LifeBuoy className="w-6 h-6 mr-2" /> NEW TICKET
          </Button>
        </div>

        {isAdding ? (
          <Card className="border-none shadow-2xl shadow-slate-200 rounded-[3rem] overflow-hidden bg-white">
             <CardHeader className="p-10 border-b border-slate-50">
                <CardTitle className="text-2xl font-black text-slate-900">Create Support Ticket</CardTitle>
             </CardHeader>
             <CardContent className="p-10 space-y-8">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Support destination</label>
                   <select value={formData.supportType} onChange={e => setFormData({...formData, supportType: e.target.value as 'APP' | 'SCHOOL'})} className="h-12 w-full rounded-xl border border-slate-100 bg-white px-4 text-sm font-bold"><option value="SCHOOL">School Support</option><option value="APP">App Support · Super Admin</option></select>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">What is the problem?</label>
                   <Input placeholder="e.g. Cannot access JSS3 Math assessment" className="h-14 rounded-xl border-slate-100 font-bold" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Details</label>
                   <Textarea placeholder="Tell us more about the issue..." className="min-h-[150px] rounded-2xl border-slate-100 font-medium p-6" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>
                <div className="flex justify-end gap-4 pt-4">
                   <Button variant="ghost" onClick={() => setIsAdding(false)} className="rounded-xl font-black h-14 px-8">Cancel</Button>
                   <Button onClick={handleSubmit} disabled={submitting} className="bg-orange-500 hover:bg-orange-600 h-14 px-10 rounded-xl font-black shadow-lg shadow-orange-100">
                     {submitting ? 'Sending…' : 'Send Ticket'}
                   </Button>
                </div>
             </CardContent>
          </Card>
        ) : loading ? (
            <div className="col-span-full rounded-2xl bg-white p-12 text-center text-slate-500">Loading your support history…</div>
          ) : tickets.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-500">Your support tickets and replies will appear here.</div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             {tickets.map((ticket) => (
               <Card key={ticket.id} className="border-none shadow-xl shadow-slate-100 rounded-[2.5rem] bg-white overflow-hidden group">
                  <div className={`h-2 ${ticket.status === 'RESOLVED' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                  <CardHeader className="p-8 pb-4">
                     <div className="flex justify-between items-start mb-4">
                        <Badge className={`${ticket.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'} border-none font-black px-3`}>
                           {ticket.status}
                        </Badge>
                        <span className="text-[10px] font-black text-slate-400">{ticket.ticketNumber}</span>
                     </div>
                     <CardTitle className="text-lg font-black text-slate-900 group-hover:text-orange-600 transition-colors">
                        {ticket.title}
                     </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 pt-0 flex items-center justify-between">
                     <div className="flex items-center gap-2 text-slate-400">
                        <Clock size={14} />
                        <span className="text-[10px] font-bold">Updated {new Date(ticket.updatedAt).toLocaleString()}</span>
                     </div>
                  </CardContent>
                  {ticket.replies.map((reply) => (
                    <div key={reply.id} className="mx-8 mb-4 rounded-xl bg-slate-50 p-4 text-sm">
                      <p className="font-semibold text-slate-800">{reply.message}</p>
                      <p className="mt-1 text-xs text-slate-400">{new Date(reply.createdAt).toLocaleString()}</p>
                    </div>
                  ))}
               </Card>
             ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
