'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, Loader2, Smartphone, CheckCircle } from 'lucide-react'
import { getLoggedInNotifications } from '@/app/actions/user'
import { requestNotificationPermission, sendDeviceNotification } from '@/lib/notifications'
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'
import { toast } from 'sonner'

export default function ParentNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [permissionGranted, setPermissionGranted] = useState(false)
  const [requesting, setRequesting] = useState(false)

  const loadNotifications = async () => {
    try {
      const list = await getLoggedInNotifications()
      setNotifications(list || [])
    } catch (err) {
      console.warn('Could not load parent notifications:', err)
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
        body: 'You have successfully subscribed to EL GOODNEWS ACADEMY mobile device and browser alerts.',
        tag: 'system-active'
      })
      toast.success('Mobile device notifications enabled!')
    } else {
      toast.error('Notification subscription denied.')
    }
  }

  return (
    <DashboardLayout role="parent">
      <div className="p-8 max-w-4xl mx-auto min-h-screen space-y-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Parent Notification Center</h1>
            <p className="text-slate-500 font-medium">Real-time alerts regarding ward activities, fee updates, and school announcements.</p>
          </div>
          {!permissionGranted ? (
            <Button
              onClick={handleEnableDeviceNotifications}
              disabled={requesting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl h-14 px-6 font-black shadow-xl shadow-emerald-100 flex items-center gap-2"
            >
              {requesting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Smartphone className="w-5 h-5" />}
              ENABLE MOBILE ALERTS
            </Button>
          ) : (
            <Badge className="bg-emerald-100 text-emerald-800 border-none font-black text-xs py-2.5 px-4 rounded-xl flex items-center gap-1.5 shadow-sm">
              <CheckCircle className="w-4 h-4 text-emerald-600" /> ALERTS ACTIVE
            </Badge>
          )}
        </div>

        <Card className="border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] bg-white overflow-hidden">
          <CardHeader className="p-10 border-b border-slate-50">
             <CardTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Bell className="text-emerald-600 animate-bounce" /> Parent Inbox
             </CardTitle>
             <CardDescription className="text-slate-400 font-bold uppercase tracking-wider text-xs">
                Real-time updates dynamically linked to the database
             </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
             {loading ? (
               <div className="p-24 text-center">
                 <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mx-auto mb-4" />
                 <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading notifications...</p>
               </div>
             ) : notifications.length === 0 ? (
               <div className="p-24 text-center text-slate-400 font-bold italic leading-relaxed">
                 Your notifications folder is empty.
               </div>
             ) : (
               <div className="divide-y divide-slate-50">
                 {notifications.map((n) => (
                   <div key={n.id} className="p-8 hover:bg-slate-50/50 transition-colors flex gap-6 items-start">
                     <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                       <Bell className="w-5 h-5" />
                     </div>
                     <div className="space-y-1">
                       <h3 className="font-black text-slate-900 text-lg">{n.title}</h3>
                       <p className="text-slate-500 font-medium text-sm leading-relaxed">{n.message}</p>
                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider pt-2">
                         {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       </p>
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
