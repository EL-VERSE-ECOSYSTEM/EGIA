'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, FileText, Calendar, AlertCircle } from 'lucide-react'
import { checkWeeklyPaymentStatus, getAdultClasses } from '@/app/actions/adult-education'
import PaymentLock from '@/components/adult-education/payment-lock'

export default function AdultAssignmentsPage() {
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
          const list = await getAdultClasses('ASSIGNMENT')
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
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Adult Assignments & Assessments</h1>
          <p className="text-slate-500 font-medium text-lg">Test your skills and complete tasks assigned by your appointed teacher.</p>
        </div>

        {loading ? (
          <div className="p-24 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-amber-500 mx-auto mb-4" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Accessing desk...</p>
          </div>
        ) : !isPaid ? (
          <PaymentLock reason={lockReason} />
        ) : (
          <div className="space-y-6">
            {classes.length === 0 ? (
              <div className="p-20 bg-white rounded-[2.5rem] border border-slate-100 text-center text-slate-400">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="font-black text-lg">No assignments published yet.</p>
                <p className="text-sm font-medium mt-1">Assignments will appear here when posted by your teacher.</p>
              </div>
            ) : (
              classes.map((cls) => (
                <Card key={cls.id} className="border-none shadow-xl shadow-slate-100 rounded-3xl bg-white p-8">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="space-y-3 flex-1">
                      <Badge className="bg-emerald-100 text-emerald-800 border-none font-black text-[10px] tracking-wide rounded px-2.5 py-1">
                        ASSIGNMENT
                      </Badge>
                      <h3 className="text-xl font-black text-slate-900">{cls.title}</h3>
                      <p className="text-slate-500 text-sm font-semibold leading-relaxed">{cls.description}</p>

                      {cls.content && (
                        <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-semibold text-slate-700 leading-relaxed max-w-2xl">
                          {cls.content}
                        </div>
                      )}
                    </div>

                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center shrink-0 min-w-[140px] space-y-1">
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Due Date</p>
                      <p className="text-xs font-black text-red-600">
                        {cls.dueDate ? new Date(cls.dueDate).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'No Due Date'}
                      </p>
                    </div>
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
