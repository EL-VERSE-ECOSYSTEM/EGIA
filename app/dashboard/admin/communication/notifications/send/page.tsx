'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Send, CheckCircle, AlertCircle, Bell, Search, ShieldCheck } from 'lucide-react'
import { getAllSystemUsers, adminSendNotification, adminBroadcastNotification } from '@/app/actions/messaging'
import { toast } from 'sonner'

export default function AdminSendNotificationPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Form states
  const [selectedUserId, setSelectedUserId] = useState('ALL_USERS')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [type, setType] = useState('info')

  useEffect(() => {
    async function load() {
      try {
        const list = await getAllSystemUsers()
        setUsers(list || [])
        setSelectedUserId('ALL_USERS')
      } catch (err: any) {
        toast.error('Failed to load user registry', { description: err.message })
      } finally {
        setLoadingUsers(false)
      }
    }
    load()
  }, [])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUserId || !title || !message) {
      toast.error('Please fill in all fields')
      return
    }

    setSubmitting(true)
    try {
      if (selectedUserId === 'ALL_USERS') {
        const res = await adminBroadcastNotification(title, message, type)
        toast.success(`Broadcast notification sent to all ${res?.count || 0} active users!`)
      } else {
        await adminSendNotification(selectedUserId, title, message, type)
        toast.success('Notification sent to user in real-time!')
      }
      setTitle('')
      setMessage('')
    } catch (err: any) {
      toast.error(err.message || 'Failed to send notification')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardLayout role="admin">
      <div className="p-8 max-w-4xl mx-auto space-y-10 min-h-screen">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Real-time Notification Center</h1>
          <p className="text-slate-500 font-medium text-lg">Send instant push notifications and alerts to individual student, parent, or teacher portal screens.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] bg-white overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100 p-8">
              <div className="flex items-center gap-3">
                <div className="bg-amber-100 p-3 rounded-2xl text-amber-600">
                  <Bell className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <CardTitle className="text-xl font-black text-slate-900">Compose Dispatch</CardTitle>
                  <CardDescription className="text-slate-400 font-bold">Transmit instant real-time message payloads</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              {loadingUsers ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-2">
                  <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Loading active user directories...</p>
                </div>
              ) : (
                <form onSubmit={handleSend} className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Target Portal Recipient</Label>
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                      required
                    >
                      <option value="ALL_USERS">★ BROADCAST TO ALL PORTAL USERS ★</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name || 'Anonymous'} ({u.email})</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Alert Category</Label>
                      <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                      >
                        <option value="info">Information (Blue)</option>
                        <option value="warning">Warning (Amber)</option>
                        <option value="success">Success Status (Green)</option>
                        <option value="alert">Critical / Disciplinary (Red)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Dispatch Subject</Label>
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Disciplinary Warning / Fee Notification"
                        className="h-12 rounded-xl border-slate-200 bg-slate-50 focus:bg-white"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Notification Body Content</Label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Write your alert details here. The user will receive this on their screen immediately."
                      className="w-full h-32 p-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-800"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-14 bg-amber-500 hover:bg-amber-600 text-amber-950 font-black rounded-2xl shadow-xl shadow-amber-100 flex items-center justify-center gap-2"
                  >
                    {submitting ? <Loader2 className="animate-spin w-5 h-5" /> : <Send size={18} />}
                    DISPATCH NOTIFICATION
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          <div className="space-y-8">
            <Card className="border-none shadow-xl bg-slate-900 text-white rounded-[2.5rem] p-8">
              <div className="flex gap-4">
                <ShieldCheck className="text-amber-500 w-8 h-8 shrink-0 animate-bounce" />
                <div className="space-y-4">
                  <h3 className="font-black text-lg">Instant Delivery</h3>
                  <p className="text-slate-400 text-xs font-semibold leading-relaxed">
                    This dispatch leverages real-time table listeners. Once dispatched, the recipient's viewport will alert and display the badge instantly, without manual page reloading.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
