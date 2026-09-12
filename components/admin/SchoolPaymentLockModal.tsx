'use client'

import React, { useState } from 'react'
import { AlertTriangle, CreditCard, CheckCircle2, Loader2, ExternalLink } from 'lucide-react'
import { verifyKorapayPayment } from '@/app/actions/payments'

interface SchoolPaymentLockModalProps {
  schoolName: string
  paymentStatus: string
  paymentReference: string | null
  adminEmail: string
}

export function SchoolPaymentLockModal({
  schoolName,
  paymentStatus,
  paymentReference,
  adminEmail,
}: SchoolPaymentLockModalProps) {
  const [loading, setLoading] = useState(false)
  const [verificationResult, setVerificationResult] = useState<{
    status: string
    message: string
  } | null>(null)

  const defaultCheckoutLink = 'https://checkout.korapay.com/pay/BHba4zdsceZDgyW'
  const reference = paymentReference || `SCH_PAY_${Date.now()}`
  const checkoutUrl = `${defaultCheckoutLink}?reference=${encodeURIComponent(reference)}&amount=30161.25&customer_email=${encodeURIComponent(adminEmail)}`

  const handleVerify = async () => {
    if (!paymentReference) {
      setVerificationResult({
        status: 'error',
        message: 'No payment reference found for this school record. Please contact support.',
      })
      return
    }

    setLoading(true)
    setVerificationResult(null)

    try {
      const res = await verifyKorapayPayment(paymentReference)
      if (res.status === 'success') {
        setVerificationResult({
          status: 'success',
          message: 'Payment confirmed! Unlocking school admin portal…',
        })
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } else {
        setVerificationResult({
          status: 'pending',
          message: 'Payment is still pending. Please complete payment on Korapay Payment Gateway and click verify again.',
        })
      }
    } catch (err: any) {
      setVerificationResult({
        status: 'error',
        message: err.message || 'Payment verification failed. Please try again or contact support.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-red-500/60 rounded-[2.5rem] p-6 sm:p-10 max-w-lg w-full text-center space-y-6 shadow-2xl text-white relative overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="absolute top-0 left-0 h-3 bg-red-500 w-full" />
        <div className="w-20 h-20 rounded-full bg-red-500/20 border border-red-500 flex items-center justify-center mx-auto text-red-400 shadow-lg">
          <AlertTriangle className="w-10 h-10 animate-bounce" />
        </div>

        <div>
          <span className="bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] font-black uppercase tracking-widest px-3.5 py-1 rounded-full">
            Action Required • Registration Payment Pending
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white mt-3">{schoolName}</h2>
          <p className="text-slate-300 text-xs sm:text-sm font-medium mt-2 leading-relaxed">
            Your school registration payment status is currently{' '}
            <strong className="text-red-400 uppercase font-mono">{paymentStatus}</strong> in Supabase Database. Please complete the registration payment immediately to activate all school features.
          </p>
        </div>

        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl font-mono text-xs text-left space-y-2">
          <div className="flex justify-between border-b border-slate-800 pb-1.5">
            <span className="text-slate-400">Registration Fee:</span>
            <span className="font-bold text-white">NGN 30,000.00</span>
          </div>
          <div className="flex justify-between border-b border-slate-800 pb-1.5">
            <span className="text-slate-400">Korapay Gateway Fee:</span>
            <span className="font-bold text-white">NGN 161.25</span>
          </div>
          <div className="flex justify-between pt-1">
            <span className="text-slate-400 font-bold">Total Amount Due:</span>
            <span className="font-black text-emerald-400 text-sm">NGN 30,161.25</span>
          </div>
        </div>

        {verificationResult && (
          <div
            className={`p-3.5 rounded-xl text-xs font-bold leading-relaxed text-left border ${
              verificationResult.status === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            }`}
          >
            {verificationResult.status === 'success' ? (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{verificationResult.message}</span>
              </div>
            ) : (
              <span>{verificationResult.message}</span>
            )}
          </div>
        )}

        <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs font-bold text-amber-300 leading-relaxed text-left">
          ⚠️ <strong>Note:</strong> Modal cannot be closed until payment is completed or verified. If payment was made previously, click "Verify Completed Payment" below.
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={checkoutUrl}
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider text-center shadow-lg transition flex items-center justify-center gap-2"
            >
              <span>Pay NGN 30,161.25 Now</span>
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={handleVerify}
              disabled={loading}
              className="flex-1 py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <span>Verify Completed Payment</span>
              )}
            </button>
          </div>
          <a
            href="https://wa.me/2348061908715"
            target="_blank"
            rel="noreferrer"
            className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-black text-xs uppercase tracking-wider text-center transition border border-slate-700"
          >
            Contact EL VERSE Support
          </a>
        </div>
      </div>
    </div>
  )
}
