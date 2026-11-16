'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, Clock3, XCircle } from 'lucide-react'
import { SVGLoader } from '@/components/ui/svg-loader'
import { verifyPaystackPayment } from '@/app/actions/payments'

function PaymentReturnContent() {
  const searchParams = useSearchParams()
  const reference = searchParams.get('reference') || searchParams.get('payment_reference') || ''
  const [state, setState] = useState<'loading' | 'success' | 'pending' | 'failed' | 'error'>('loading')
  const [message, setMessage] = useState('Confirming your payment securely…')
  const [showModal, setShowModal] = useState(false)
  const [paymentDetails, setPaymentDetails] = useState<{ amount?: string; feeType?: string; schoolCode?: string; schoolName?: string } | null>(null)

  const verifyPayment = useCallback(async () => {
    if (!reference) {
      setState('error')
      setMessage('No payment reference was supplied.')
      setShowModal(true)
      return
    }
    setState('loading')
    setShowModal(false)
    setMessage('Confirming your payment securely…')
    try {
      const result = await verifyPaystackPayment(reference)
      const resultDetails = result as typeof result & { schoolCode?: string; schoolName?: string }
      const rawStatus = String(result.status || '').toLowerCase()
      const resStatus = rawStatus === 'success'
        ? 'success'
        : ['pending', 'ongoing', 'processing'].includes(rawStatus)
          ? 'pending'
          : 'failed'
      setState(resStatus)
      if (result.payment || resultDetails.schoolCode || resultDetails.schoolName) {
        setPaymentDetails({
          amount: result.payment?.amount || (resultDetails.schoolCode ? '30161.25' : undefined),
          feeType: result.payment?.feeType || undefined,
          schoolCode: resultDetails.schoolCode,
          schoolName: resultDetails.schoolName
        })
      }
      if (resStatus === 'success') {
        setMessage('Your payment has been confirmed. The payment ledger and linked account notifications have been updated.')
      } else if (resStatus === 'pending') {
        setMessage('Your payment is still being processed. Please check again shortly.')
      } else {
        setMessage(result.error || 'We could not confirm this payment. No successful payment was recorded.')
      }
    } catch (error) {
      setState('error')
      setMessage(error instanceof Error ? error.message : 'Payment verification could not be completed.')
    } finally {
      setShowModal(true)
    }
  }, [reference])

  useEffect(() => {
    void verifyPayment()
  }, [verifyPayment])

  const handlePrintReceipt = () => {
    window.print()
  }

  const Icon = state === 'success' ? CheckCircle2 : state === 'pending' || state === 'loading' ? Clock3 : XCircle
  const statusStyles = state === 'success'
    ? { color: 'emerald', label: 'PAYMENT SUCCESSFUL' }
    : state === 'pending' || state === 'loading'
      ? { color: 'amber', label: 'PAYMENT PROCESSING' }
      : { color: 'red', label: state === 'error' ? 'VERIFICATION ERROR' : 'PAYMENT FAILED' }

  return (
    <main className="min-h-screen grid place-items-center bg-slate-950 p-5 relative text-white">
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md animate-in fade-in duration-300">
          <div className={`relative w-full max-w-lg space-y-6 overflow-hidden rounded-[2rem] border bg-slate-900 p-8 text-center shadow-2xl animate-in zoom-in-95 duration-300 ${statusStyles.color === 'emerald' ? 'border-emerald-500/50' : statusStyles.color === 'amber' ? 'border-amber-500/50' : 'border-red-500/50'}`}>
            <div className={`absolute left-0 top-0 h-1.5 w-full ${statusStyles.color === 'emerald' ? 'bg-emerald-500' : statusStyles.color === 'amber' ? 'bg-amber-500' : 'bg-red-500'}`} />
            <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full shadow-lg ${statusStyles.color === 'emerald' ? 'border border-emerald-500 bg-emerald-500/20 text-emerald-400' : statusStyles.color === 'amber' ? 'border border-amber-500 bg-amber-500/20 text-amber-400' : 'border border-red-500 bg-red-500/20 text-red-400'}`}>
              <Icon className={`h-12 w-12 ${state === 'pending' ? 'animate-pulse' : ''} ${state === 'success' ? 'animate-in zoom-in duration-500' : ''}`} />
            </div>
            <div>
              <span className={`inline-flex rounded-full border px-3.5 py-1 text-[10px] font-black uppercase tracking-widest ${statusStyles.color === 'emerald' ? 'border-emerald-500/30 bg-emerald-500/20 text-emerald-300' : statusStyles.color === 'amber' ? 'border-amber-500/30 bg-amber-500/20 text-amber-300' : 'border-red-500/30 bg-red-500/20 text-red-300'}`}>
                {statusStyles.label}
              </span>
              <h2 className="mt-3 text-3xl font-black text-white">{state === 'success' ? 'Transaction Confirmed' : state === 'pending' ? 'We’re checking your payment' : 'Payment not confirmed'}</h2>
              <p className="mt-2 text-sm font-medium leading-relaxed text-slate-400">{message}</p>
              <p className="mt-2 text-xs font-bold text-slate-500">Ref: <span className="font-mono text-slate-300">{reference || 'Not provided'}</span></p>
            </div>

            <div className="space-y-2.5 rounded-2xl border border-slate-800 bg-slate-950 p-5 text-left font-mono text-xs font-semibold text-slate-300">
              <p className="flex justify-between border-b border-slate-800 pb-1.5"><span>Status:</span> <span className={statusStyles.color === 'emerald' ? 'font-black text-emerald-400' : statusStyles.color === 'amber' ? 'font-black text-amber-400' : 'font-black text-red-400'}>{statusStyles.label}</span></p>
              {paymentDetails?.amount && <p className="flex justify-between border-b border-slate-800 pb-1.5"><span>Amount:</span> <span className="font-bold text-white">NGN {Number(paymentDetails.amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span></p>}
              {paymentDetails?.schoolCode && (
                <p className="flex justify-between border-b border-slate-800 pb-1.5"><span className="text-blue-400 font-bold">School Registration Code:</span> <span className="font-black text-blue-400 text-sm tracking-wider">{paymentDetails.schoolCode}</span></p>
              )}
              {paymentDetails?.schoolName && (
                <p className="flex justify-between border-b border-slate-800 pb-1.5"><span>School Name:</span> <span className="font-bold text-white">{paymentDetails.schoolName}</span></p>
              )}
              {paymentDetails?.feeType && <p className="flex justify-between"><span>Fee Type:</span> <span className="font-bold uppercase text-orange-400">{paymentDetails.feeType}</span></p>}
              <p className="flex justify-between"><span>Payment Method:</span> <span className="font-bold text-blue-400">Online payment</span></p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              {state === 'success' ? (
                <>
                  <button onClick={handlePrintReceipt} className="flex h-12 flex-1 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800 text-xs font-black text-white transition hover:bg-slate-700">Print receipt</button>
                  <Link href="/dashboard/parent/payments/history" className="flex h-12 flex-1 items-center justify-center rounded-2xl bg-emerald-600 text-xs font-black text-white shadow-lg transition hover:bg-emerald-500">View payment history</Link>
                </>
              ) : state === 'pending' ? (
                <>
                  <button onClick={() => setShowModal(false)} className="h-12 flex-1 rounded-2xl border border-slate-700 bg-slate-800 text-xs font-black text-white hover:bg-slate-700">Close</button>
                  <button onClick={() => void verifyPayment()} className="h-12 flex-1 rounded-2xl bg-amber-500 text-xs font-black text-slate-950 hover:bg-amber-400">Check payment again</button>
                </>
              ) : (
                <>
                  <button onClick={() => setShowModal(false)} className="h-12 flex-1 rounded-2xl border border-slate-700 bg-slate-800 text-xs font-black text-white hover:bg-slate-700">Close</button>
                  <Link href="/dashboard/parent/payments/make-payment" className="flex h-12 flex-1 items-center justify-center rounded-2xl bg-red-600 text-xs font-black text-white hover:bg-red-500">Return to payment portal</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <section className="max-w-md w-full rounded-3xl bg-slate-900 border border-slate-800 p-8 text-center shadow-xl space-y-5">
        <div className={state === 'success' ? 'text-emerald-400' : state === 'pending' || state === 'loading' ? 'text-amber-400' : 'text-red-400'}>
          {state === 'loading' ? <SVGLoader /> : <Icon className="w-14 h-14 mx-auto" />}
        </div>
        <h1 className="text-2xl font-black text-white">Payment Verification</h1>
        <p className="text-slate-400 text-sm font-medium leading-relaxed">{message}</p>
        <div className="flex justify-center gap-3 pt-2">
          <Link className="rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-3 text-xs font-black text-white uppercase tracking-wider transition" href="/auth/signin">Sign In</Link>
          <Link className="rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 px-5 py-3 text-xs font-black text-slate-300 uppercase tracking-wider transition" href="/dashboard/parent/payments/history">Payment History</Link>
        </div>
      </section>
    </main>
  )
}

export default function PaymentReturnPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen grid place-items-center bg-slate-950 p-5 text-white">
        <SVGLoader />
      </div>
    }>
      <PaymentReturnContent />
    </Suspense>
  )
}
