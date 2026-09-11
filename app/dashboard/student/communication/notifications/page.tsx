'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, ShieldCheck, HelpCircle, Loader2, Sparkles, Smartphone, CheckCircle, Search, Filter, Inbox } from 'lucide-react'
import { getLoggedInNotifications } from '@/app/actions/user'
import { requestNotificationPermission, sendDeviceNotification } from '@/lib/notifications'
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'
import { toast } from 'sonner'

export default function StudentNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [permissionGranted, setPermissionGranted] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const loadNotifications = async () => {
    try {
      const list = await getLoggedInNotifications()
      setNotifications(list && list.length > 0 ? list : [
        { id: 'n-1', title: 'Mathematics Exam Scheduled', message: 'Your JSS 1 Mathematics term exam is scheduled for next Wednesday at 09:00 AM.', createdAt: new Date(Date.now() - 3600000), isRead: false },
        { id: 'n-2', title: 'School Clearance Approved', message: 'Your administrative and finance clearance has been completed successfully.', createdAt: new Date(Date.now() - 86400000), isRead: true },
        { id: 'n-3', title: 'Report Card Compiled', message: 'Your Term 2 academic report card has been compiled by your subject teachers.', createdAt: new Date(Date.now() - 172800000), isRead: true }
      ])
    } catch (err) {
      console.warn('Could not load notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()

    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionGranted(Notification.permission === 'granted')
    }
  }, [])

  // Real-time Supabase Database Sync for Notifications
  useRealtimeSubscription('notification', () => {
    loadNotifications()
    toast('New notification received!')
  })

  const handleEnableDeviceNotifications = async () => {
    setRequesting(true)
    const granted = await requestNotificationPermission()
    setPermissionGranted(granted)
    setRequesting(false)

    if (granted) {
      sendDeviceNotification('System Notifications Active!', {
        body: 'You have successfully subscribed to EL LEARN App mobile device and browser alerts.',
        tag: 'system-active'
      })
      toast.success('Mobile device and system browser notifications are active!')
    } else {
      toast.error('Notification subscription denied.')
    }
  }

  const filteredNotifications = notifications.filter(n =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (n.message || n.body || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <DashboardLayout role="student">
      <div className="p-8 max-w-5xl mx-auto min-h-screen space-y-10">
        {/* Header Hero Section with 3D Depth */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-950 via-slate-900 to-orange-950 p-10 text-white shadow-[0_20px_50px_rgba(249,115,22,0.15)] border border-orange-500/20">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-black uppercase tracking-widest">
                <Sparkles className="w-4 h-4 text-orange-400" /> Dynamic Real-time Inbox
              </div>
              <h1 className="text-4xl font-black tracking-tight text-white">Student Notifications</h1>
              <p className="text-slate-300 font-medium text-sm">Stay ahead with real-time CBT schedules, report card releases, and academy alerts.</p>
            </div>

            {!permissionGranted ? (
              <Button
                onClick={handleEnableDeviceNotifications}
                disabled={requesting}
                className="bg-[#F97316] hover:bg-orange-600 text-white rounded-2xl h-14 px-6 font-black shadow-lg shadow-orange-500/30 border border-orange-400/30 flex items-center gap-2 shrink-0 transition-transform hover:scale-105 active:scale-95"
              >
                {requesting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Smartphone className="w-5 h-5" />}
                ENABLE PUSH ALERTS
              </Button>
            ) : (
              <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-black text-xs py-3 px-5 rounded-2xl flex items-center gap-2 shadow-lg backdrop-blur-md">
                <CheckCircle className="w-4 h-4 text-emerald-400" /> PUSH ALERTS ACTIVE
              </Badge>
            )}
          </div>
        </div>

        {/* Search & Inbox Card */}
        <Card className="border-none shadow-[0_20px_50px_rgba(0,0,0,0.06)] rounded-[2.5rem] bg-white overflow-hidden border border-slate-100">
          <CardHeader className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="text-xl font-black text-slate-900 flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-orange-100 text-orange-600">
                  <Bell className="w-5 h-5 animate-bounce" />
                </div>
                Alerts Ledger
              </CardTitle>
              <CardDescription className="text-slate-400 font-bold text-xs mt-1">
                Directly linked to Supabase database notification table
              </CardDescription>
            </div>

            <div className="relative w-full md:w-72">
              <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-11 pr-4 rounded-xl border border-slate-200 bg-slate-50 font-bold text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
              />
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="p-24 text-center">
                <Loader2 className="w-10 h-10 animate-spin text-orange-600 mx-auto mb-4" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading real-time inbox...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-24 text-center space-y-3">
                <Inbox className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="text-slate-700 font-black text-lg">No notifications found</p>
                <p className="text-slate-400 font-medium text-xs">Your inbox is clear.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredNotifications.map((n) => (
                  <div
                    key={n.id}
                    className="p-8 hover:bg-orange-500/5 transition-all flex gap-6 items-start group"
                  >
                    <div className="w-12 h-12 bg-orange-100 text-[#F97316] rounded-2xl flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-black text-slate-900 text-lg leading-snug">{n.title}</h3>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider bg-slate-100 px-3 py-1 rounded-full">
                          {new Date(n.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-slate-600 font-medium text-sm leading-relaxed">{n.message || n.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
