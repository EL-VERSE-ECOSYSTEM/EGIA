'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, Clock3, XCircle } from 'lucide-react'
import { SVGLoader } from '@/components/ui/svg-loader'
import { verifyKorapayPayment } from '@/app/actions/payments'

function KorapayReturnContent() {
  const searchParams = useSearchParams()
  const reference = searchParams.get('reference') || searchParams.get('payment_reference') || ''
  const [state, setState] = useState<'loading' | 'success' | 'pending' | 'failed' | 'error'>('loading')
  const [message, setMessage] = useState('Confirming your payment securely with Korapay…')
  const [showModal, setShowModal] = useState(false)
  const [countdown, setCountdown] = useState(10)
  const [paymentDetails, setPaymentDetails] = useState<{ amount?: string; feeType?: string } | null>(null)

  useEffect(() => {
    if (!reference) {
      setState('error')
      setMessage('No Korapay payment reference was supplied.')
      return
    }
    verifyKorapayPayment(reference)
      .then(result => {
        setState(result.status)
        if (result.payment) {
          setPaymentDetails({ amount: result.payment.amount, feeType: result.payment.feeType })
        }
        if (result.status === 'success') {
          setMessage('Payment confirmed. Your account and transaction history are updated in real time with Supabase Database.')
          setShowModal(true)
        } else if (result.status === 'pending') {
          setMessage('Your payment is still processing. Please check again shortly.')
        } else {
          setMessage('Korapay reported that this payment was unsuccessful.')
        }
      })
      .catch(error => {
        setState('error')
        setMessage(error instanceof Error ? error.message : 'Payment verification could not be completed.')
      })
  }, [reference])

  useEffect(() => {
    if (!showModal) return
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [showModal])

  const handlePrintReceipt = () => {
    window.print()
  }

  const Icon = state === 'success' ? CheckCircle2 : state === 'pending' || state === 'loading' ? Clock3 : XCircle
  return (
    <main className="min-h-screen grid place-items-center bg-slate-950 p-5 relative text-white">
      {/* Success Modal 10 Sec Display & Receipt Download */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/90 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-emerald-500/50 rounded-[2.5rem] shadow-2xl p-8 max-w-lg w-full text-center space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 h-3 bg-emerald-500 w-full" />
            <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 border border-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <div>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase tracking-widest px-3.5 py-1 rounded-full">
                Payment Successful & Synced
              </span>
              <h2 className="text-3xl font-black text-white mt-3">Transaction Confirmed!</h2>
              <p className="text-slate-400 font-bold text-xs mt-1">Ref: <span className="font-mono text-emerald-400">{reference}</span></p>
            </div>

            <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 text-left space-y-2.5 text-xs font-semibold text-slate-300 font-mono">
              <p className="flex justify-between border-b border-slate-800 pb-1.5"><span>Status:</span> <span className="text-emerald-400 font-black">PAID & VERIFIED</span></p>
              <p className="flex justify-between border-b border-slate-800 pb-1.5"><span>Amount Paid:</span> <span className="font-bold text-white">NGN {paymentDetails?.amount ? Number(paymentDetails.amount).toLocaleString('en-NG', { minimumFractionDigits: 2 }) : '2,161.25'}</span></p>
              <p className="flex justify-between border-b border-slate-800 pb-1.5"><span>Fee Type:</span> <span className="font-bold text-orange-400 uppercase">{paymentDetails?.feeType || 'registration'}</span></p>
              <p className="flex justify-between"><span>Payment Gateway:</span> <span className="font-bold text-blue-400">Korapay Checkout</span></p>
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[11px] font-bold text-amber-300">
              ⏱️ Modal displaying for <span className="font-black text-amber-400">{countdown}s</span> before continuing.
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handlePrintReceipt}
                className="flex-1 rounded-2xl bg-slate-800 hover:bg-slate-700 h-12 flex items-center justify-center text-xs font-black text-white transition border border-slate-700"
              >
                Download Receipt
              </button>
              <Link href="/auth/signin" className="flex-1 rounded-2xl bg-emerald-600 hover:bg-emerald-500 h-12 flex items-center justify-center text-xs font-black text-white shadow-lg transition">
                Proceed to Sign In
              </Link>
            </div>
          </div>
        </div>
      )}

      <section className="max-w-md w-full rounded-3xl bg-slate-900 border border-slate-800 p-8 text-center shadow-xl space-y-5">
        <div className={state === 'success' ? 'text-emerald-400' : state === 'pending' || state === 'loading' ? 'text-amber-400' : 'text-red-400'}>
          {state === 'loading' ? <SVGLoader /> : <Icon className="w-14 h-14 mx-auto" />}
        </div>
        <h1 className="text-2xl font-black text-white">Korapay Payment Verification</h1>
        <p className="text-slate-400 text-sm font-medium leading-relaxed">{message}</p>
        <div className="flex justify-center gap-3 pt-2">
          <Link className="rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-3 text-xs font-black text-white uppercase tracking-wider transition" href="/auth/signin">Sign In</Link>
          <Link className="rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 px-5 py-3 text-xs font-black text-slate-300 uppercase tracking-wider transition" href="/dashboard/parent/payments/history">Payment History</Link>
        </div>
      </section>
    </main>
  )
}

export default function KorapayReturnPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen grid place-items-center bg-slate-950 p-5 text-white">
        <SVGLoader />
      </div>
    }>
      <KorapayReturnContent />
    </Suspense>
  )
}
