'use client'

import React, { useState } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createSupportTicket } from '@/app/actions/support'
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'
import { toast } from 'sonner'
import { LifeBuoy, Send, Loader2, CheckCircle2, MessageSquare } from 'lucide-react'

export default function ContactSupportPage() {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('TECHNICAL')
  const [priority, setPriority] = useState('MEDIUM')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [createdTicket, setCreatedTicket] = useState<any | null>(null)

  // Real-time Supabase Database Sync
  useRealtimeSubscription('support_ticket', () => {
    toast('Support desk updated in real time')
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !description.trim()) {
      return toast.error('Please complete all required fields.')
    }

    setSubmitting(true)
    try {
      const ticket = await createSupportTicket({
        title,
        category,
        priority,
        description,
      })
      toast.success('Support ticket created successfully!')
      setCreatedTicket(ticket)
      setTitle('')
      setDescription('')
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit ticket.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardLayout role="parent">
      <div className="p-8 max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Parent Help & Support Desk</h1>
          <p className="text-slate-500 font-medium">Direct technical & portal assistance with real-time status tracking via Supabase.</p>
        </div>

        {createdTicket && (
          <Card className="border-2 border-emerald-500 bg-emerald-50/50 p-6 rounded-[2rem] space-y-2 text-emerald-950">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              <h3 className="font-black text-lg">Support Ticket #{createdTicket.ticketNumber} Logged</h3>
            </div>
            <p className="text-xs font-semibold text-emerald-800">
              Your inquiry has been routed to our technical support team in real time. We will respond promptly.
            </p>
          </Card>
        )}

        <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden p-8 space-y-6">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <LifeBuoy className="text-emerald-600" /> Open New Support Ticket
            </CardTitle>
            <CardDescription className="text-slate-500 font-semibold text-xs">
              Describe your issue or portal inquiry clearly.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">Subject / Title</Label>
              <Input
                placeholder="e.g. Difficulty accessing ward results sheet..."
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                className="h-12 rounded-2xl"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700">Category</Label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full h-12 rounded-2xl border border-slate-200 bg-white px-4 font-bold text-slate-800 outline-none"
                >
                  <option value="TECHNICAL">Portal / Technical Issue</option>
                  <option value="ACADEMIC">Academic / Result Inquiry</option>
                  <option value="FINANCE">Payment / Fee Issue</option>
                  <option value="GENERAL">General Support</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700">Priority Level</Label>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value)}
                  className="w-full h-12 rounded-2xl border border-slate-200 bg-white px-4 font-bold text-slate-800 outline-none"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High / Urgent</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">Issue Details</Label>
              <textarea
                placeholder="Please provide full details about what happened..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                required
                className="w-full min-h-[120px] p-4 rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-14 rounded-2xl font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-200"
            >
              {submitting ? <Loader2 className="animate-spin w-5 h-5 mx-auto" /> : <Send className="w-5 h-5 mr-2 inline" />}
              SUBMIT SUPPORT TICKET
            </Button>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  )
}
