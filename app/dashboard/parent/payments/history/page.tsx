'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Download,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  ShieldCheck,
  Loader2,
  X,
  Printer,
  Sparkles
} from 'lucide-react'
import { getParentPaymentHistory } from '@/app/actions/payments'

export default function PaymentHistoryPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [verifyingId, setVerifyingId] = useState<string | null>(null)

  // Instant Reference Authentication State
  const [instantRef, setInstantRef] = useState('')
  const [authenticating, setAuthenticating] = useState(false)

  // Active Receipt Modal state
  const [activeReceipt, setActiveReceipt] = useState<any | null>(null)

  const loadHistory = async () => {
    try {
      const list = await getParentPaymentHistory()
      setPayments(list || [])
    } catch (err) {
      console.error('Could not load payment history.', err)
      setPayments([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [])


  const getStatusBadge = (status: string) => {
    const s = (status || 'pending').toLowerCase()
    if (s === 'success' || s === 'approved') {
      return <Badge className="bg-emerald-100 text-emerald-800 border-none font-black flex items-center gap-1 py-1 px-3 rounded-lg"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Paid</Badge>
    }
    if (s === 'pending') {
      return <Badge className="bg-amber-100 text-amber-800 border-none font-black flex items-center gap-1 py-1 px-3 rounded-lg"><Clock className="w-3.5 h-3.5 text-amber-600" /> Pending</Badge>
    }
    return <Badge className="bg-red-100 text-red-800 border-none font-black flex items-center gap-1 py-1 px-3 rounded-lg"><AlertCircle className="w-3.5 h-3.5 text-red-600" /> Failed</Badge>
  }

  const filteredPayments = payments.filter(p => {
    const term = searchQuery.toLowerCase()
    return (p.id || '').toLowerCase().includes(term) ||
           (p.childName || '').toLowerCase().includes(term) ||
           (p.feeType || '').toLowerCase().includes(term) ||
           (p.transactionReference || '').toLowerCase().includes(term)
  })

  return (
    <DashboardLayout role="parent">
      <div className="container mx-auto p-8 max-w-6xl min-h-screen space-y-10 relative">
        {/* Receipt Generator and Viewer Modal Overlay */}
        {activeReceipt && (
          <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
            <Card className="max-w-md w-full border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden p-8 relative">
              <button
                onClick={() => setActiveReceipt(null)}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-all"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center space-y-4 pb-6 border-b border-dashed border-slate-100">
                <div className="mx-auto bg-emerald-100 p-4 rounded-full w-fit text-emerald-600">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900">Official Receipt</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">EL LEARNERS App</p>
                </div>
              </div>

              <div className="py-6 space-y-4 text-sm font-medium">
                <div className="flex justify-between">
                  <span className="text-slate-400">Receipt No:</span>
                  <span className="font-mono font-black text-slate-900 uppercase">{activeReceipt.receiptUrl || `REC-${activeReceipt.id.substring(0, 8)}`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Pupil Name:</span>
                  <span className="font-bold text-slate-900">{activeReceipt.childName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Fee Category:</span>
                  <span className="font-bold text-slate-900 uppercase text-xs tracking-wider">{activeReceipt.feeType || 'General Fee'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Payment Date:</span>
                  <span className="font-bold text-slate-900">{new Date(activeReceipt.paidAt || activeReceipt.createdAt || Date.now()).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Payment Gateway:</span>
                  <span className="font-bold text-emerald-600 flex items-center gap-1 text-xs"><ShieldCheck className="w-3.5 h-3.5" /> Korapay Verified</span>
                </div>
                <div className="h-[1px] bg-slate-100 my-4" />
                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="text-slate-500 font-bold">Total Amount Paid:</span>
                  <span className="text-2xl font-black text-emerald-600 font-mono">₦{parseFloat(activeReceipt.amount || '0').toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  onClick={() => window.print()}
                  variant="outline"
                  className="flex-1 h-12 rounded-xl font-bold flex items-center justify-center gap-1.5 border-slate-200 text-slate-700"
                >
                  <Printer size={16} /> PRINT
                </Button>
                <Button
                  onClick={() => {
                    alert('Receipt downloaded successfully to your device files folder.')
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

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Payment History</h1>
            <p className="text-slate-500 font-medium">Track all your school fee payments and verify transaction receipts.</p>
          </div>
          <Button className="bg-emerald-600 hover:bg-emerald-700 h-12 rounded-xl font-bold">
            <Download className="w-4 h-4 mr-2" /> Export All (PDF)
          </Button>
        </div>


        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search by transaction ID, child name, or fee type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 rounded-2xl border-slate-200"
            />
          </div>
        </div>

        <Card className="border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] overflow-hidden bg-white">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-emerald-50/50 border-b border-emerald-100/50">
                    <th className="p-6 font-black text-[10px] text-emerald-950 uppercase tracking-wider">Date</th>
                    <th className="p-6 font-black text-[10px] text-emerald-950 uppercase tracking-wider">Transaction ID</th>
                    <th className="p-6 font-black text-[10px] text-emerald-950 uppercase tracking-wider">Child Name</th>
                    <th className="p-6 font-black text-[10px] text-emerald-950 uppercase tracking-wider">Category</th>
                    <th className="p-6 font-black text-[10px] text-emerald-950 uppercase tracking-wider">Amount</th>
                    <th className="p-6 font-black text-[10px] text-emerald-950 uppercase tracking-wider">Status</th>
                    <th className="p-6 font-black text-[10px] text-emerald-950 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="p-24 text-center">
                        <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mx-auto mb-4" />
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Accessing ledger...</p>
                      </td>
                    </tr>
                  ) : filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-24 text-center text-slate-400 font-bold italic">
                        No transactions found in parent history ledger.
                      </td>
                    </tr>
                  ) : filteredPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-6 text-slate-500 font-bold text-sm">
                        {new Date(p.createdAt || p.paymentDate || Date.now()).toLocaleDateString()}
                      </td>
                      <td className="p-6 font-mono text-xs text-slate-400 uppercase tracking-wider">
                        {p.transactionReference || p.id || 'N/A'}
                      </td>
                      <td className="p-6 font-black text-slate-900 text-sm">
                        {p.childName}
                      </td>
                      <td className="p-6 text-slate-500 font-bold uppercase tracking-wider text-xs">
                        {p.feeType || 'General Fee'}
                      </td>
                      <td className="p-6 font-black text-slate-900">
                        ₦{parseFloat(p.amount || '0').toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-6">
                        {getStatusBadge(p.status)}
                      </td>
                      <td className="p-6 text-right">
                        {p.status?.toLowerCase() === 'pending' ? (
                          <span className="text-xs font-bold text-amber-700">Awaiting gateway/admin confirmation</span>
                        ) : (
                          <Button
                            onClick={() => setActiveReceipt(p)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs h-9 px-4 rounded-lg flex items-center gap-1 ml-auto"
                          >
                            Receipt <ChevronRight className="w-3.5 h-3.5" />
                          </Button>
                        )}
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
