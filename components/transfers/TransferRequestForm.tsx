'use client'

import { useState, useTransition } from 'react'
import { lookupTransferSchool, requestInstitutionTransfer } from '@/app/actions/transfers'

export function TransferRequestForm({ wards = [] }: { wards?: { id: string; name: string }[] }) {
  const [code, setCode] = useState('')
  const [wardId, setWardId] = useState('')
  const [school, setSchool] = useState<{ id: string; name: string; location: string } | null>(null)
  const [message, setMessage] = useState('')
  const [pending, startTransition] = useTransition()
  const verify = () => startTransition(async () => {
    const result = await lookupTransferSchool(code)
    setSchool(result.success ? result.school || null : null)
    setMessage(result.error || '')
  })
  const submit = () => startTransition(async () => {
    const result = await requestInstitutionTransfer(code, wardId || undefined)
    setMessage(result.success ? 'Transfer request sent to the new school administrator for approval.' : result.error || 'Transfer request failed.')
  })
  return <section className="rounded-2xl border bg-white p-6 shadow-sm space-y-4">
    <div><h2 className="text-xl font-bold">Change institution</h2><p className="text-sm text-slate-600 mt-1">Enter the new school’s registration code. Its full name and location are shown before you submit.</p></div>
    {wards.length > 0 && <label className="block text-sm font-medium">Ward (leave blank to transfer your parent account and all linked wards)<select className="mt-1 w-full rounded-lg border p-2" value={wardId} onChange={(e) => setWardId(e.target.value)}><option value="">My account and all wards</option>{wards.map((ward) => <option key={ward.id} value={ward.id}>{ward.name}</option>)}</select></label>}
    <div className="flex gap-2"><input className="min-w-0 flex-1 rounded-lg border px-3 py-2 uppercase" value={code} onChange={(e) => { setCode(e.target.value.toUpperCase()); setSchool(null) }} placeholder="e.g. ABCD-123456" aria-label="New school registration code"/><button className="rounded-lg bg-slate-800 px-4 py-2 text-white disabled:opacity-50" onClick={verify} disabled={pending || !code.trim()}>Verify code</button></div>
    {school && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"><p className="font-bold">{school.name}</p><p className="text-sm text-slate-600">{school.location}</p><button onClick={submit} disabled={pending} className="mt-3 rounded-lg bg-emerald-700 px-4 py-2 text-white disabled:opacity-50">Request transfer</button></div>}
    {message && <p role="status" className="text-sm text-slate-700">{message}</p>}
  </section>
}
