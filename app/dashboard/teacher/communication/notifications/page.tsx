'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, CheckCircle2, Clock, Sparkles, RefreshCw, Loader2 } from 'lucide-react'
import { getLoggedInNotifications } from '@/app/actions/user'
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'
import { toast } from 'sonner'

export default function TeacherNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL')

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const list = await getLoggedInNotifications()
      setNotifications(list || [])
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

  const filtered = notifications.filter(n => filter === 'ALL' || !n.isRead)

  return (
    <div className="p-6 md:p-10 space-y-8 bg-slate-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-600 text-white rounded-2xl shadow-lg shadow-purple-600/20">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Staff Notifications & Alerts</h1>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Realtime School Database Connected
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchNotifications} className="rounded-xl font-bold border-slate-200">
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
          <Button onClick={markAllAsRead} className="bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-600/20">
            <CheckCircle2 className="w-4 h-4 mr-2" /> Mark All Read
          </Button>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200 pb-4">
        <Button
          variant={filter === 'ALL' ? 'default' : 'ghost'}
          onClick={() => setFilter('ALL')}
          className={`rounded-xl font-bold text-xs ${filter === 'ALL' ? 'bg-purple-600 text-white' : 'text-slate-600'}`}
        >
          All Alerts ({notifications.length})
        </Button>
        <Button
          variant={filter === 'UNREAD' ? 'default' : 'ghost'}
          onClick={() => setFilter('UNREAD')}
          className={`rounded-xl font-bold text-xs ${filter === 'UNREAD' ? 'bg-purple-600 text-white' : 'text-slate-600'}`}
        >
          Unread ({notifications.filter(n => !n.isRead).length})
        </Button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <Card className="rounded-[2rem] border-slate-200 p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-3" />
            <p className="text-slate-400 font-bold text-xs uppercase tracking-wider">Loading real-time school notifications...</p>
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="rounded-[2rem] border-slate-200 p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center mx-auto mb-4 text-purple-600">
              <Bell className="w-8 h-8" />
            </div>
            <p className="font-black text-slate-800 text-lg">No Notifications Found</p>
            <p className="text-xs text-slate-400 font-medium mt-1">You are all caught up with staff notices for your school.</p>
          </Card>
        ) : (
          filtered.map((n) => (
            <Card key={n.id} className={`rounded-[2rem] border transition-all ${n.isRead ? 'bg-white border-slate-200' : 'bg-purple-50/50 border-purple-200 shadow-lg shadow-purple-600/5'}`}>
              <CardContent className="p-6 flex items-start gap-4">
                <div className={`p-3 rounded-2xl shrink-0 ${n.isRead ? 'bg-slate-100 text-slate-500' : 'bg-purple-600 text-white'}`}>
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="flex-grow space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-slate-900 text-base">{n.title}</h4>
                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-600 leading-relaxed">{n.message}</p>
                  <div className="pt-2 flex items-center gap-2">
                    <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-none font-bold text-[9px] uppercase tracking-wider">
                      {n.type || 'NOTICE'}
                    </Badge>
                    {!n.isRead && (
                      <Badge className="bg-emerald-500 text-white border-none font-bold text-[9px] uppercase tracking-wider">
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
  )
}
