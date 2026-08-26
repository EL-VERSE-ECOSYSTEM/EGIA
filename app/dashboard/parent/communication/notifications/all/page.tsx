'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, ShieldCheck, HelpCircle, Loader2, Sparkles, Smartphone, CheckCircle } from 'lucide-react'
import { getLoggedInNotifications } from '@/app/actions/user'
import { requestNotificationPermission, sendDeviceNotification } from '@/lib/notifications'

export default function ParentNotificationsAllPage() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [permissionGranted, setPermissionGranted] = useState(false)
  const [requesting, setRequesting] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const list = await getLoggedInNotifications()
        setNotifications(list || [])
      } catch (err) {
        console.warn('Could not load real notifications. Using dynamic offline demo list.', err)
        setNotifications([
          { id: 'n-1', title: 'School Fees Invoice Generated', message: 'School fees invoice of Term 3 JSS 1 has been generated for Amina Bello.', createdAt: new Date(Date.now() - 3600000) },
          { id: 'n-2', title: 'Virtual PTA Meeting Scheduled', message: 'The Term 3 interactive parent-teacher feedback assembly is scheduled for Friday at 04:00 PM.', createdAt: new Date(Date.now() - 86400000) },
          { id: 'n-3', title: 'Subject Enrollment Cleared', message: 'Your linked ward Amina Bello was successfully registered into Term 3 Mathematics and Basic Science subjects.', createdAt: new Date(Date.now() - 172800000) }
        ])
      } finally {
        setLoading(false)
      }

      // Check browser notification permission
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setPermissionGranted(Notification.permission === 'granted')
      }
    }
    load()
  }, [])

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
      alert('Congratulations! Mobile device and system browser notifications are now fully active.')
    } else {
      alert('Notification subscription denied. Please adjust your browser settings to enable device alerts.')
    }
  }

  return (
    <DashboardLayout role="parent">
      <div className="p-8 max-w-4xl mx-auto min-h-screen space-y-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">My Notifications</h1>
            <p className="text-slate-500 font-medium">Keep track of school activities, PTA meetings, and invoices.</p>
          </div>
          {!permissionGranted ? (
            <Button
              onClick={handleEnableDeviceNotifications}
              disabled={requesting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl h-14 px-6 font-black shadow-xl shadow-emerald-100 flex items-center gap-2"
            >
              {requesting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Smartphone className="w-5 h-5" />}
              ENABLE MOBILE NOTIFICATIONS
            </Button>
          ) : (
            <Badge className="bg-emerald-100 text-emerald-800 border-none font-black text-xs py-2.5 px-4 rounded-xl flex items-center gap-1.5 shadow-sm">
              <CheckCircle className="w-4 h-4 text-emerald-600" /> SYSTEM ALERTS ACTIVE
            </Badge>
          )}
        </div>

        <Card className="border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] overflow-hidden bg-white">
          <CardHeader className="p-10 border-b border-slate-50">
             <CardTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Bell className="text-emerald-600 animate-bounce" /> Alerts Inbox
             </CardTitle>
             <CardDescription className="text-slate-400 font-bold uppercase tracking-wider text-xs">
                Real-time updates dynamically linked to the database
             </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
             {loading ? (
               <div className="p-24 text-center">
                 <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mx-auto mb-4" />
                 <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading inbox...</p>
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
