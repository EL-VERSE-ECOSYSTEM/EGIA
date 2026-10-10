'use client'

import React, { useEffect, useState } from 'react'
import { AlertTriangle, ShieldAlert, CreditCard, Clock, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  getSchoolRegistrationRenewalStatusAction,
  initializeSchoolRenewalPaymentAction,
  confirmSchoolRenewalPaymentAction,
} from '@/app/actions/school'
import { toast } from 'sonner'

export function SchoolRenewalReminderWidget({ schoolId }: { schoolId?: string | null }) {
  const [statusData, setStatusData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [paying, setPaying] = useState(false)
  const [dismissedToday, setDismissedToday] = useState(false)

  useEffect(() => {
    if (!schoolId) return

    // Check if dismissed today
    const lastDismissed = localStorage.getItem(`school_renewal_dismiss_${schoolId}`)
    if (lastDismissed === new Date().toISOString().slice(0, 10)) {
      setDismissedToday(true)
    }

    const checkRenewal = async () => {
      // Handle renewal payment return reference if present in URL
      const urlParams = new URLSearchParams(window.location.search)
      const rRef = urlParams.get('renewal_reference')
      if (rRef) {
        setPaying(true)
        try {
          const cRes = await confirmSchoolRenewalPaymentAction(rRef)
          if (cRes.success) {
            toast.success('School Registration Fee successfully renewed for 2 months!')
            // Remove parameter from URL
            window.history.replaceState({}, document.title, window.location.pathname)
          } else {
            toast.error(cRes.error || 'Failed to confirm renewal payment.')
          }
        } catch {
          toast.error('Payment confirmation error.')
        } finally {
          setPaying(false)
        }
      }

      const res = await getSchoolRegistrationRenewalStatusAction(schoolId)
      if (res.success) {
        setStatusData(res)
      }
    }

    checkRenewal()
  }, [schoolId])

  if (!statusData) return null

  const { isLockedOut, isWarningPeriod, daysRemaining, dueAt } = statusData

  const handlePayRenewal = async () => {
    if (!schoolId) return
    setPaying(true)
    try {
      const pRes = await initializeSchoolRenewalPaymentAction(schoolId)
      if (pRes.success && pRes.checkoutUrl) {
        window.location.href = pRes.checkoutUrl
      } else {
        toast.error((pRes as any).error || 'Unable to initialize renewal checkout.')
        setPaying(false)
      }
    } catch {
      toast.error('An error occurred during renewal checkout.')
      setPaying(false)
    }
  }

  const handleDismissDaily = () => {
    if (schoolId) {
      localStorage.setItem(`school_renewal_dismiss_${schoolId}`, new Date().toISOString().slice(0, 10))
    }
    setDismissedToday(true)
  }

  // 1. Mandatory Unclosable Lockout Screen for Overdue School Registration
  if (isLockedOut) {
    return (
      <div className="fixed inset-0 z-[999] bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center p-4">
        <Card className="max-w-lg w-full bg-slate-900 border-rose-500/30 text-white shadow-2xl rounded-3xl overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="p-8 space-y-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/10">
              <ShieldAlert className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-black uppercase tracking-widest border border-rose-500/30">
                School Account Locked
              </span>
              <h2 className="text-2xl font-black tracking-tight text-white">
                Bi-Monthly Registration Fee Overdue
              </h2>
              <p className="text-xs text-slate-300 font-medium leading-relaxed max-w-md mx-auto">
                Your 2-month school registration fee subscription expired on{' '}
                <strong className="text-rose-400">{new Date(dueAt).toLocaleDateString()}</strong>.
                Access to the School Admin Portal is restricted until the bi-monthly fee of <strong>NGN 30,161.25</strong> is renewed.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-left space-y-2 text-xs font-semibold text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Fee Amount:</span>
                <span className="font-bold text-white">NGN 30,000.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Gateway Processing Fee:</span>
                <span className="font-bold text-white">NGN 161.25</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between font-black text-sm text-emerald-400">
                <span>Total Due:</span>
                <span>NGN 30,161.25</span>
              </div>
            </div>

            <Button
              onClick={handlePayRenewal}
              disabled={paying}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black h-13 rounded-2xl shadow-xl shadow-emerald-600/20 text-sm flex items-center justify-center gap-2"
            >
              {paying ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>INITIALIZING KORAPAY CHECKOUT...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  <span>PAY NOW VIA KORAPAY (NGN 30,161.25)</span>
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // 2. Daily Warning Popup Banner when within 14 Days of Expiration
  if (isWarningPeriod && !dismissedToday) {
    return (
      <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 z-50 max-w-md w-full bg-slate-900 border border-amber-500/30 text-white p-5 rounded-3xl shadow-2xl animate-in slide-in-from-bottom-5 duration-300">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                Renewal Due in {daysRemaining} Day{daysRemaining === 1 ? '' : 's'}
              </span>
              <button
                onClick={handleDismissDaily}
                className="text-slate-400 hover:text-white text-xs font-bold transition-colors"
              >
                Dismiss Today
              </button>
            </div>
            <p className="text-xs font-bold text-slate-100">
              School Registration Renewal Reminder
            </p>
            <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
              Your bi-monthly school registration subscription will expire on{' '}
              <strong>{new Date(dueAt).toLocaleDateString()}</strong>. Renew now to prevent system lockout.
            </p>
            <div className="pt-2">
              <Button
                onClick={handlePayRenewal}
                disabled={paying}
                size="sm"
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 h-9"
              >
                {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                <span>Renew Now (NGN 30,161.25)</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
