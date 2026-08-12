'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckCircle2, XCircle, Eye, Loader2, Banknote, Calendar, ExternalLink, Clock, User, Save } from 'lucide-react'
import { getPendingPayments, verifyPayment } from '@/app/actions/admin'
import { getParentsWithPendingFees, updateParentOutstandingFee } from '@/app/actions/admin-ops'
import { toast } from 'sonner'

export default function PendingPaymentsPage() {
  const [payments, setPendingPayments] = useState<any[]>([])
  const [parents, setParents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  // Custom states for interactive parent fee inputs
  const [feeEdits, setFeeEdits] = useState<Record<string, string>>({})
  const [searchQuery, setSearchQuery] = useState('')

  const loadData = async () => {
    try {
      const data = await getPendingPayments()
      setPendingPayments(data || [])

      const parentList = await getParentsWithPendingFees()
      setParents(parentList || [])

      // Initialize inputs map
      const initialFees: Record<string, string> = {}
      if (parentList) {
        parentList.forEach((p: any) => {
          initialFees[p.id] = p.totalPending.toString()
        })
      }
      setFeeEdits(initialFees)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleVerify = async (id: string, status: 'success' | 'failed') => {
    if (!confirm(`Are you sure you want to ${status === 'success' ? 'confirm' : 'reject'} this payment?`)) return

    setProcessingId(id)
    try {
      await verifyPayment(id, status)
      setPendingPayments(prev => prev.filter(p => p.id !== id))
      toast.success(`Payment ${status === 'success' ? 'confirmed' : 'rejected'} successfully.`)
      await loadData()
    } catch (err) {
      toast.error('Action failed.')
    } finally {
      setProcessingId(null)
    }
  }

  const handleUpdateFee = async (parentId: string, amount: string) => {
    try {
      await updateParentOutstandingFee(parentId, amount)
      toast.success('Parent outstanding fee updated in real-time on their dashboard!')
      await loadData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to update fee')
    }
  }

  const filteredParents = parents.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <DashboardLayout role="admin">
      <div className="p-8 max-w-7xl mx-auto space-y-10 min-h-screen">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">School Fees & Billing Control</h1>
          <p className="text-slate-500 font-medium text-lg">Verify manual bank transfers and update parent outstanding fee balances in real-time.</p>
        </div>

        {loading ? (
          <div className="p-24 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Accessing financial logs...</p>
          </div>
        ) : (
          <Tabs defaultValue="verifications" className="space-y-8">
            <TabsList className="bg-slate-100 p-1.5 rounded-2xl h-14 border-none shadow-sm gap-2 w-full md:w-fit">
              <TabsTrigger value="verifications" className="font-black text-sm rounded-xl h-11 px-8 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">
                Verification Queue ({payments.length})
              </TabsTrigger>
              <TabsTrigger value="parent-fees" className="font-black text-sm rounded-xl h-11 px-8 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">
                Parent Fee Balances
              </TabsTrigger>
            </TabsList>

            <TabsContent value="verifications">
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
                          {payments.length === 0 ? (
                            <tr><td colSpan={5} className="p-24 text-center text-slate-400 italic font-bold">The queue is empty. All payments verified.</td></tr>
                          ) : (
                            payments.map((p) => (
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
                                   {p.receiptUrl && (
                                     <a href={p.receiptUrl} target="_blank" rel="noopener noreferrer">
                                       <Button variant="outline" className="rounded-xl font-black text-[10px] border-slate-200 text-slate-600 gap-2 h-10 hover:bg-slate-50">
                                          <ExternalLink size={14} /> VIEW RECEIPT
                                       </Button>
                                     </a>
                                   )}
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
                            ))
                          )}
                        </tbody>
                      </table>
                   </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="parent-fees">
              <Card className="border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] overflow-hidden bg-white">
                <CardHeader className="p-8 border-b border-slate-50">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <CardTitle className="text-xl font-black text-slate-900">Manage Outstanding Balances</CardTitle>
                      <CardDescription className="text-slate-400 font-bold">Instantly alter parent outstanding fees. Changes reflect in real-time.</CardDescription>
                    </div>
                    <div className="w-full md:w-72">
                      <Input
                        placeholder="Search parent name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-11 rounded-xl"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">
                          <th className="p-8">Parent Name</th>
                          <th className="p-8">Contact Email</th>
                          <th className="p-8">PhoneNumber</th>
                          <th className="p-8">Current Balance (₦)</th>
                          <th className="p-8 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {filteredParents.length === 0 ? (
                          <tr><td colSpan={5} className="p-24 text-center text-slate-400 italic font-bold">No parent profiles found.</td></tr>
                        ) : (
                          filteredParents.map((pt) => (
                            <tr key={pt.id} className="hover:bg-slate-50/30 transition-colors">
                              <td className="p-8 font-black text-slate-900">{pt.name}</td>
                              <td className="p-8 font-mono text-sm text-slate-500">{pt.email}</td>
                              <td className="p-8 text-slate-600 font-bold">{pt.phoneNumber || 'N/A'}</td>
                              <td className="p-8">
                                <div className="flex items-center gap-2">
                                  <span className="text-slate-400 font-bold">₦</span>
                                  <input
                                    type="number"
                                    value={feeEdits[pt.id] || '0'}
                                    onChange={(e) => setFeeEdits({ ...feeEdits, [pt.id]: e.target.value })}
                                    onBlur={() => handleUpdateFee(pt.id, feeEdits[pt.id])}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        handleUpdateFee(pt.id, feeEdits[pt.id])
                                      }
                                    }}
                                    className="w-28 h-10 px-2 rounded-lg border border-slate-200 font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                                  />
                                </div>
                              </td>
                              <td className="p-8 text-right">
                                <Button
                                  onClick={() => handleUpdateFee(pt.id, feeEdits[pt.id])}
                                  className="h-10 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs flex items-center gap-1.5 ml-auto shadow-md shadow-purple-50"
                                >
                                  <Save size={14} /> SAVE
                                </Button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  )
}
