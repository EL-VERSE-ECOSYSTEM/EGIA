'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Wallet,
  Smartphone,
  Wifi,
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  TrendingDown,
  Calendar,
  Send,
  Phone
} from 'lucide-react'
import { getTeacherWallet, getTeacherRequests, createDataAirtimeRequest } from '@/app/actions/teacher'

export default function TeacherWalletPage() {
  const [wallet, setWallet] = useState<any | null>(null)
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Request form state
  const [requestType, setRequestType] = useState<'DATA' | 'AIRTIME'>('DATA')
  const [amount, setAmount] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [details, setDetails] = useState('')

  const loadData = async () => {
    try {
      const w = await getTeacherWallet()
      setWallet(w)
      const r = await getTeacherRequests()
      setRequests(r || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !phoneNumber || !details) return alert('Please fill in all details')

    setSubmitting(true)
    try {
      await createDataAirtimeRequest({
        type: requestType,
        amount: parseFloat(amount),
        details,
        phoneNumber
      })
      alert('Your request has been submitted successfully and is waiting for administrator approval.')
      setAmount('')
      setPhoneNumber('')
      setDetails('')
      await loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to submit request')
    } finally {
      setSubmitting(false)
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
    <DashboardLayout role="teacher">
      <div className="p-8 max-w-7xl mx-auto space-y-10 min-h-screen">
        <div className="mb-10">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Staff Wallet & Utilities</h1>
          <p className="text-slate-500 text-lg font-medium">Access your salary details and request data/airtime allowances.</p>
        </div>

        {loading ? (
          <div className="p-24 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Accessing vault...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-10">
              {/* Wallet Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl bg-slate-900 text-white p-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Wallet size={120} />
                  </div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Available Balance</p>
                  <h3 className="text-4xl font-black text-amber-500 mt-2 font-mono">
                    ₦{parseFloat(wallet?.balance || '0').toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </h3>
                  <div className="h-[1px] bg-white/10 my-4" />
                  <p className="text-xs font-bold text-slate-400">Total allowance balance for airtime & data requests</p>
                </Card>

                <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl bg-white p-8 relative overflow-hidden">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Current Salary Status</p>
                  <div className="flex items-center gap-3 mt-3">
                    <h3 className="text-3xl font-black text-slate-900 font-mono">
                      ₦{parseFloat(wallet?.salaryAmount || '150000.00').toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </h3>
                    <Badge className={`border-none font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider ${wallet?.salaryStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800 animate-pulse'}`}>
                      {wallet?.salaryStatus === 'paid' ? 'Paid' : 'Pending'}
                    </Badge>
                  </div>
                  <div className="h-[1px] bg-slate-100 my-4" />
                  <p className="text-xs font-bold text-slate-400">Salary is paid monthly directly into your bank or wallet</p>
                </Card>
              </div>

              {/* Request Form */}
              <Card className="border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] overflow-hidden bg-white">
                <CardHeader className="p-10 pb-4">
                  <CardTitle className="text-2xl font-black text-slate-900">Request Data / Airtime Allowance</CardTitle>
                  <CardDescription className="text-slate-400 font-bold">Instantly submit data or airtime requests to be approved by administration.</CardDescription>
                </CardHeader>
                <CardContent className="px-10 pb-12">
                  <form onSubmit={handleSubmitRequest} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        type="button"
                        onClick={() => setRequestType('DATA')}
                        variant={requestType === 'DATA' ? 'default' : 'outline'}
                        className={`h-16 rounded-2xl font-black text-lg gap-2 flex items-center justify-center ${requestType === 'DATA' ? 'bg-purple-600 text-white shadow-lg shadow-purple-200' : 'border-slate-200 text-slate-700'}`}
                      >
                        <Wifi size={20} /> DATA
                      </Button>
                      <Button
                        type="button"
                        onClick={() => setRequestType('AIRTIME')}
                        variant={requestType === 'AIRTIME' ? 'default' : 'outline'}
                        className={`h-16 rounded-2xl font-black text-lg gap-2 flex items-center justify-center ${requestType === 'AIRTIME' ? 'bg-purple-600 text-white shadow-lg shadow-purple-200' : 'border-slate-200 text-slate-700'}`}
                      >
                        <Smartphone size={20} /> AIRTIME
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="phoneNumber" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Phone Number</Label>
                        <Input
                          id="phoneNumber"
                          placeholder="e.g. 08108854279"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          required
                          className="h-12 rounded-xl border-slate-200 font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="amount" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Request Value (₦)</Label>
                        <Input
                          id="amount"
                          type="number"
                          placeholder="e.g. 2000"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          required
                          className="h-12 rounded-xl border-slate-200 font-bold"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="details" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Plan / Provider Details</Label>
                      <Input
                        id="details"
                        placeholder="e.g. Airtel 10GB Monthly or MTN ₦2,000 Airtime"
                        value={details}
                        onChange={(e) => setDetails(e.target.value)}
                        required
                        className="h-12 rounded-xl border-slate-200 font-bold"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white h-14 rounded-2xl font-black text-lg shadow-xl shadow-purple-200 mt-6"
                    >
                      {submitting ? <Loader2 className="animate-spin" /> : 'SUBMIT REQUEST'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Request Ledger / Transaction History */}
            <div className="space-y-6">
              <h3 className="text-xl font-black text-slate-900 ml-2 flex items-center gap-2">
                Transaction History
              </h3>
              <Card className="border-none shadow-xl shadow-slate-100 rounded-[2.5rem] bg-white overflow-hidden">
                <CardContent className="p-0 divide-y divide-slate-50 max-h-[32rem] overflow-y-auto">
                  {requests.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 font-bold italic">
                      No previous utility requests made.
                    </div>
                  ) : (
                    requests.map((r) => (
                      <div key={r.id} className="p-6 hover:bg-slate-50/50 transition-colors flex justify-between items-center">
                        <div className="space-y-1">
                          <p className="font-black text-slate-900 text-sm flex items-center gap-2">
                            {r.type === 'DATA' ? <Wifi className="w-4 h-4 text-purple-600" /> : <Smartphone className="w-4 h-4 text-emerald-600" />}
                            {r.type} Utility
                          </p>
                          <p className="text-xs text-slate-500 font-medium">{r.details}</p>
                          <p className="text-[10px] text-slate-400 font-semibold">{r.phoneNumber} • {new Date(r.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right space-y-2">
                          <p className="font-black text-slate-900">₦{parseFloat(r.amount).toLocaleString()}</p>
                          {getStatusBadge(r.status)}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
