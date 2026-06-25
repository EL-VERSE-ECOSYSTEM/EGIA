'use client'

import React, { useState } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Megaphone, Send, ShieldAlert, Users } from 'lucide-react'
import { broadcastMessage } from '@/app/actions/messaging'

export default function AdminBroadcastPage() {
  const [content, setContent] = useState('')
  const [role, setRole] = useState('')
  const [isSending, setIsSending] = useState(false)

  const handleBroadcast = async () => {
    if (!content || !role) {
      alert('Please select a role and enter message content')
      return
    }

    if (!confirm(`Broadcast this message to all ${role}s?`)) return

    setIsSending(true)
    try {
      await broadcastMessage(content, role)
      alert('Broadcast sent successfully!')
      setContent('')
    } catch (error: any) {
      console.error(error)
      alert(error.message || 'Failed to send broadcast.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <DashboardLayout role="admin">
      <div className="p-8 max-w-4xl mx-auto">
        <div className="mb-10 text-center">
           <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 mx-auto mb-4">
              <Megaphone className="w-8 h-8" />
           </div>
           <h1 className="text-4xl font-black text-slate-900 tracking-tight">System Broadcast</h1>
           <p className="text-slate-500 font-medium text-lg">Send announcements to specific user roles across the school.</p>
        </div>

        <div className="grid grid-cols-1 gap-8">
           <Card className="border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] overflow-hidden bg-white">
              <CardHeader className="p-10 bg-slate-900 text-white">
                 <CardTitle className="text-2xl font-black">Compose Announcement</CardTitle>
                 <CardDescription className="text-slate-400">Broadcasts appear in the target user's messaging inbox.</CardDescription>
              </CardHeader>
              <CardContent className="p-10 space-y-8">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Select Target Audience</label>
                    <Select onValueChange={setRole}>
                       <SelectTrigger className="h-14 rounded-2xl border-slate-100 bg-slate-50 font-bold">
                          <SelectValue placeholder="Who should receive this?" />
                       </SelectTrigger>
                       <SelectContent>
                          <SelectItem value="student">All Students</SelectItem>
                          <SelectItem value="teacher">All Teachers</SelectItem>
                          <SelectItem value="parent">All Parents</SelectItem>
                       </SelectContent>
                    </Select>
                 </div>

                 <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Message Content</label>
                    <Textarea
                       value={content}
                       onChange={(e) => setContent(e.target.value)}
                       placeholder="Type your official announcement here..."
                       className="min-h-[200px] rounded-3xl bg-slate-50 border-none p-6 font-medium text-lg focus:ring-4 focus:ring-amber-100"
                    />
                 </div>

                 <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 flex items-start gap-4">
                    <ShieldAlert className="text-amber-600 w-6 h-6 shrink-0" />
                    <p className="text-xs text-amber-800 font-bold leading-relaxed">
                       Caution: This action cannot be undone. All users with the selected role will receive a notification and this message instantly.
                    </p>
                 </div>

                 <Button
                    onClick={handleBroadcast}
                    disabled={isSending}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-amber-950 h-16 rounded-2xl font-black text-xl transition-all shadow-xl"
                 >
                    {isSending ? 'Transmitting Broadcast...' : 'Launch Broadcast'} <Send className="ml-2 w-5 h-5" />
                 </Button>
              </CardContent>
           </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
