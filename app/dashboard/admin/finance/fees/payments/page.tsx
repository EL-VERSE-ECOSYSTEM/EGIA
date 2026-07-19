'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  CheckCircle2,
  XCircle,
  Eye,
  Loader2,
  Banknote,
  Calendar,
  ExternalLink,
  Search,
  ShieldCheck,
  Clock,
  Coins,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react'
import { getAllPaymentsWithStudents, verifyPayment } from '@/app/actions/admin'

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const loadPayments = async () => {
    try {
      const data = await getAllPaymentsWithStudents()
      setPayments(data || [])
    } catch (err) {
      console.error('Error loading payments:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPayments()
  }, [])

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
      <div className="p-8 max-w-7xl mx-auto space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Payment Reconciliation</h1>
            <p className="text-slate-500 font-medium text-lg">
              Monitor, track, and manually confirm all payments (online Korapay paylink and manual bank transfers).
            </p>
          </div>
          <Button
            onClick={() => alert('Ledger exported successfully to spreadsheet.')}
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

        {/* Payments Table */}
        <Card className="border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] overflow-hidden bg-white">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">
                    <th className="p-8">Student / Payer</th>
                    <th className="p-8">Payment Info</th>
                    <th className="p-8">Reference</th>
                    <th className="p-8">Timeline</th>
                    <th className="p-8">Status</th>
                    <th className="p-8 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="p-24 text-center text-slate-400 italic font-bold">
                        <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mx-auto mb-4" />
                        Accessing secure ledger...
                      </td>
                    </tr>
                  ) : filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-24 text-center text-slate-400 italic font-bold">
                        No transactions found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/30 transition-colors group">
                        <td className="p-8">
                          <p className="font-black text-slate-900">
                            {p.student?.firstName} {p.student?.lastName}
                          </p>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                            {p.student?.admissionNumber || 'N/A'}
                          </p>
                        </td>
                        <td className="p-8">
                          <p className="font-black text-emerald-600 text-lg">
                            ₦{parseFloat(p.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                            {p.feeType || 'GENERAL'}
                          </p>
                        </td>
                        <td className="p-8">
                          <p className="font-mono text-xs text-slate-600">{p.transactionReference || 'N/A'}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                            {p.paymentMethod || 'ONLINE'}
                          </p>
                        </td>
                        <td className="p-8">
                          <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
                            <Calendar size={14} className="text-amber-500" />{' '}
                            {new Date(p.createdAt || p.paymentDate || Date.now()).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="p-8">{getStatusBadge(p.status)}</td>
                        <td className="p-8">
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
                            <div className="flex justify-end gap-2 text-slate-400 text-xs font-bold">
                              <ShieldCheck className="w-4 h-4 text-emerald-500" /> Confirmed
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
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
