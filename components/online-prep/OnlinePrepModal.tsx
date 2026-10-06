'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sparkles, CreditCard, ShieldCheck, Lock, ExternalLink, Loader2, CheckCircle2 } from 'lucide-react'
import {
  getPrepSubscriptionStatusAction,
  initializePrepSubscriptionAction,
  verifyPrepSubscriptionPaymentAction,
} from '@/app/actions/online-prep'

export function OnlinePrepModal() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<any>(null)

  // Form State
  const [accessCode, setAccessCode] = useState('')
  const [checkoutUrl, setCheckoutUrl] = useState('')
  const [paymentRef, setPaymentRef] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await getPrepSubscriptionStatusAction()
        setStatus(res)
        if (res.isEligibleClass && (!res.isSubscribed || res.expired)) {
          setOpen(true)
        }
      } catch (err) {
        console.warn('Failed to check prep subscription status:', err)
      } finally {
        setLoading(false)
      }
    }
    checkStatus()
  }, [])

  if (loading || !open) return null

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accessCode || accessCode.trim().length < 3) {
      setError('Username access code must be at least 3 characters long.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const res = await initializePrepSubscriptionAction({ accessCode })
      if (!res.success || !res.checkoutUrl) {
        setError(res.error || 'Failed to initialize payment checkout.')
        setSubmitting(false)
        return
      }

      setCheckoutUrl(res.checkoutUrl)
      setPaymentRef(res.paymentReference || '')
    } catch (err: any) {
      setError(err.message || 'Payment initialization error.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleVerifyPayment = async () => {
    if (!paymentRef) return
    setVerifying(true)
    setError('')

    try {
      const res = await verifyPrepSubscriptionPaymentAction(paymentRef, accessCode)
      if (!res.success) {
        setError(res.error || 'Payment verification failed on gateway.')
        setVerifying(false)
        return
      }

      setSuccess('Subscription activated successfully for 3 weeks!')
      setTimeout(() => {
        setOpen(false)
        window.location.reload()
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Verification error.')
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in duration-300">
      <Card className="border border-white/20 bg-white/10 shadow-2xl backdrop-blur-3xl rounded-[2.5rem] p-8 max-w-lg w-full text-white space-y-6 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-black uppercase tracking-widest">
            <Sparkles className="w-4 h-4" />
            <span>EXAM PREP LESSONS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Registration for SSS3/SSS2 Online Lessons
          </h2>
          <p className="text-xs font-bold text-slate-300 leading-relaxed">
            WAEC, NECO & JAMB Intensive Practice Questions & Video Classes. (Science, Arts/Humanities & Commercial). Fee: NGN 3,161.25 per 3 weeks via Korapay.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold text-center flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{success}</span>
          </div>
        )}

        {!checkoutUrl ? (
          <form onSubmit={handleSubscribe} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="accessCode" className="text-xs font-black uppercase text-slate-300">
                Choose Access Username / Code *
              </Label>
              <Input
                id="accessCode"
                type="text"
                placeholder="e.g. john_prep2026"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                required
                className="bg-slate-950/70 border-white/20 text-white placeholder:text-slate-500 rounded-2xl h-12 text-sm font-bold text-center tracking-wider"
              />
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-orange-600 hover:bg-orange-500 text-white h-14 rounded-2xl font-black text-xs uppercase tracking-wider shadow-xl shadow-orange-600/20"
            >
              {submitting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>INITIALIZING KORAPAY...</span>
                </div>
              ) : (
                <span>PAY NGN 3,161.25 FOR 3 WEEKS</span>
              )}
            </Button>
          </form>
        ) : (
          <div className="space-y-4 text-center">
            <div className="p-4 bg-slate-950/80 border border-white/20 rounded-2xl space-y-3">
              <p className="text-xs font-bold text-slate-300">Click below to complete subscription payment via Korapay:</p>
              <a
                href={checkoutUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs uppercase tracking-wider shadow-xl transition"
              >
                <span>Korapay Checkout</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            <Button
              onClick={handleVerifyPayment}
              disabled={verifying}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white h-12 rounded-2xl font-black text-xs uppercase tracking-wider"
            >
              {verifying ? 'VERIFYING PAYMENT...' : 'VERIFY & ACTIVATE SUBSCRIPTION'}
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
