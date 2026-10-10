'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { AlertCircle, Calendar, ShieldAlert, Sparkles, RefreshCw, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ParentFeesStructurePage() {
  const [feeStructures, setFeeStructures] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchFeeStructures = async () => {
    try {
      const response = await fetch('/api/payments/fees-structure')
      if (response.ok) {
        const data = await response.json()
        setFeeStructures(data.feeStructures || [])
      }
    } catch {
      // fallback
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFeeStructures()

    const supabase = createClient()
    const channel = supabase
      .channel('parent-fee-structure-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fee_structure' }, () => {
        fetchFeeStructures()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const now = new Date()

  return (
    <DashboardLayout role="parent">
      <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-8 font-sans">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs font-black uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" /> Real-Time Parent Fee Structure & Warning Monitor
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">School Fee Schedule</h1>
            <p className="text-slate-500 text-sm font-medium mt-1">
              View official school fee schedules and real-time payment warning notices for your wards.
            </p>
          </div>
          <Button onClick={fetchFeeStructures} variant="outline" className="rounded-2xl font-bold text-xs gap-2">
            <RefreshCw className="w-4 h-4 animate-spin-hover" /> Refresh List
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {feeStructures.map((f) => {
            const warningDate = f.warningDate ? new Date(f.warningDate) : null
            const dueDate = f.dueDate ? new Date(f.dueDate) : null
            const isPastWarning = warningDate && now >= warningDate

            return (
              <Card
                key={f.id}
                className={`border-2 transition-all rounded-3xl overflow-hidden shadow-lg ${
                  isPastWarning ? 'border-rose-500 bg-rose-50/20' : 'border-slate-200 bg-white'
                }`}
              >
                <CardContent className="p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider">
                        Class: {f.class}
                      </span>
                      {f.department && (
                        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-wider border border-slate-200">
                          {f.department}
                        </span>
                      )}
                      {isPastWarning && (
                        <span className="px-3 py-1 rounded-full bg-rose-500 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 animate-pulse">
                          <ShieldAlert className="w-3 h-3" /> Fee Payment Warning Active
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl font-black text-slate-900">{f.feeType}</h3>
                    {f.description && <p className="text-xs text-slate-500 font-medium">{f.description}</p>}

                    <div className="flex flex-wrap items-center gap-4 text-xs font-bold pt-2">
                      {dueDate && (
                        <span className="flex items-center gap-1.5 text-slate-600">
                          <Calendar className="w-4 h-4 text-slate-400" /> Due Date: {dueDate.toLocaleDateString()}
                        </span>
                      )}
                      {warningDate && (
                        <span className={`flex items-center gap-1.5 ${isPastWarning ? 'text-rose-600 font-black' : 'text-amber-600'}`}>
                          <AlertCircle className="w-4 h-4" /> Warning Date: {warningDate.toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-left md:text-right border-t md:border-t-0 pt-4 md:pt-0 border-slate-200">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Fee Amount</p>
                    <p className="text-2xl sm:text-3xl font-black text-emerald-600">
                      ₦{Number(f.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </DashboardLayout>
  )
}
