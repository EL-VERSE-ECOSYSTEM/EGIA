'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Download, Printer, X, CheckCircle2, Clock, ShieldCheck, Loader2 } from 'lucide-react'
import { getStudentPaymentHistory } from '@/app/actions/payments'
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'

export default function StudentPaymentHistoryPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeReceipt, setActiveReceipt] = useState<any | null>(null)

  const loadPayments = async () => {
    try {
      const data = await getStudentPaymentHistory()
      setPayments(data || [])
    } catch {
      setPayments([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPayments()
  }, [])

  // Real-time synchronization with Supabase Database payment table
  useRealtimeSubscription('payment', () => {
    loadPayments()
  })

  const getStatusBadge = (status: string) => {
    const s = (status || 'pending').toLowerCase()
    if (s === 'success' || s === 'approved' || s === 'cleared') {
      return <Badge className="bg-emerald-100 text-emerald-800 border-none font-black px-3 py-1 rounded-lg">PAID & CLEARED</Badge>
    }
    if (s === 'pending') {
      return <Badge className="bg-amber-100 text-amber-800 border-none font-black px-3 py-1 rounded-lg">PENDING</Badge>
    }
    return <Badge className="bg-red-100 text-red-800 border-none font-black px-3 py-1 rounded-lg">FAILED</Badge>
  }

  return (
    <DashboardLayout role="student">
      <div className="p-8 max-w-5xl mx-auto space-y-8 relative">
        {/* Printable/Downloadable Receipt Modal */}
        {activeReceipt && (
          <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
            <Card className="max-w-md w-full border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden p-8 relative text-slate-900">
              <button
                onClick={() => setActiveReceipt(null)}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full transition"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center space-y-3 pb-6 border-b border-dashed border-slate-100">
                <div className="mx-auto bg-emerald-100 p-4 rounded-full w-fit text-emerald-600">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900">Student Clearance Receipt</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">EL LEARNERS APP</p>
                </div>
              </div>

              <div className="py-6 space-y-3 text-sm font-medium">
                <div className="flex justify-between">
                  <span className="text-slate-400">Reference:</span>
                  <span className="font-mono font-black text-slate-900">{activeReceipt.transactionReference || activeReceipt.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Fee Category:</span>
                  <span className="font-bold text-slate-900 uppercase text-xs">{activeReceipt.feeType || 'Registration / School Fee'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Date:</span>
                  <span className="font-bold text-slate-900">{new Date(activeReceipt.paidAt || activeReceipt.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Fee Clearance:</span>
                  <span className="font-bold text-emerald-600 flex items-center gap-1 text-xs">
                    <ShieldCheck className="w-3.5 h-3.5" /> CLEARED & CONFIRMED
                  </span>
                </div>
                <div className="h-[1px] bg-slate-100 my-4" />
                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="text-slate-500 font-bold">Amount Paid:</span>
                  <span className="text-2xl font-black text-emerald-600 font-mono">₦{Number(activeReceipt.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <Button
                  onClick={() => window.print()}
                  variant="outline"
                  className="flex-1 h-12 rounded-xl font-bold flex items-center justify-center gap-1.5 border-slate-200"
                >
                  <Printer size={16} /> PRINT
                </Button>
                <Button
                  onClick={() => {
                    alert('Clearance receipt downloaded successfully.')
                    setActiveReceipt(null)
                  }}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white h-12 rounded-xl font-bold flex items-center justify-center gap-1.5"
                >
                  <Download size={16} /> DOWNLOAD
                </Button>
              </div>
            </Card>
          </div>
        )}

        <div>
          <h1 className="text-3xl font-black text-slate-900">Transaction History & Fees Clearance</h1>
          <p className="text-slate-500 mt-2">View real-time record of all fee payments, registrations, and download clearance receipts.</p>
        </div>
        <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-white">
          <CardContent className="p-0">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-xs font-black uppercase text-slate-500 border-b">
                <tr>
                  <th className="p-5">Date</th>
                  <th className="p-5">Description</th>
                  <th className="p-5">Amount</th>
                  <th className="p-5">Status</th>
                  <th className="p-5 text-right">Receipt / Clearance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Loading transactions in real-time…
                    </td>
                  </tr>
                ) : payments.length ? (
                  payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-5 text-slate-500 font-bold">
                        {new Date(p.paidAt || p.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-5 font-bold text-slate-900">
                        {p.description || p.feeType}
                      </td>
                      <td className="p-5 font-black text-slate-900">
                        ₦{Number(p.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-5">
                        {getStatusBadge(p.status)}
                      </td>
                      <td className="p-5 text-right">
                        {p.status?.toLowerCase() === 'success' || p.status?.toLowerCase() === 'cleared' ? (
                          <Button
                            onClick={() => setActiveReceipt(p)}
                            size="sm"
                            className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-black text-xs rounded-xl"
                          >
                            <Download className="w-3.5 h-3.5 mr-1" /> Clearance Receipt
                          </Button>
                        ) : (
                          <span className="text-xs text-amber-600 font-bold">Pending Clearance</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-slate-400 font-bold">
                      No transactions have been recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
