'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, BookMarked, Calendar } from 'lucide-react'
import { checkWeeklyPaymentStatus, getAdultClasses } from '@/app/actions/adult-education'
import PaymentLock from '@/components/adult-education/payment-lock'

export default function AdultSavedSessionsPage() {
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
          const list = await getAdultClasses('SAVED_SESSION')
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
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Saved Sessions & Resources</h1>
          <p className="text-slate-500 font-medium text-lg">Retrieve saved class summaries, study outlines, and lecture materials.</p>
        </div>

        {loading ? (
          <div className="p-24 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-amber-500 mx-auto mb-4" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Opening archive...</p>
          </div>
        ) : !isPaid ? (
          <PaymentLock reason={lockReason} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {classes.length === 0 ? (
              <div className="col-span-full p-20 bg-white rounded-[2.5rem] border border-slate-100 text-center text-slate-400">
                <BookMarked className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="font-black text-lg">No saved sessions or resources found.</p>
                <p className="text-sm font-medium mt-1">Supplementary resources will appear here once saved.</p>
              </div>
            ) : (
              classes.map((cls) => (
                <Card key={cls.id} className="border-none shadow-xl shadow-slate-100 rounded-[2.5rem] bg-white p-8 space-y-4 hover:shadow-2xl transition-all duration-300">
                  <Badge className="bg-purple-100 text-purple-800 border-none font-black text-[10px] tracking-wide rounded uppercase px-2.5 py-1">
                    RESOURCE OUTLINE
                  </Badge>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 leading-tight">{cls.title}</h3>
                    <p className="text-slate-500 text-xs font-semibold leading-relaxed mt-2">{cls.description}</p>
                  </div>
                  {cls.content && (
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-semibold text-slate-700 leading-relaxed">
                      {cls.content}
                    </div>
                  )}
                  {cls.url && (
                    <a
                      href={cls.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-xs font-black text-purple-600 hover:text-purple-700 underline tracking-wide uppercase"
                    >
                      Access Saved Outline Link
                    </a>
                  )}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-50 text-[10px] text-slate-400 font-bold">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Saved on {new Date(cls.createdAt).toLocaleDateString()}</span>
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
