'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getStudentPaymentHistory } from '@/app/actions/payments'

export default function StudentPaymentHistoryPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getStudentPaymentHistory().then(setPayments).catch(() => setPayments([])).finally(() => setLoading(false))
  }, [])

  return <DashboardLayout role="student">
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div><h1 className="text-3xl font-black text-slate-900">Transaction History</h1><p className="text-slate-500 mt-2">Payments and waived admissions recorded for your account.</p></div>
      <Card className="border-none shadow-xl rounded-3xl overflow-hidden"><CardContent className="p-0">
        <table className="w-full text-left"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-5">Date</th><th className="p-5">Description</th><th className="p-5">Amount</th><th className="p-5">Status</th></tr></thead>
          <tbody>{loading ? <tr><td colSpan={4} className="p-10 text-center text-slate-400">Loading transactions…</td></tr> : payments.length ? payments.map(p => <tr key={p.id} className="border-t"><td className="p-5">{new Date(p.paidAt || p.createdAt).toLocaleDateString()}</td><td className="p-5 font-medium">{p.description || p.feeType}</td><td className="p-5 font-bold">₦{Number(p.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td><td className="p-5"><Badge className={p.status === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}>{p.status}</Badge></td></tr>) : <tr><td colSpan={4} className="p-10 text-center text-slate-400">No transactions have been recorded.</td></tr>}</tbody>
        </table>
      </CardContent></Card>
    </div>
  </DashboardLayout>
}
