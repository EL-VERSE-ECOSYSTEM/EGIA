'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, MonitorPlay, Play, Calendar } from 'lucide-react'
import { checkWeeklyPaymentStatus, getAdultClasses } from '@/app/actions/adult-education'
import PaymentLock from '@/components/adult-education/payment-lock'
import { ClassCommentsSection } from '@/components/comments/ClassCommentsSection'

export default function AdultVideoClassesPage() {
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
          const list = await getAdultClasses('VIDEO')
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
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Adult Video Classes & Sessions</h1>
          <p className="text-slate-500 font-medium text-lg">Watch interactive pre-recorded lessons prepared specifically for adult learners.</p>
        </div>

        {loading ? (
          <div className="p-24 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-amber-500 mx-auto mb-4" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading classroom...</p>
          </div>
        ) : !isPaid ? (
          <PaymentLock reason={lockReason} />
        ) : (
          <div className="space-y-10">
            {classes.length === 0 ? (
              <div className="p-20 bg-white rounded-[2.5rem] border border-slate-100 text-center text-slate-400">
                <MonitorPlay className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="font-black text-lg">No video lessons uploaded yet.</p>
                <p className="text-sm font-medium mt-1">Check back soon for new lecture uploads.</p>
              </div>
            ) : (
              classes.map((cls) => (
                <div key={cls.id} className="space-y-4">
                  <Card className="border-none shadow-xl shadow-slate-100 rounded-[2.5rem] bg-white overflow-hidden">
                    <CardContent className="p-8 space-y-4">
                      <div className="flex items-center justify-between">
                        <Badge className="bg-amber-100 text-amber-800 border-none font-black text-[10px] tracking-wide rounded uppercase px-2.5 py-1">
                          VIDEO LESSON
                        </Badge>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{new Date(cls.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-xl font-black text-slate-900 leading-tight">{cls.title}</h3>
                        <p className="text-slate-500 text-sm font-semibold leading-relaxed mt-2">{cls.description || 'No description provided.'}</p>
                      </div>

                      {cls.url && (
                        <a
                          href={cls.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-xs font-black text-amber-600 hover:text-amber-700 underline tracking-wide uppercase"
                        >
                          <Play className="w-4 h-4 fill-current" /> Watch Video Session
                        </a>
                      )}
                    </CardContent>
                  </Card>

                  {/* Comment Section for Adult Learners */}
                  <ClassCommentsSection
                    resourceType="ADULT_VIDEO"
                    resourceId={cls.id}
                    title={`Class Discussion — ${cls.title}`}
                    currentUserRole="PARENT"
                  />
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
