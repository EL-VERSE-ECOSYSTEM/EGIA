'use client'

import React, { useEffect, useState } from 'react'
import { ShieldAlert, CreditCard, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  getStudentRegistrationStatusAction,
  renewStudentRegistrationFeeAction,
} from '@/app/actions/payments'
import { toast } from 'sonner'

export function StudentRegistrationLockoutWidget({ studentId }: { studentId?: string | null }) {
  const [statusData, setStatusData] = useState<any>(null)
  const [paying, setPaying] = useState(false)

  useEffect(() => {
    const checkStatus = async () => {
      const res = await getStudentRegistrationStatusAction(studentId || undefined)
      if (res.success) {
        setStatusData(res)
      }
    }
    checkStatus()
  }, [studentId])

  if (!statusData || !statusData.isLockedOut) return null

  const handlePayRenewal = async () => {
    const targetId = studentId || statusData.student?.id
    if (!targetId) return
    setPaying(true)
    try {
      const pRes = await renewStudentRegistrationFeeAction(targetId)
      if (pRes.success && pRes.checkoutUrl) {
        window.location.href = pRes.checkoutUrl
      } else {
        toast.error('Unable to initialize registration renewal payment.')
        setPaying(false)
      }
    } catch {
      toast.error('An error occurred during checkout.')
      setPaying(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[999] bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-slate-900 border-amber-500/30 text-white shadow-2xl rounded-3xl overflow-hidden">
        <div className="p-8 space-y-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
            <ShieldAlert className="w-9 h-9" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase tracking-widest border border-amber-500/30">
              Student Registration Due
            </span>
            <h2 className="text-2xl font-black tracking-tight text-white">
              4-Month Registration Renewal Required
            </h2>
            <p className="text-xs text-slate-300 font-medium leading-relaxed">
              Student/Pupil account registration is renewed every 4 months. Your subscription expired on{' '}
              <strong className="text-amber-400">{new Date(statusData.dueAt).toLocaleDateString()}</strong>.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-left space-y-2 text-xs font-semibold text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Registration Renewal Fee:</span>
              <span className="font-bold text-white">NGN 2,000.00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Korapay Gateway Fee:</span>
              <span className="font-bold text-white">NGN 161.25</span>
            </div>
            <div className="pt-2 border-t border-slate-800 flex justify-between font-black text-sm text-amber-400">
              <span>Total Amount:</span>
              <span>NGN 2,161.25</span>
            </div>
          </div>

          <Button
            onClick={handlePayRenewal}
            disabled={paying}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black h-12 rounded-2xl shadow-xl shadow-amber-500/20 text-xs flex items-center justify-center gap-2"
          >
            {paying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>REDIRECTING TO KORAPAY...</span>
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                <span>RENEW REGISTRATION (NGN 2,161.25)</span>
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  )
}
