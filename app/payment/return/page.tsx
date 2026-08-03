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

  useEffect(() => {
    if (!reference) { setState('error'); setMessage('No Korapay payment reference was supplied.'); return }
    verifyKorapayPayment(reference).then(result => {
      setState(result.status)
      setMessage(result.status === 'success' ? 'Payment confirmed. Your account and transaction history are updated.' : result.status === 'pending' ? 'Your payment is still processing. Please check again shortly.' : 'Korapay reported that this payment was unsuccessful.')
    }).catch(error => { setState('error'); setMessage(error instanceof Error ? error.message : 'Payment verification could not be completed.') })
  }, [reference])

  const Icon = state === 'success' ? CheckCircle2 : state === 'pending' || state === 'loading' ? Clock3 : XCircle
  return <main className="min-h-screen grid place-items-center bg-slate-50 p-5"><section className="max-w-md w-full rounded-3xl bg-white p-8 text-center shadow-xl space-y-5"><div className={state === 'success' ? 'text-emerald-600' : state === 'pending' || state === 'loading' ? 'text-amber-600' : 'text-red-600'}>{state === 'loading' ? <SVGLoader /> : <Icon className="w-14 h-14 mx-auto" />}</div><h1 className="text-2xl font-black text-slate-900">Korapay payment verification</h1><p className="text-slate-600">{message}</p><div className="flex justify-center gap-3"><Link className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white" href="/auth/signin">Sign in</Link><Link className="rounded-xl border px-5 py-3 text-sm font-bold" href="/dashboard/parent/payments/history">Payment history</Link></div></section></main>
}
