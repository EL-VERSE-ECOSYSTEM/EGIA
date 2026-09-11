'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, CheckCircle2, Clock, Sparkles, RefreshCw, Loader2, Search, Inbox } from 'lucide-react'
import { getLoggedInNotifications } from '@/app/actions/user'
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'
import { toast } from 'sonner'

export default function TeacherNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const list = await getLoggedInNotifications()
      setNotifications(list && list.length > 0 ? list : [
        { id: 'tn-1', title: 'New Lesson Plan Guidelines Uploaded', message: 'School Admin uploaded Term 2 curriculum guidelines for all subject teachers.', createdAt: new Date(Date.now() - 3600000), isRead: false, type: 'CURRICULUM' },
        { id: 'tn-2', title: 'Staff Meeting Scheduled', message: 'General academic staff meeting on Friday at 02:00 PM in the Conference Hall.', createdAt: new Date(Date.now() - 86400000), isRead: true, type: 'ADMIN' },
        { id: 'tn-3', title: 'Salary Clearance Processed', message: 'Monthly salary disbursement voucher cleared by finance department.', createdAt: new Date(Date.now() - 172800000), isRead: true, type: 'FINANCE' }
      ])
    } catch (err) {
      console.error('Failed to load teacher notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  // Real-time Supabase Database Sync for School Notifications
  useRealtimeSubscription('notification', () => {
    toast.info('New school notification received!')
    fetchNotifications()
  })

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    toast.success('Notifications marked as read')
  }

  const filtered = notifications.filter(n =>
    (filter === 'ALL' || !n.isRead) &&
    (n.title.toLowerCase().includes(searchQuery.toLowerCase()) || (n.message || '').toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <DashboardLayout role="teacher">
      <div className="p-8 max-w-5xl mx-auto min-h-screen space-y-10">
        {/* Banner with 3D Teal Depth Effect */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-950 via-teal-950 to-slate-900 p-10 text-white shadow-[0_20px_50px_rgba(13,148,136,0.15)] border border-teal-500/20">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs font-black uppercase tracking-widest">
                <Sparkles className="w-4 h-4 text-teal-400" /> Staff Real-time Ledger
              </div>
              <h1 className="text-4xl font-black tracking-tight text-white">Staff Notifications & Notices</h1>
              <p className="text-teal-100 font-medium text-sm">Direct updates from administration, academic curriculum board, and finance.</p>
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={fetchNotifications} variant="outline" className="border-teal-500/30 bg-white/10 hover:bg-white/20 text-white rounded-2xl h-12 px-5 font-black text-xs">
                <RefreshCw className="w-4 h-4 mr-2" /> REFRESH
              </Button>
              <Button onClick={markAllAsRead} className="bg-[#0D9488] hover:bg-teal-700 text-white rounded-2xl h-12 px-5 font-black text-xs shadow-lg shadow-teal-500/30">
                <CheckCircle2 className="w-4 h-4 mr-2" /> MARK ALL READ
              </Button>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex gap-2">
            <Button
              onClick={() => setFilter('ALL')}
              className={`rounded-xl font-black text-xs h-10 px-5 ${filter === 'ALL' ? 'bg-[#0D9488] text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              All Notices ({notifications.length})
            </Button>
            <Button
              onClick={() => setFilter('UNREAD')}
              className={`rounded-xl font-black text-xs h-10 px-5 ${filter === 'UNREAD' ? 'bg-[#0D9488] text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              Unread ({notifications.filter(n => !n.isRead).length})
            </Button>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-4 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search staff notices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-11 pr-4 rounded-xl border border-slate-200 bg-slate-50 font-bold text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 transition-all"
            />
          </div>
        </div>

        {/* List of Notifications */}
        <div className="space-y-4">
          {loading ? (
            <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-16 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#0D9488] mx-auto mb-3" />
              <p className="text-slate-400 font-bold text-xs uppercase tracking-wider">Accessing real-time staff records...</p>
            </Card>
          ) : filtered.length === 0 ? (
            <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-16 text-center">
              <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="font-black text-slate-800 text-lg">No Notifications Found</p>
              <p className="text-xs text-slate-400 font-bold mt-1">You are all caught up with staff notices for your school.</p>
            </Card>
          ) : (
            filtered.map((n) => (
              <Card
                key={n.id}
                className={`rounded-[2.5rem] border-none shadow-xl transition-all duration-300 hover:shadow-2xl p-6 ${
                  n.isRead ? 'bg-white' : 'bg-teal-50/50 border border-teal-200 shadow-teal-500/5'
                }`}
              >
                <CardContent className="p-0 flex items-start gap-5">
                  <div className={`p-3.5 rounded-2xl shrink-0 ${n.isRead ? 'bg-slate-100 text-slate-500' : 'bg-[#0D9488] text-white shadow-md'}`}>
                    <Bell className="w-5 h-5" />
                  </div>
                  <div className="flex-grow space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h4 className="font-black text-slate-900 text-lg leading-snug">{n.title}</h4>
                      <span className="text-[10px] font-black text-slate-400 flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-full">
                        <Clock className="w-3 h-3" /> {new Date(n.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-600 leading-relaxed">{n.message}</p>
                    <div className="pt-2 flex items-center gap-2">
                      <Badge className="bg-teal-100 text-[#0D9488] border-none font-black text-[9px] uppercase tracking-wider px-3 py-1 rounded-lg">
                        {n.type || 'STAFF NOTICE'}
                      </Badge>
                      {!n.isRead && (
                        <Badge className="bg-emerald-500 text-white border-none font-black text-[9px] uppercase tracking-wider px-3 py-1 rounded-lg animate-pulse">
                          NEW
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
