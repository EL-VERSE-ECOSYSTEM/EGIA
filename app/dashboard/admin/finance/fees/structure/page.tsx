'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { setFees } from '@/app/actions/admin'
import { getSchoolPaymentConfigAction, saveSchoolPaymentConfigAction } from '@/app/actions/payment-config'
import { useNigerianBanks } from '@/hooks/useNigerianBanks'
import { Wallet, Plus, Save, Layers, CreditCard, Building, Link as LinkIcon, CheckCircle2, X } from 'lucide-react'
import { toast } from 'sonner'

export default function FeesStructurePage() {
  const { banks, loading: loadingBanks } = useNigerianBanks()
  const [loading, setLoading] = useState(false)
  const [savingConfig, setSavingConfig] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successDetails, setSuccessDetails] = useState<any>(null)

  // Fee Form State
  const [formData, setFormData] = useState({
    class: '',
    department: '',
    feeType: 'Tuition Fees',
    amount: '',
    dueDate: ''
  })

  // Payment Config State
  const [useKorapay, setUseKorapay] = useState(true)
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountName, setAccountName] = useState('')
  const [customLink, setCustomLink] = useState('')
  const [instructions, setInstructions] = useState('')

  const classes = ['Primary 3', 'Primary 4', 'Primary 5', 'Primary 6', 'JSS1', 'JSS2', 'JSS3', 'SSS1', 'SSS2', 'SSS3']
  const departments = ['Science', 'Art', 'Commercial']
  const feeTypes = ['Tuition Fees', 'Development Levy', 'Examination Fees', 'Sports Fees', 'PTA Levies', 'Library Fees', 'ICT Fees', 'Uniform Fees']

  useEffect(() => {
    async function loadConfig() {
      try {
        const config = await getSchoolPaymentConfigAction()
        if (config) {
          setUseKorapay(config.useKorapay)
          setBankName(config.bankName || '')
          setAccountNumber(config.accountNumber || '')
          setAccountName(config.accountName || '')
          setCustomLink(config.customPaymentLink || '')
          setInstructions(config.instructions || '')
        }
      } catch (e) {
        console.warn('Could not load payment configuration:', e)
      }
    }
    loadConfig()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await setFees(formData)
      setSuccessDetails({ ...formData })
      setShowSuccessModal(true)
      setFormData({ class: '', department: '', feeType: 'Tuition Fees', amount: '', dueDate: '' })
    } catch (error: any) {
      toast.error(error.message || 'Failed to save fee structure')
    } finally {
      setLoading(false)
    }
  }

  const handleSavePaymentConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingConfig(true)
    try {
      const res = await saveSchoolPaymentConfigAction({
        useKorapay,
        bankName,
        accountNumber,
        accountName,
        customPaymentLink: customLink,
        instructions
      })
      if (res.success) {
        toast.success('School payment settings updated successfully in real time!')
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update payment settings')
    } finally {
      setSavingConfig(false)
    }
  }

  return (
    <DashboardLayout role="admin">
      <div className="p-8 max-w-6xl mx-auto space-y-10 relative">
        {/* Real-time Confirmation Pop-up Notification Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
            <Card className="max-w-md w-full border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden p-8 relative text-slate-900">
              <button
                onClick={() => setShowSuccessModal(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full transition"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center space-y-3 pb-6 border-b border-dashed border-slate-100">
                <div className="mx-auto bg-emerald-100 p-4 rounded-full w-fit text-emerald-600">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900">Fee Structure Uploaded!</h3>
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mt-1">
                    Synchronized in Real Time with Supabase DB
                  </p>
                </div>
              </div>

              {successDetails && (
                <div className="py-6 space-y-3 text-sm font-medium">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Class Level:</span>
                    <span className="font-bold text-slate-900">{successDetails.class}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Department:</span>
                    <span className="font-bold text-slate-900">{successDetails.department || 'General'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Fee Category:</span>
                    <span className="font-bold text-slate-900">{successDetails.feeType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Amount:</span>
                    <span className="font-mono font-black text-emerald-600 text-lg">
                      ₦{parseFloat(successDetails.amount || '0').toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Due Date:</span>
                    <span className="font-bold text-slate-900">{successDetails.dueDate}</span>
                  </div>
                </div>
              )}

              <Button
                onClick={() => setShowSuccessModal(false)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white h-12 rounded-xl font-bold flex items-center justify-center gap-1.5"
              >
                OK, GREAT
              </Button>
            </Card>
          </div>
        )}

        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Financial Architecture & Payment Configuration</h1>
          <p className="text-slate-500 font-medium text-lg">Define fee structures and configure school payment collection channels in real time.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="p-10 border-b border-slate-50">
              <CardTitle className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <Plus className="text-amber-600" /> New Fee Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="p-10">
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Class Level</Label>
                    <Select value={formData.class} onValueChange={(v) => setFormData({ ...formData, class: v })}>
                      <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none font-bold">
                        <SelectValue placeholder="Select Class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Department (Optional)</Label>
                    <Select value={formData.department} onValueChange={(v) => setFormData({ ...formData, department: v })}>
                      <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none font-bold">
                        <SelectValue placeholder="General / All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GENERAL">General / All</SelectItem>
                        {departments.map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Fee Category</Label>
                    <Select value={formData.feeType} onValueChange={(v) => setFormData({ ...formData, feeType: v })}>
                      <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {feeTypes.map((f) => (
                          <SelectItem key={f} value={f}>
                            {f}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Amount (₦)</Label>
                    <Input
                      type="number"
                      required
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="h-14 rounded-2xl bg-slate-50 border-none font-black text-lg"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Standard Due Date</Label>
                  <Input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="h-14 rounded-2xl bg-slate-50 border-none font-bold"
                  />
                </div>

                <Button
                  disabled={loading}
                  className="w-full h-16 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-black text-lg shadow-xl shadow-amber-200 gap-2"
                >
                  <Save size={20} /> {loading ? 'SAVING...' : 'PUBLISH FEE STRUCTURE'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-8">
            <Card className="border-none shadow-xl shadow-slate-100 rounded-[2.5rem] bg-slate-900 text-white p-8">
              <div className="space-y-6">
                <Layers className="text-amber-500 w-10 h-10" />
                <div>
                  <h3 className="text-2xl font-black mb-2">Automated Real-Time Billing</h3>
                  <p className="text-sm text-slate-400 font-medium">
                    Fee structures are synchronized live with Supabase Database and applied immediately to matching ward accounts.
                  </p>
                </div>
              </div>
            </Card>

            {/* School Payment Channel Settings Section */}
            <Card className="border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] overflow-hidden bg-white">
              <CardHeader className="p-8 border-b border-slate-50">
                <CardTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <CreditCard className="text-purple-600 w-5 h-5" /> Payment Collection Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <form onSubmit={handleSavePaymentConfig} className="space-y-6">
                  <div>
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">
                      Payment Collection Gateway
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setUseKorapay(true)}
                        className={`p-3 rounded-xl border-2 text-left transition ${
                          useKorapay ? 'border-purple-600 bg-purple-50 text-purple-900 font-black' : 'border-slate-200 text-slate-600 font-bold'
                        }`}
                      >
                        <span className="text-xs block">Korapay Online</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setUseKorapay(false)}
                        className={`p-3 rounded-xl border-2 text-left transition ${
                          !useKorapay ? 'border-purple-600 bg-purple-50 text-purple-900 font-black' : 'border-slate-200 text-slate-600 font-bold'
                        }`}
                      >
                        <span className="text-xs block">Bank Account</span>
                      </button>
                    </div>
                  </div>

                  {!useKorapay && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div>
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">
                          Bank Name (Live Supabase DB)
                        </Label>
                        <select
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-600"
                        >
                          <option value="">Select Bank...</option>
                          {banks.map((b) => (
                            <option key={b.code} value={b.name}>
                              {b.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Account Number</Label>
                        <Input
                          type="text"
                          placeholder="e.g. 1012345678"
                          value={accountNumber}
                          onChange={(e) => setAccountNumber(e.target.value)}
                          className="h-10 rounded-xl bg-slate-50 border-slate-200 text-xs font-bold"
                        />
                      </div>

                      <div>
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Account Name</Label>
                        <Input
                          type="text"
                          placeholder="e.g. EL GOODNEWS ACADEMY"
                          value={accountName}
                          onChange={(e) => setAccountName(e.target.value)}
                          className="h-10 rounded-xl bg-slate-50 border-slate-200 text-xs font-bold"
                        />
                      </div>
                    </div>
                  )}

                  <Button
                    disabled={savingConfig}
                    className="w-full h-12 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs uppercase tracking-wider"
                  >
                    {savingConfig ? 'SAVING...' : 'SAVE PAYMENT CONFIG'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
