'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, CheckCircle2, Clock, Shield, Sparkles, Filter, AlertCircle, RefreshCw } from 'lucide-react'
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'
import { toast } from 'sonner'

export default function TeacherNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL')

  useEffect(() => {
    fetchNotifications()
  }, [])

  useRealtimeSubscription('notification', () => {
    toast.info('New staff notification received!')
    fetchNotifications()
  })

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      // Mock initial realtime-ready notification state for teacher dashboard
      const demoList = [
        {
          id: '1',
          title: 'System Broadcast: Term Examination Approval',
          message: 'All CBT assessments for your registered classes have been approved by the School Administrator.',
          createdAt: new Date().toISOString(),
          read: false,
          category: 'ACADEMIC'
        },
        {
          id: '2',
          title: 'Wallet Credit Alert',
          message: 'Your utility request has been processed and updated in your Teacher Wallet balance.',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          read: true,
          category: 'FINANCE'
        }
      ]
      setNotifications(demoList)
    } catch (err) {
      console.error('Failed to load teacher notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    toast.success('All notifications marked as read')
  }

  const filtered = notifications.filter(n => filter === 'ALL' || !n.read)

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
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Realtime Database Connected
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
          Unread ({notifications.filter(n => !n.read).length})
        </Button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <Card className="rounded-[2rem] border-slate-200 p-8 text-center text-slate-400 font-bold">
            Loading notifications...
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="rounded-[2rem] border-slate-200 p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Bell className="w-8 h-8" />
            </div>
            <p className="font-black text-slate-800 text-lg">No Notifications Found</p>
            <p className="text-xs text-slate-400 font-medium mt-1">You are all caught up with staff notices.</p>
          </Card>
        ) : (
          filtered.map((n) => (
            <Card key={n.id} className={`rounded-[2rem] border transition-all ${n.read ? 'bg-white border-slate-200' : 'bg-purple-50/50 border-purple-200 shadow-lg shadow-purple-600/5'}`}>
              <CardContent className="p-6 flex items-start gap-4">
                <div className={`p-3 rounded-2xl shrink-0 ${n.read ? 'bg-slate-100 text-slate-500' : 'bg-purple-600 text-white'}`}>
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="flex-grow space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-slate-900 text-base">{n.title}</h4>
                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-600 leading-relaxed">{n.message}</p>
                  <div className="pt-2 flex items-center gap-2">
                    <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-none font-bold text-[9px] uppercase tracking-wider">
                      {n.category || 'NOTICE'}
                    </Badge>
                    {!n.read && (
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
