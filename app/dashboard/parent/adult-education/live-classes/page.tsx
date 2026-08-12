'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, Video, Calendar, ExternalLink } from 'lucide-react'
import { checkWeeklyPaymentStatus, getAdultClasses } from '@/app/actions/adult-education'
import PaymentLock from '@/components/adult-education/payment-lock'

export default function AdultLiveClassesPage() {
  const [loading, setLoading] = useState(true)
  const [isPaid, setIsPaid] = useState(false)
  const [lockReason, setLockReason] = useState('')
  const [classes, setClasses] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      try {
        const status = await checkWeeklyPaymentStatus()
        setIsPaid(status.isPaid)
        if (!status.isPaid) {
          setLockReason(status.reason || '')
        } else {
          const list = await getAdultClasses('LIVE')
          setClasses(list || [])
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <DashboardLayout role="parent">
      <div className="p-8 max-w-7xl mx-auto space-y-10 min-h-screen">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Adult Live Online Classes</h1>
          <p className="text-slate-500 font-medium text-lg">Join active live tutoring sessions and interact with your teacher in real-time.</p>
        </div>

        {loading ? (
          <div className="p-24 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-amber-500 mx-auto mb-4" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Awaiting broadcast...</p>
          </div>
        ) : !isPaid ? (
          <PaymentLock reason={lockReason} />
        ) : (
          <div className="space-y-6">
            {classes.length === 0 ? (
              <div className="p-20 bg-white rounded-[2.5rem] border border-slate-100 text-center text-slate-400">
                <Video className="w-12 h-12 text-slate-300 mx-auto mb-4 animate-pulse" />
                <p className="font-black text-lg">No active live streams or video classes scheduled.</p>
                <p className="text-sm font-medium mt-1">Schedules will appear here once live links are posted.</p>
              </div>
            ) : (
              classes.map((cls) => (
                <Card key={cls.id} className="border-none shadow-xl shadow-slate-100 rounded-3xl bg-white p-8">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                    <div className="space-y-3">
                      <Badge className="bg-red-100 text-red-800 border-none font-black text-[10px] tracking-wide rounded uppercase px-2.5 py-1">
                        LIVE LECTURE
                      </Badge>
                      <h3 className="text-xl font-black text-slate-900">{cls.title}</h3>
                      <p className="text-slate-500 text-sm font-semibold leading-relaxed">{cls.description}</p>

                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Scheduled: {new Date(cls.createdAt).toLocaleDateString()} at {new Date(cls.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    {cls.url && (
                      <a
                        href={cls.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto"
                      >
                        <Button className="w-full sm:w-auto h-12 px-6 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl text-xs flex items-center gap-2">
                          <ExternalLink className="w-4 h-4" /> JOIN LIVE ROOM
                        </Button>
                      </a>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
