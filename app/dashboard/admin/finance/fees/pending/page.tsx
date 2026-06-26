'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, Eye, Loader2, Banknote, Calendar, ExternalLink } from 'lucide-react'
import { getPendingPayments, verifyPayment } from '@/app/actions/admin'

export default function PendingPaymentsPage() {
  const [payments, setPendingPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const data = await getPendingPayments()
      setPendingPayments(data)
      setLoading(false)
    }
    load()
  }, [])

  const handleVerify = async (id: string, status: 'success' | 'failed') => {
    if (!confirm(`Are you sure you want to ${status === 'success' ? 'confirm' : 'reject'} this payment?`)) return

    setProcessingId(id)
    try {
      await verifyPayment(id, status)
      setPendingPayments(prev => prev.filter(p => p.id !== id))
      alert(`Payment ${status === 'success' ? 'confirmed' : 'rejected'} successfully.`)
    } catch (err) {
      alert('Action failed.')
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <DashboardLayout role="admin">
      <div className="p-8 max-w-7xl mx-auto space-y-10">
        <div className="flex justify-between items-end">
           <div>
             <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Verification Queue</h1>
             <p className="text-slate-500 font-medium text-lg">Approve or reject manual bank transfers based on uploaded receipts.</p>
           </div>
           <Badge className="bg-amber-100 text-amber-700 h-10 px-6 rounded-xl font-black text-sm uppercase tracking-widest">{payments.length} Pending</Badge>
        </div>

        <Card className="border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] overflow-hidden bg-white">
          <CardContent className="p-0">
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">
                      <th className="p-8">Student / Payer</th>
                      <th className="p-8">Payment Info</th>
                      <th className="p-8">Receipt</th>
                      <th className="p-8">Timeline</th>
                      <th className="p-8 text-right">Verification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {loading ? (
                      <tr><td colSpan={5} className="p-24 text-center text-slate-400 italic font-bold">Accessing secure vault...</td></tr>
                    ) : payments.length === 0 ? (
                      <tr><td colSpan={5} className="p-24 text-center text-slate-400 italic font-bold">The queue is empty. All payments verified.</td></tr>
                    ) : payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/30 transition-colors group">
                        <td className="p-8">
                           <p className="font-black text-slate-900">{p.student?.firstName} {p.student?.lastName}</p>
                           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{p.student?.admissionNumber || 'N/A'}</p>
                        </td>
                        <td className="p-8">
                           <p className="font-black text-emerald-600 text-lg">₦{parseFloat(p.amount).toLocaleString()}</p>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{p.feeType}</p>
                        </td>
                        <td className="p-8">
                           <Button variant="outline" className="rounded-xl font-black text-[10px] border-slate-200 text-slate-600 gap-2 h-10 hover:bg-slate-50">
                              <ExternalLink size={14} /> VIEW RECEIPT
                           </Button>
                           <p className="text-[10px] font-mono text-slate-300 mt-2">{p.transactionReference}</p>
                        </td>
                        <td className="p-8">
                           <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
                             <Clock size={14} className="text-amber-500" /> {new Date(p.createdAt).toLocaleDateString()}
                           </div>
                        </td>
                        <td className="p-8">
                           <div className="flex justify-end gap-3">
                              <Button
                                onClick={() => handleVerify(p.id, 'success')}
                                disabled={processingId === p.id}
                                className="h-12 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-black shadow-lg shadow-emerald-100 transition-all active:scale-95"
                              >
                                {processingId === p.id ? <Loader2 className="animate-spin" /> : 'APPROVE'}
                              </Button>
                              <Button
                                onClick={() => handleVerify(p.id, 'failed')}
                                disabled={processingId === p.id}
                                variant="outline"
                                className="h-12 px-6 rounded-xl border-2 border-red-50 text-red-600 font-black hover:bg-red-50 hover:border-red-100 transition-all active:scale-95"
                              >
                                REJECT
                              </Button>
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
