'use client'

import { useState, useTransition } from 'react'
import { reviewInstitutionTransfer } from '@/app/actions/transfers'

type Transfer = { id: string; userId: string; role: string; status: string; createdAt: Date; name: string | null; email: string; oldSchool: string | null; oldLocation: string | null; wardStudentId: string | null }
export function TransferReviewList({ requests }: { requests: Transfer[] }) {
  const [message, setMessage] = useState('')
  const [pending, startTransition] = useTransition()
  const decide = (id: string, approve: boolean) => startTransition(async () => {
    const result = await reviewInstitutionTransfer(id, approve)
    setMessage(result.success ? (approve ? 'Transfer approved. Previous school data cleanup is scheduled within 30 seconds.' : 'Transfer request rejected.') : result.error || 'Could not update request.')
    if (result.success) window.location.reload()
  })
  return <div className="space-y-4">{message && <p role="status">{message}</p>}{requests.length ? requests.map((request) => <article key={request.id} className="rounded-xl border bg-white p-5 shadow-sm"><div className="flex flex-wrap justify-between gap-3"><div><h2 className="font-bold">{request.name || request.email}</h2><p className="text-sm text-slate-600">{request.role} · {request.email}</p><p className="mt-1 text-sm">From {request.oldSchool || 'Previous school'}{request.oldLocation ? `, ${request.oldLocation}` : ''}</p><p className="text-xs text-slate-500">Requested {new Date(request.createdAt).toLocaleString()}</p></div><div className="flex items-center gap-2"><button disabled={pending} onClick={() => decide(request.id, false)} className="rounded-lg border px-3 py-2">Reject</button><button disabled={pending} onClick={() => decide(request.id, true)} className="rounded-lg bg-emerald-700 px-3 py-2 text-white">Approve transfer</button></div></div></article>) : <div className="rounded-xl border border-dashed p-10 text-center text-slate-500">There are no transfer requests waiting for review.</div>}</div>
}
