'use client'

import React, { useState } from 'react'
import { AlertTriangle, CheckCircle2, Loader2, ExternalLink } from 'lucide-react'
import { verifyPaystackPayment } from '@/app/actions/payments'
import { initializeSchoolRegistrationPaymentAction } from '@/app/actions/school'
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'

interface SchoolPaymentLockModalProps {
  schoolName: string
  adminEmail: string
  schoolId: string | null
  paymentStatus: string
  paymentReference: string | null
  schoolCode?: string
}

type SchoolPaymentRealtimeRow = Record<string, unknown> & {
  id?: string
  paymentreference?: string | null
  paymentstatus?: string
  code?: string | null
}

function isSchoolPaymentRealtimeRow(value: unknown): value is SchoolPaymentRealtimeRow {
  return typeof value === 'object' && value !== null &&
    'id' in value && typeof value.id === 'string' &&
    'paymentstatus' in value && typeof value.paymentstatus === 'string'
}

export function SchoolPaymentLockModal({
  schoolName,
  adminEmail,
  schoolId,
  paymentStatus: initialStatus,
  paymentReference,
  schoolCode: initialSchoolCode,
}: SchoolPaymentLockModalProps) {
  const [loading, setLoading] = useState(false)
  const [currentStatus, setCurrentStatus] = useState(initialStatus)
  const [currentReference, setCurrentReference] = useState(paymentReference)
  const [confirmedSchoolCode, setConfirmedSchoolCode] = useState<string | null>(initialSchoolCode || null)
  const [verificationResult, setVerificationResult] = useState<{
    status: string
    message: string
    schoolCode?: string
  } | null>(null)

  // Real-time synchronization with Supabase Database school table
  useRealtimeSubscription('school', (payload) => {
    const row = payload.new
    if (isSchoolPaymentRealtimeRow(row) && row.id === schoolId) {
      if (row.paymentreference) setCurrentReference(row.paymentreference)
      if (row.paymentstatus === 'PAID') {
        setCurrentStatus('PAID')
        if (row.code) setConfirmedSchoolCode(row.code)
        setVerificationResult({
          status: 'success',
          message: 'Payment confirmed in real-time! Unlocking school admin portal…',
          schoolCode: row.code || confirmedSchoolCode || undefined,
        })
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } else if (row.paymentstatus === 'FAILED') {
        setCurrentStatus('FAILED')
        setVerificationResult({
          status: 'error',
          message: 'Payment was not confirmed. You can retry securely below.',
        })
      } else if (row.paymentstatus === 'PENDING') {
        setCurrentStatus('PENDING')
      }
    }
  }, { filter: schoolId ? `id=eq.${schoolId}` : undefined })

  // If already paid in real time state, do not render modal
  if (currentStatus === 'PAID') {
    return null
  }

  const handleBeginPayment = async () => {
    if (!schoolId) {
      setVerificationResult({ status: 'error', message: 'School record is unavailable. Please contact support.' })
      return
    }

    setLoading(true)
    setVerificationResult(null)
    try {
      const result = await initializeSchoolRegistrationPaymentAction(schoolId)
      setCurrentReference(result.reference)
      window.location.assign(result.checkoutUrl)
    } catch (error) {
      setVerificationResult({
        status: 'error',
        message: error instanceof Error ? error.message : 'Payment could not be started.',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    if (!currentReference) {
      setVerificationResult({
        status: 'error',
        message: 'No payment reference found for this school record. Please contact support.',
      })
      return
    }

    setLoading(true)
    setVerificationResult(null)

    try {
      const res = await verifyPaystackPayment(currentReference)
      if (res.status === 'success') {
        setCurrentStatus('PAID')
        if (res.schoolCode) setConfirmedSchoolCode(res.schoolCode)
        setVerificationResult({
          status: 'success',
          message: 'Payment confirmed! Unlocking school admin portal…',
          schoolCode: res.schoolCode,
        })
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } else {
        setVerificationResult({
          status: 'pending',
          message: 'Payment is still pending. Complete the payment and check again.',
        })
      }
    } catch (err: unknown) {
      setVerificationResult({
        status: 'error',
        message: err instanceof Error
          ? err.message
          : 'Payment verification failed. Please try again or contact support.',
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
            <strong className="text-red-400 uppercase font-mono">{currentStatus}</strong> in Supabase Database. Please complete the registration payment immediately to activate all school features.
          </p>
        </div>

        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl font-mono text-xs text-left space-y-2">
          <div className="flex justify-between gap-4 border-b border-slate-800 pb-1.5">
            <span className="text-slate-400 shrink-0">School Admin Email:</span>
            <a href={`mailto:${adminEmail}`} className="font-bold text-blue-300 break-all text-right">
              {adminEmail || 'Not available'}
            </a>
          </div>
          <div className="flex justify-between border-b border-slate-800 pb-1.5">
            <span className="text-slate-400">Registration Fee:</span>
            <span className="font-bold text-white">NGN 30,000.00</span>
          </div>
          <div className="flex justify-between border-b border-slate-800 pb-1.5">
            <span className="text-slate-400">Payment Processing Fee:</span>
            <span className="font-bold text-white">NGN 161.25</span>
          </div>
          <div className="flex justify-between pt-1">
            <span className="text-slate-400 font-bold">Total Amount Due:</span>
            <span className="font-black text-emerald-400 text-sm">NGN 30,161.25</span>
          </div>
        </div>

        {(verificationResult || confirmedSchoolCode) && (
          <div
            className={`p-3.5 rounded-xl text-xs font-bold leading-relaxed text-left border ${
              verificationResult?.status === 'success' || confirmedSchoolCode
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            }`}
          >
            {(verificationResult?.status === 'success' || confirmedSchoolCode) ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{verificationResult?.message || 'Payment confirmed successfully!'}</span>
                </div>
                {(verificationResult?.schoolCode || confirmedSchoolCode) && (
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-emerald-500/40 mt-2">
                    <p className="text-[10px] uppercase font-bold text-emerald-400/80">Your Official School Registration Code</p>
                    <p className="text-base font-mono font-black text-emerald-400 tracking-wider">
                      {verificationResult?.schoolCode || confirmedSchoolCode}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <span>{verificationResult?.message}</span>
            )}
          </div>
        )}

        <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs font-bold text-amber-300 leading-relaxed text-left">
          ⚠️ <strong>Note:</strong> This modal stays open until the payment is confirmed in the database.
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleBeginPayment}
              disabled={loading}
              className="flex-1 py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider text-center shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Pay NGN 30,161.25</span>}
              <ExternalLink className="w-4 h-4" />
            </button>
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
