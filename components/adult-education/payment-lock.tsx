'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Lock, AlertTriangle, ShieldCheck } from 'lucide-react'
import { payAdultWeekly } from '@/app/actions/adult-education'
import { toast } from 'sonner'

export default function PaymentLock({ reason }: { reason?: string }) {
  const [submitting, setSubmitting] = useState(false)

  const handlePay = async () => {
    setSubmitting(true)
    try {
      await payAdultWeekly()
      toast.success('Weekly payment paid successfully! Content is now unlocked.')
      window.location.reload()
    } catch (err: any) {
      toast.error(err.message || 'Payment failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 max-w-xl mx-auto min-h-[50vh] text-center">
      <Card className="border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] bg-slate-900 text-white overflow-hidden p-8 w-full">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Lock className="w-8 h-8 animate-bounce" />
        </div>

        <h2 className="text-2xl font-black mb-2">Classroom Locked</h2>
        <p className="text-slate-400 text-sm font-semibold max-w-sm mx-auto mb-6">
          {reason || 'Please complete your weekly Adult Education subscription of ₦2,000 to unlock classes and assignments.'}
        </p>

        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-xs font-semibold flex items-center gap-3 text-left mb-6 text-slate-300">
          <AlertTriangle className="text-amber-500 w-5 h-5 shrink-0" />
          <span>If you have already paid, your access will be instantly updated. Click the button below to process payment from your wallet.</span>
        </div>

        <Button
          onClick={handlePay}
          disabled={submitting}
          className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-sm"
        >
          {submitting ? <Loader2 className="animate-spin w-5 h-5" /> : 'PAY WEEKLY SUBSCRIPTION (₦2,000)'}
        </Button>
      </Card>
    </div>
  )
}
