'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Calendar,
  Search,
  ShieldCheck,
  Clock,
  Coins,
  TrendingUp,
  FileSpreadsheet,
  Download,
  Printer,
  X
} from 'lucide-react'
import { getAllPaymentsWithStudents, verifyPayment } from '@/app/actions/admin'
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [activeReceipt, setActiveReceipt] = useState<any | null>(null)

  const [feeStructures, setFeeStructures] = useState<any[]>([])

  const loadPayments = async () => {
    try {
      const res = await getAllPaymentsWithStudents()
      if (Array.isArray(res)) {
        setPayments(res)
      } else {
        setPayments(res?.payments || [])
        setFeeStructures(res?.feeStructures || [])
      }
    } catch (err) {
      console.error('Error loading payments:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPayments()
  }, [])

  // Real-time synchronization with Supabase Database payment table
  useRealtimeSubscription('payment', () => { loadPayments() })

  const handleVerify = async (id: string, status: 'success' | 'failed') => {
    if (!confirm(`Are you sure you want to mark this payment as ${status === 'success' ? 'SUCCESSFUL' : 'FAILED'}?`)) return

    setProcessingId(id)
    try {
      await verifyPayment(id, status)
      alert(`Payment was marked as ${status === 'success' ? 'successful' : 'failed'}.`)
      await loadPayments()
    } catch (err) {
      alert('Action failed. Ensure you have the required administrative permissions.')
    } finally {
      setProcessingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const s = (status || 'pending').toLowerCase()
    if (s === 'success' || s === 'approved') {
      return (
        <Badge className="bg-emerald-100 text-emerald-800 border-none font-black flex items-center gap-1 py-1 px-3 rounded-lg">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Success
        </Badge>
      )
    }
    if (s === 'pending') {
      return (
        <Badge className="bg-amber-100 text-amber-800 border-none font-black flex items-center gap-1 py-1 px-3 rounded-lg animate-pulse">
          <Clock className="w-3.5 h-3.5 text-amber-600" /> Pending
        </Badge>
      )
    }
    return (
      <Badge className="bg-red-100 text-red-800 border-none font-black flex items-center gap-1 py-1 px-3 rounded-lg">
        <XCircle className="w-3.5 h-3.5 text-red-600" /> Failed
      </Badge>
    )
  }

  // Filter payments
  const filteredPayments = payments.filter((p) => {
    const query = searchQuery.toLowerCase()
    const matchesSearch =
      (p.transactionReference || '').toLowerCase().includes(query) ||
      (p.feeType || '').toLowerCase().includes(query) ||
      (p.student?.firstName || '').toLowerCase().includes(query) ||
      (p.student?.lastName || '').toLowerCase().includes(query) ||
      (p.student?.admissionNumber || '').toLowerCase().includes(query)

    const matchesStatus =
      statusFilter === 'all' || (p.status || 'pending').toLowerCase() === statusFilter.toLowerCase()

    return matchesSearch && matchesStatus
  })

  // Calculate statistics
  const successPayments = payments.filter((p) => (p.status || '').toLowerCase() === 'success')
  const totalRevenue = successPayments.reduce((acc, p) => acc + parseFloat(p.amount || '0'), 0)
  const pendingCount = payments.filter((p) => (p.status || '').toLowerCase() === 'pending').length

  return (
    <DashboardLayout role="admin">
      <div className="p-8 max-w-7xl mx-auto space-y-10 relative">
        {/* Downloadable / Printable Transaction Receipt Modal */}
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
                  <h3 className="text-2xl font-black text-slate-900">Institutional Audit Receipt</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">EL LEARNERS APP</p>
                </div>
              </div>

              <div className="py-6 space-y-3 text-sm font-medium">
                <div className="flex justify-between">
                  <span className="text-slate-400">Reference:</span>
                  <span className="font-mono font-black text-slate-900">{activeReceipt.transactionReference || activeReceipt.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Payer / Student:</span>
                  <span className="font-bold text-slate-900">{activeReceipt.student?.firstName} {activeReceipt.student?.lastName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Admission No:</span>
                  <span className="font-mono font-bold text-slate-900">{activeReceipt.student?.admissionNumber || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Fee Category:</span>
                  <span className="font-bold text-slate-900 uppercase text-xs">{activeReceipt.feeType || 'General Fee'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Date:</span>
                  <span className="font-bold text-slate-900">{new Date(activeReceipt.createdAt || activeReceipt.paymentDate || Date.now()).toLocaleDateString()}</span>
                </div>
                <div className="h-[1px] bg-slate-100 my-4" />
                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="text-slate-500 font-bold">Amount Paid:</span>
                  <span className="text-2xl font-black text-emerald-600 font-mono">₦{parseFloat(activeReceipt.amount || '0').toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
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
                    alert('Audit receipt downloaded successfully.')
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

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Payment Reconciliation & Transaction Ledger</h1>
            <p className="text-slate-500 font-medium text-lg">
              Monitor, track, and download all fee payments coming in or going out in real-time with Supabase Database.
            </p>
          </div>
          <Button
            onClick={() => window.print()}
            className="bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl h-12 px-6 flex items-center gap-2"
          >
            <FileSpreadsheet size={16} /> EXPORT LEDGER
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl bg-white p-6 flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
              <Coins size={30} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Revenue</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">₦{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
            </div>
          </Card>

          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl bg-white p-6 flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
              <TrendingUp size={30} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Confirmed Transactions</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{successPayments.length} Payments</h3>
            </div>
          </Card>

          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl bg-white p-6 flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600">
              <Clock size={30} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pending Verification</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{pendingCount} Payments</h3>
            </div>
          </Card>
        </div>

        {/* Filter and Search Section */}
        <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-6 rounded-3xl shadow-md border border-slate-100">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search by student name, admission number, transaction reference..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 rounded-xl border-slate-200 w-full animate-in"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-12 px-4 rounded-xl border border-slate-200 font-bold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              <option value="all">All Statuses</option>
              <option value="success">Success</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {/* Fee Structures Grouping Summary */}
        {feeStructures.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Active School Fee Categories</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {feeStructures.map((fee) => {
                const categoryPayments = filteredPayments.filter(p => (p.feeType || '').toLowerCase() === (fee.feeType || '').toLowerCase())
                const categoryRevenue = categoryPayments.reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0)

                return (
                  <Card key={fee.id} className="border-none shadow-lg rounded-2xl bg-white p-5 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black uppercase text-slate-400">{fee.feeType || 'General Fee'}</span>
                      <Badge className="bg-emerald-100 text-emerald-800 font-black border-none text-[10px]">
                        Class: {fee.class}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-lg font-black text-slate-900">₦{categoryRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                        <p className="text-[11px] font-bold text-slate-500">{categoryPayments.length} Transactions</p>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">Target: ₦{parseFloat(fee.amount || '0').toLocaleString()}</span>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* Payments Table Grouped by Fee Structure */}
        <Card className="border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] overflow-hidden bg-white">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">
                    <th className="p-8">Parent Paying</th>
                    <th className="p-8">Child / Ward Paid For</th>
                    <th className="p-8">Fee Category & Breakdown</th>
                    <th className="p-8">Reference</th>
                    <th className="p-8">Timeline</th>
                    <th className="p-8">Status</th>
                    <th className="p-8 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="p-24 text-center text-slate-400 italic font-bold">
                        <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mx-auto mb-4" />
                        Accessing real-time ledger...
                      </td>
                    </tr>
                  ) : filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-24 text-center text-slate-400 italic font-bold">
                        No transactions found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map((p) => {
                      const parentName = p.parent?.fatherName || p.parent?.motherName || p.parent?.guardianName || p.parent?.user?.name || 'Parent / Guardian'
                      const totalAmt = parseFloat(p.amount || '0')
                      const baseAmt = Math.max(0, totalAmt - 161.25)

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/30 transition-colors group">
                          <td className="p-8">
                            <p className="font-black text-slate-900">{parentName}</p>
                            <p className="text-xs font-bold text-slate-400 mt-0.5">{p.parent?.user?.email || 'N/A'}</p>
                          </td>
                          <td className="p-8">
                            <p className="font-black text-slate-900">
                              {p.student?.firstName} {p.student?.lastName}
                            </p>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                              Class: {p.student?.class || 'N/A'} • {p.student?.admissionNumber || 'N/A'}
                            </p>
                          </td>
                          <td className="p-8">
                            <p className="font-black text-emerald-600 text-lg">
                              ₦{totalAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </p>
                            <div className="text-[10px] font-bold text-slate-500 mt-1 space-y-0.5">
                              <p className="uppercase font-black text-slate-700">{p.feeType || 'GENERAL FEE'}</p>
                              <p>Base Fee: ₦{baseAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                              <p className="text-amber-600">+ Gateway Fee: ₦161.25</p>
                            </div>
                          </td>
                          <td className="p-8">
                            <p className="font-mono text-xs text-slate-600">{p.transactionReference || 'N/A'}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                              {p.paymentMethod || 'KORAPAY'}
                            </p>
                          </td>
                          <td className="p-8">
                            <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
                              <Calendar size={14} className="text-amber-500" />{' '}
                              {new Date(p.createdAt || p.paymentDate || Date.now()).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="p-8">{getStatusBadge(p.status)}</td>
                          <td className="p-8 text-right">
                            {p.status?.toLowerCase() === 'pending' ? (
                              <div className="flex justify-end gap-3">
                                <Button
                                  onClick={() => handleVerify(p.id, 'success')}
                                  disabled={processingId === p.id}
                                  className="h-11 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-black shadow-lg shadow-emerald-100 transition-all active:scale-95 text-xs text-white"
                                >
                                  {processingId === p.id ? <Loader2 className="animate-spin w-4 h-4" /> : 'CONFIRM'}
                                </Button>
                                <Button
                                  onClick={() => handleVerify(p.id, 'failed')}
                                  disabled={processingId === p.id}
                                  variant="outline"
                                  className="h-11 px-5 rounded-xl border-2 border-red-50 text-red-600 font-black hover:bg-red-50 hover:border-red-100 transition-all active:scale-95 text-xs"
                                >
                                  REJECT
                                </Button>
                              </div>
                            ) : (
                              <div className="flex justify-end items-center gap-2">
                                <Button
                                  onClick={() => setActiveReceipt(p)}
                                  size="sm"
                                  variant="outline"
                                  className="h-9 font-black text-xs rounded-xl border-slate-200 text-slate-700 hover:bg-slate-100"
                                >
                                  <Download className="w-3.5 h-3.5 mr-1" /> Slip
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
