'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, Clock3, XCircle } from 'lucide-react'
import { SVGLoader } from '@/components/ui/svg-loader'
import { verifyKorapayPayment } from '@/app/actions/payments'

export default function KorapayReturnPage() {
  const searchParams = useSearchParams()
  const reference = searchParams.get('reference') || searchParams.get('payment_reference') || ''
  const [state, setState] = useState<'loading' | 'success' | 'pending' | 'failed' | 'error'>('loading')
  const [message, setMessage] = useState('Confirming your payment securely with Korapay…')
  const [showModal, setShowModal] = useState(false)
  const [countdown, setCountdown] = useState(10)

  useEffect(() => {
    if (!reference) { setState('error'); setMessage('No Korapay payment reference was supplied.'); return }
    verifyKorapayPayment(reference).then(result => {
      setState(result.status)
      if (result.status === 'success') {
        setMessage('Payment confirmed. Your account and transaction history are updated.')
        setShowModal(true)
      } else if (result.status === 'pending') {
        setMessage('Your payment is still processing. Please check again shortly.')
      } else {
        setMessage('Korapay reported that this payment was unsuccessful.')
      }
    }).catch(error => { setState('error'); setMessage(error instanceof Error ? error.message : 'Payment verification could not be completed.') })
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

  const Icon = state === 'success' ? CheckCircle2 : state === 'pending' || state === 'loading' ? Clock3 : XCircle
  return (
    <main className="min-h-screen grid place-items-center bg-slate-50 p-5 relative">
      {/* Success Modal 10 Sec Display */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 max-w-lg w-full text-center space-y-6 relative border-4 border-emerald-500 overflow-hidden">
            <div className="absolute top-0 left-0 h-3 bg-emerald-500 w-full" />
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-100">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <div>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                Payment Successful
              </span>
              <h2 className="text-3xl font-black text-slate-900 mt-2">Transaction Confirmed!</h2>
              <p className="text-slate-500 font-bold text-xs mt-1">Ref: <span className="font-mono text-emerald-700">{reference}</span></p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left space-y-2 text-xs font-semibold text-slate-700">
              <p className="flex justify-between"><span>Status:</span> <span className="text-emerald-600 font-black">PAID / SUCCESS</span></p>
              <p className="flex justify-between"><span>Amount:</span> <span className="font-bold">NGN 2,000.00</span></p>
              <p className="flex justify-between"><span>Payment Method:</span> <span className="font-bold">Korapay Gateway</span></p>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-[11px] font-bold text-amber-900">
              ⏱️ Modal displaying for <span className="font-black text-amber-700">{countdown}s</span> before continuing.
            </div>

            <div className="flex gap-3">
              <Link href="/auth/signin" className="flex-1 rounded-2xl bg-emerald-600 hover:bg-emerald-700 h-12 flex items-center justify-center text-xs font-black text-white shadow-lg shadow-emerald-200">
                Proceed to Sign In
              </Link>
              <Link href="/dashboard/parent/payments/history" className="flex-1 rounded-2xl border border-slate-200 h-12 flex items-center justify-center text-xs font-black text-slate-700 hover:bg-slate-50">
                View History
              </Link>
            </div>
          </div>
        </div>
      )}

      <section className="max-w-md w-full rounded-3xl bg-white p-8 text-center shadow-xl space-y-5">
        <div className={state === 'success' ? 'text-emerald-600' : state === 'pending' || state === 'loading' ? 'text-amber-600' : 'text-red-600'}>
          {state === 'loading' ? <SVGLoader /> : <Icon className="w-14 h-14 mx-auto" />}
        </div>
        <h1 className="text-2xl font-black text-slate-900">Korapay payment verification</h1>
        <p className="text-slate-600">{message}</p>
        <div className="flex justify-center gap-3">
          <Link className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white" href="/auth/signin">Sign in</Link>
          <Link className="rounded-xl border px-5 py-3 text-sm font-bold" href="/dashboard/parent/payments/history">Payment history</Link>
        </div>
      </section>
    </main>
  )
}
