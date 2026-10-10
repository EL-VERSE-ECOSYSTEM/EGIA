'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Wallet,
  Smartphone,
  Wifi,
  Coins,
  ShieldCheck,
  Calendar,
  DollarSign
} from 'lucide-react'
import { getAdminTeacherRequests, getAllTeachersWithWallets, approveTeacherRequest, payTeacherSalary, updateTeacherSalaryAmount, updateSchoolSalaryPaymentDateAction, getSchoolSalaryPaymentDateAction } from '@/app/actions/teacher'
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'
import { toast } from 'sonner'

export default function AdminTeacherRequestsPage() {
  const [requests, setRequests] = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [salaryPaymentDay, setSalaryPaymentDay] = useState<string>('25')
  const [savingDate, setSavingDate] = useState(false)

  // Custom states for interactive salary inputs
  const [salaryEdits, setSalaryEdits] = useState<Record<string, string>>({})

  const loadData = async () => {
    try {
      const r = await getAdminTeacherRequests()
      setRequests(r || [])
      const t = await getAllTeachersWithWallets()
      setTeachers(t || [])
      const dateRes = await getSchoolSalaryPaymentDateAction()
      if (dateRes?.salaryPaymentDate) {
        setSalaryPaymentDay(dateRes.salaryPaymentDate)
      }

      // Initialize salary inputs map
      const initialSalaries: Record<string, string> = {}
      if (t) {
        t.forEach((teacherRow: any) => {
          initialSalaries[teacherRow.id] = teacherRow.wallet?.salaryAmount || '150000.00'
        })
      }
      setSalaryEdits(initialSalaries)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateSalary = async (teacherId: string, amount: string) => {
    try {
      await updateTeacherSalaryAmount(teacherId, amount)
      toast.success('Teacher salary updated in real-time!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to update salary')
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Real-time synchronization on teacher_wallet
  useRealtimeSubscription('teacher_wallet', () => {
    loadData()
  })

  const handleSaveSalaryDate = async () => {
    setSavingDate(true)
    try {
      await updateSchoolSalaryPaymentDateAction(salaryPaymentDay)
      toast.success(`Date of salary payment set to day ${salaryPaymentDay} of every month in real-time!`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to update salary payment date.')
    } finally {
      setSavingDate(false)
    }
  }

  const handleApproveRequest = async (requestId: string, status: 'approved' | 'rejected') => {
    if (!confirm(`Are you sure you want to mark this request as ${status.toUpperCase()}?`)) return

    setProcessingId(requestId)
    try {
      await approveTeacherRequest(requestId, status)
      alert(`Request has been marked as ${status.toUpperCase()}.`)
      await loadData()
    } catch (err: any) {
      alert(err.message || 'Action failed')
    } finally {
      setProcessingId(null)
    }
  }

  const handlePaySalary = async (teacherId: string) => {
    if (!confirm('Are you sure you want to disburse the monthly salary for this teacher?')) return

    setProcessingId(teacherId)
    try {
      await payTeacherSalary(teacherId)
      alert('Salary disbursed successfully and added to teacher wallet balance!')
      await loadData()
    } catch (err: any) {
      alert(err.message || 'Action failed')
    } finally {
      setProcessingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const s = (status || 'pending').toLowerCase()
    if (s === 'approved' || s === 'success') {
      return (
        <Badge className="bg-emerald-100 text-emerald-800 border-none font-black flex items-center gap-1 py-1 px-3 rounded-lg">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Approved
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
        <XCircle className="w-3.5 h-3.5 text-red-600" /> Rejected
      </Badge>
    )
  }

  return (
    <DashboardLayout role="admin">
      <div className="p-8 max-w-7xl mx-auto space-y-10 min-h-screen">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Staff Payroll & Utility Approvals</h1>
          <p className="text-slate-500 font-medium text-lg">Approve teacher airtime/data allowance requests and disburse monthly salaries.</p>
        </div>

        {loading ? (
          <div className="p-24 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Accessing system files...</p>
          </div>
        ) : (
          <Tabs defaultValue="requests" className="space-y-8">
            <TabsList className="bg-slate-100 p-1.5 rounded-2xl h-14 border-none shadow-sm gap-2 w-full md:w-fit">
              <TabsTrigger value="requests" className="font-black text-sm rounded-xl h-11 px-8 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">
                Utility Requests
              </TabsTrigger>
              <TabsTrigger value="payroll" className="font-black text-sm rounded-xl h-11 px-8 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">
                Teacher Payroll Ledger
              </TabsTrigger>
            </TabsList>

            <TabsContent value="requests" className="space-y-6">
              <Card className="border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] overflow-hidden bg-white">
                <CardHeader className="p-10 pb-4">
                  <CardTitle className="text-2xl font-black text-slate-900">Pending Approvals</CardTitle>
                  <CardDescription className="text-slate-400 font-bold">Review and resolve airtime and data requests submitted by academic staff.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">
                          <th className="p-8">Teacher Name</th>
                          <th className="p-8">Utility Details</th>
                          <th className="p-8">Phone Number</th>
                          <th className="p-8">Value (₦)</th>
                          <th className="p-8">Status</th>
                          <th className="p-8 text-right">Verification</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {requests.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-24 text-center text-slate-400 italic font-bold">
                              No utility requests found.
                            </td>
                          </tr>
                        ) : (
                          requests.map((r) => (
                            <tr key={r.id} className="hover:bg-slate-50/30 transition-colors">
                              <td className="p-8 font-black text-slate-900">{r.teacherName}</td>
                              <td className="p-8 font-semibold text-slate-700">
                                <span className="inline-flex items-center gap-1.5 uppercase tracking-wider text-xs font-black mr-2">
                                  {r.type === 'DATA' ? <Wifi className="w-4 h-4 text-purple-600" /> : <Smartphone className="w-4 h-4 text-emerald-600" />}
                                  {r.type}
                                </span>
                                {r.details}
                              </td>
                              <td className="p-8 font-mono text-sm text-slate-600">{r.phoneNumber}</td>
                              <td className="p-8 font-black text-emerald-600">₦{parseFloat(r.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                              <td className="p-8">{getStatusBadge(r.status)}</td>
                              <td className="p-8 text-right">
                                {r.status === 'pending' ? (
                                  <div className="flex justify-end gap-3">
                                    <Button
                                      onClick={() => handleApproveRequest(r.id, 'approved')}
                                      disabled={processingId === r.id}
                                      className="h-10 px-5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-md shadow-purple-100"
                                    >
                                      APPROVE
                                    </Button>
                                    <Button
                                      onClick={() => handleApproveRequest(r.id, 'rejected')}
                                      disabled={processingId === r.id}
                                      variant="outline"
                                      className="h-10 px-5 rounded-xl border-2 border-red-50 text-red-600 font-black text-xs hover:bg-red-50"
                                    >
                                      REJECT
                                    </Button>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 font-bold text-xs">Closed</span>
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
            </TabsContent>

            <TabsContent value="payroll" className="space-y-6">
              {/* Salary Payment Date Configuration Box */}
              <Card className="border-none shadow-xl shadow-slate-200 rounded-3xl bg-slate-900 text-white p-6 sm:p-8 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">Real-Time Payroll Setting</span>
                    <h3 className="text-xl font-black text-white flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-amber-400" /> Date of Monthly Salary Payment
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">
                      Specify the day of the month when teacher salaries are scheduled and automatically disbursed.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2">
                      <span className="text-xs text-slate-400 font-bold">Day of Month:</span>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={salaryPaymentDay}
                        onChange={(e) => setSalaryPaymentDay(e.target.value)}
                        className="w-16 bg-transparent font-black text-amber-400 text-sm focus:outline-none"
                      />
                    </div>
                    <Button
                      onClick={handleSaveSalaryDate}
                      disabled={savingDate}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl h-11 text-xs"
                    >
                      {savingDate ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Set Salary Date'}
                    </Button>
                  </div>
                </div>
              </Card>

              <Card className="border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] overflow-hidden bg-white">
                <CardHeader className="p-10 pb-4">
                  <CardTitle className="text-2xl font-black text-slate-900">Salary Disbursal Ledger</CardTitle>
                  <CardDescription className="text-slate-400 font-bold">Track and disburse monthly wages directly into teachers' available wallet balance.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">
                          <th className="p-8">Teacher Name</th>
                          <th className="p-8">Staff ID</th>
                          <th className="p-8">Monthly Salary</th>
                          <th className="p-8">Wallet Balance</th>
                          <th className="p-8">Salary Status</th>
                          <th className="p-8 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {teachers.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-24 text-center text-slate-400 italic font-bold">
                              No teacher profiles found in system directory.
                            </td>
                          </tr>
                        ) : (
                          teachers.map((t) => (
                            <tr key={t.id} className="hover:bg-slate-50/30 transition-colors">
                              <td className="p-8 font-black text-slate-900">{t.firstName} {t.lastName}</td>
                              <td className="p-8 font-mono text-sm text-slate-500 uppercase">{t.staffCode || 'N/A'}</td>
                              <td className="p-8">
                                <div className="flex items-center gap-2">
                                  <span className="text-slate-400 font-bold">₦</span>
                                  <input
                                    type="number"
                                    value={salaryEdits[t.id] || ''}
                                    onChange={(e) => setSalaryEdits({ ...salaryEdits, [t.id]: e.target.value })}
                                    onBlur={() => handleUpdateSalary(t.id, salaryEdits[t.id])}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        handleUpdateSalary(t.id, salaryEdits[t.id])
                                      }
                                    }}
                                    className="w-28 h-10 px-2 rounded-lg border border-slate-200 font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                                  />
                                </div>
                              </td>
                              <td className="p-8 font-black text-amber-600">₦{parseFloat(t.wallet?.balance || '0.00').toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                              <td className="p-8">
                                <Badge className={`border-none font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider ${t.wallet?.salaryStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800 animate-pulse'}`}>
                                  {t.wallet?.salaryStatus === 'paid' ? 'Paid' : 'Pending'}
                                </Badge>
                              </td>
                              <td className="p-8 text-right">
                                {t.wallet?.salaryStatus === 'pending' ? (
                                  <Button
                                    onClick={() => handlePaySalary(t.id)}
                                    disabled={processingId === t.id}
                                    className="h-10 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1.5 ml-auto shadow-md shadow-emerald-50"
                                  >
                                    <DollarSign className="w-3.5 h-3.5" /> PAY SALARY
                                  </Button>
                                ) : (
                                  <span className="text-emerald-600 font-bold text-xs flex items-center justify-end gap-1"><ShieldCheck className="w-4 h-4" /> Disbursed</span>
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
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  )
}
