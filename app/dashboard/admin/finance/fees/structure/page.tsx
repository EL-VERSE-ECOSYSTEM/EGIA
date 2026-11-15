'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  setFees,
  updateFeeStructureAction,
  getFeeStructureClassesAction,
  getFeeStructuresAction,
  deleteFeeStructureAction,
} from '@/app/actions/admin'
import { getSchoolPaymentConfigAction, saveSchoolPaymentConfigAction } from '@/app/actions/payment-config'
import { useNigerianBanks } from '@/hooks/useNigerianBanks'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, Save, Pencil, Layers, CreditCard, Building, Link as LinkIcon, CheckCircle2, Bell, Sparkles, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

export default function FeesStructurePage() {
  const [loadingFee, setLoadingFee] = useState(false)
  const [loadingConfig, setLoadingConfig] = useState(false)
  const [feeStructures, setFeeStructures] = useState<any[]>([])
  const [classes, setClasses] = useState<string[]>([])
  const [editingFeeId, setEditingFeeId] = useState<string | null>(null)

  // Fee Form State
  const [formData, setFormData] = useState({
    class: '',
    department: '',
    feeType: 'Tuition Fees',
    amount: '',
    dueDate: '',
    warningDate: ''
  })

  // School Payment Configuration State
  const { banks, loading: loadingBanks } = useNigerianBanks()
  const [usePaystack, setUsePaystack] = useState(true)
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountName, setAccountName] = useState('')
  const [customLink, setCustomLink] = useState('')
  const [instructions, setInstructions] = useState('')

  // Pop-up Notification State
  const [popupNotification, setPopupNotification] = useState<{
    open: boolean
    title: string
    message: string
    details?: Record<string, any>
  }>({
    open: false,
    title: '',
    message: ''
  })

  const fetchFeeStructures = async () => {
    try {
      const data = await getFeeStructuresAction()
      setFeeStructures(data || [])
    } catch (err) {
      console.warn('Could not fetch fee structures:', err)
    }
  }

  const fetchClasses = async () => {
    try {
      const schoolClasses = await getFeeStructureClassesAction()
      setClasses(schoolClasses)
      setFormData((current) => ({ ...current, class: current.class || schoolClasses[0] || '' }))
    } catch (error) {
      console.error('Could not fetch school classes:', error)
      toast.error(error instanceof Error ? error.message : 'Could not load registered school classes.')
    }
  }

  const fetchPaymentConfig = async () => {
    try {
      const config = await getSchoolPaymentConfigAction()
      if (config) {
        setUsePaystack(config.usePaystack)
        setBankName(config.bankName || '')
        setAccountNumber(config.accountNumber || '')
        setAccountName(config.accountName || '')
        setCustomLink(config.customPaymentLink || '')
        setInstructions(config.instructions || '')
      }
    } catch (err) {
      console.warn('Could not fetch payment config:', err)
    }
  }

  useEffect(() => {
    fetchFeeStructures()
    fetchClasses()
    fetchPaymentConfig()

    // Real-Time Supabase Database Subscriptions
    const supabase = createClient()
    const feeChannel = supabase
      .channel('realtime-fee-structure')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fee_structure' }, () => {
        fetchFeeStructures()
      })
      .subscribe()

    const configChannel = supabase
      .channel('realtime-payment-config')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'school_payment_config' }, () => {
        fetchPaymentConfig()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(feeChannel)
      supabase.removeChannel(configChannel)
    }
  }, [])

  const handleFeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.class || !formData.feeType || !formData.amount) {
      toast.error('Please fill in all required fee fields.')
      return
    }

    setLoadingFee(true)
    try {
      if (editingFeeId) {
        await updateFeeStructureAction(editingFeeId, formData)
        toast.success('Fee structure updated.')
      } else {
        await setFees(formData)
        toast.success('Fee structure added.')
      }

      // Pop-up Notification
      setPopupNotification({
        open: true,
        title: editingFeeId ? 'Fee Structure Updated' : 'Fee Structure Added',
        message: 'The school-scoped fee configuration has been saved and is active for matching students.',
        details: {
          Class: formData.class,
          Department: formData.department || 'General',
          'Fee Category': formData.feeType,
          Amount: `₦${Number(formData.amount).toLocaleString()}`,
          'Due Date': formData.dueDate || 'Standard',
          'Warning Date': formData.warningDate || 'None'
        }
      })

      setEditingFeeId(null)
      setFormData({ class: classes[0] || '', department: '', feeType: '', amount: '', dueDate: '', warningDate: '' })
      fetchFeeStructures()
    } catch (error: any) {
      toast.error(error.message || 'Failed to save fee structure')
    } finally {
      setLoadingFee(false)
    }
  }

  const handleConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoadingConfig(true)
    try {
      const res = await saveSchoolPaymentConfigAction({
        usePaystack,
        bankName,
        accountNumber,
        accountName,
        customPaymentLink: customLink,
        instructions
      })

      if (res.success) {
        toast.success('School payment settings updated in real time!')
        setPopupNotification({
          open: true,
          title: 'Payment Configuration Uploaded in Real Time',
          message: 'Your school payment preferences have been updated in real time with Supabase Database. All parent payment portals reflect this instantly.',
          details: {
            'Payment Path': usePaystack ? 'Paystack Gateway (Automated)' : 'School Bank Account / Custom Link',
            Bank: usePaystack ? 'Paystack Hosted' : bankName || 'Not Set',
            'Account Number': usePaystack ? 'N/A' : accountNumber || 'Not Set',
            'Account Name': usePaystack ? 'N/A' : accountName || 'Not Set'
          }
        })
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update payment settings')
    } finally {
      setLoadingConfig(false)
    }
  }

  const handleDeleteFee = async (id: string) => {
    if (!confirm('Are you sure you want to delete this fee structure?')) return
    try {
      await deleteFeeStructureAction(id)
      toast.success('Fee structure deleted in real time')
      if (editingFeeId === id) {
        setEditingFeeId(null)
        setFormData({ class: classes[0] || '', department: '', feeType: '', amount: '', dueDate: '', warningDate: '' })
      }
      fetchFeeStructures()
    } catch (err: any) {
      toast.error(err.message || 'Delete failed')
    }
  }

  return (
    <DashboardLayout role="admin">
      <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-10">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 text-xs font-black uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Real-Time Supabase Database Architecture
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Financial & Payment Architecture</h1>
          <p className="text-slate-500 font-medium text-sm sm:text-base mt-1">
            Define fee structures per class and department, and configure automated Paystack or custom school bank accounts in real time.
          </p>
        </div>

        {/* Real-Time Pop-Up Notification Modal */}
        {popupNotification.open && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-500/30 flex items-center justify-center text-emerald-600 shrink-0">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white leading-snug">{popupNotification.title}</h3>
                  <p className="text-xs font-bold text-emerald-600 flex items-center gap-1 mt-0.5">
                    <Bell className="w-3 h-3" /> Live Supabase Database Confirmation
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                {popupNotification.message}
              </p>

              {popupNotification.details && (
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 space-y-2 text-xs font-mono">
                  {Object.entries(popupNotification.details).map(([key, val]) => (
                    <div key={key} className="flex justify-between border-b border-slate-200/50 dark:border-slate-800 pb-1.5 last:border-0 last:pb-0">
                      <span className="text-slate-400 font-sans">{key}:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{String(val)}</span>
                    </div>
                  ))}
                </div>
              )}

              <Button
                onClick={() => setPopupNotification({ ...popupNotification, open: false })}
                className="w-full h-12 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs uppercase tracking-wider"
              >
                Acknowledge & Close
              </Button>
            </div>
          </div>
        )}

        {/* SECTION 1: NEW FEE CONFIGURATION */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 border-none shadow-2xl shadow-slate-200/60 rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="p-8 sm:p-10 border-b border-slate-100">
              <CardTitle className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <Plus className="text-amber-600" /> New Fee Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 sm:p-10">
              <form onSubmit={handleFeeSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Class Level *</Label>
                    <Select value={formData.class} onValueChange={(v) => setFormData({ ...formData, class: v })}>
                      <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-slate-200 font-bold text-xs">
                        <SelectValue placeholder="Select Class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fee-department" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Department (Optional)</Label>
                    <Input id="fee-department" value={formData.department} maxLength={80}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      placeholder="Blank applies to all departments"
                      className="h-12 rounded-2xl bg-slate-50 border-slate-200 font-bold text-xs" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="fee-category" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Fee Category *</Label>
                    <Input id="fee-category" required maxLength={100} value={formData.feeType}
                      onChange={(e) => setFormData({ ...formData, feeType: e.target.value })}
                      placeholder="e.g. Tuition Fees, Uniform, Transport"
                      className="h-12 rounded-2xl bg-slate-50 border-slate-200 font-bold text-xs" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Amount (₦) *</Label>
                    <Input
                      type="number"
                      required
                      min="0.01"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="h-12 rounded-2xl bg-slate-50 border-slate-200 font-black text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Standard Due Date</Label>
                    <Input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="h-12 rounded-2xl bg-slate-50 border-slate-200 font-bold text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-amber-600 tracking-widest ml-1">Date of Warning for Parents (Real-Time Alert)</Label>
                    <Input
                      type="date"
                      value={formData.warningDate}
                      onChange={(e) => setFormData({ ...formData, warningDate: e.target.value })}
                      className="h-12 rounded-2xl bg-amber-50/50 border-amber-300 font-bold text-xs text-amber-900"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loadingFee || !classes.length}
                  className="w-full h-14 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs uppercase tracking-wider shadow-xl shadow-amber-200/50 gap-2 transition"
                >
                  <Save size={18} /> {loadingFee ? 'SAVING FEE STRUCTURE...' : editingFeeId ? 'UPDATE FEE STRUCTURE' : 'PUBLISH FEE STRUCTURE'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* SIDE CARD */}
          <div className="space-y-6">
            <Card className="border-none shadow-xl shadow-slate-200/60 rounded-[2.5rem] bg-slate-900 text-white p-8 space-y-6">
              <Layers className="text-amber-500 w-10 h-10" />
              <div>
                <h3 className="text-2xl font-black mb-2">Automated Real-Time Sync</h3>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                  Published fee structures and payment settings sync instantly via Supabase Database real-time subscriptions. Parents receive instant pop-up notifications upon billing creation.
                </p>
              </div>
            </Card>
          </div>
        </div>

        {/* SECTION 2: SCHOOL PAYMENT CONFIGURATION (PATH A vs PATH B) */}
        <Card className="border-none shadow-2xl shadow-slate-200/60 rounded-[2.5rem] overflow-hidden bg-white p-8 sm:p-10 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">School Payment Gateway & Link Configuration</h2>
              <p className="text-xs text-slate-500 font-medium">Configure automated Paystack gateway or bank details drawn in real time from Supabase Database</p>
            </div>
          </div>

          <form onSubmit={handleConfigSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={() => setUsePaystack(true)}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                  usePaystack ? 'border-amber-600 bg-amber-50/50 shadow-sm' : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-black text-sm text-slate-900">Path A: Paystack Payment Gateway</span>
                  {usePaystack && <CheckCircle2 className="w-5 h-5 text-amber-600" />}
                </div>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Automated checkout for cards, bank transfer, and USSD with real-time clearance.
                </p>
              </div>

              <div
                onClick={() => setUsePaystack(false)}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                  !usePaystack ? 'border-amber-600 bg-amber-50/50 shadow-sm' : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-black text-sm text-slate-900">Path B: School Bank Account / Custom Link</span>
                  {!usePaystack && <CheckCircle2 className="w-5 h-5 text-amber-600" />}
                </div>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Direct transfer to your school bank account or external link with receipt upload.
                </p>
              </div>
            </div>

            {!usePaystack && (
              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
                <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
                  <Building className="w-5 h-5 text-amber-600" />
                  <h3 className="text-sm font-black text-slate-900">School Bank Account Details (Real-Time Supabase Database Banks)</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-600 mb-1">Bank Name (Supabase DB Real Time) *</label>
                    <select
                      required={!usePaystack}
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-600"
                    >
                      <option value="">Select Bank...</option>
                      {banks.map((b) => (
                        <option key={b.code} value={b.name}>
                          {b.name} ({b.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase text-slate-600 mb-1">Account Number *</label>
                    <input
                      type="text"
                      required={!usePaystack}
                      placeholder="e.g. 1012345678"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-600"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-black uppercase text-slate-600 mb-1">Account Name *</label>
                    <input
                      type="text"
                      required={!usePaystack}
                      placeholder="e.g. EL Learners App"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-600"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-black uppercase text-slate-600 mb-1">Custom Payment Link (Optional)</label>
                    <div className="relative">
                      <LinkIcon className="w-4 h-4 absolute left-4 top-3.5 text-slate-400" />
                      <input
                        type="url"
                        placeholder="https://paystack.com/pay/el-school-fees"
                        value={customLink}
                        onChange={(e) => setCustomLink(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-600"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-black uppercase text-slate-600 mb-1">Instructions for Parents</label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Please include learner's admission number in narration."
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-600"
                    />
                  </div>
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={loadingConfig}
              className="w-full h-14 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs uppercase tracking-wider transition shadow-lg"
            >
              {loadingConfig ? 'SAVING PAYMENT CONFIG...' : 'SAVE SCHOOL PAYMENT CONFIGURATION IN REAL TIME'}
            </Button>
          </form>
        </Card>

        {/* SECTION 3: ACTIVE FEE STRUCTURES LIST */}
        <Card className="border-none shadow-2xl shadow-slate-200/60 rounded-[2.5rem] overflow-hidden bg-white p-8 sm:p-10 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-xl font-black text-slate-900">Active Fee Structures ({feeStructures.length})</h2>
            <Button variant="ghost" size="sm" onClick={fetchFeeStructures} className="text-xs font-bold text-amber-600 flex items-center gap-1">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Real-Time List
            </Button>
          </div>

          {feeStructures.length === 0 ? (
            <p className="text-xs font-bold text-slate-400 italic text-center py-8">No active fee structures configured in database yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase font-black tracking-wider">
                    <th className="py-3 px-4">Class</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Fee Category</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4 text-amber-600">Warning Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {feeStructures.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-50 transition font-bold text-slate-800">
                      <td className="py-3.5 px-4 font-black text-amber-700">{f.class}</td>
                      <td className="py-3.5 px-4">{f.department || 'GENERAL'}</td>
                      <td className="py-3.5 px-4">{f.feeType}</td>
                      <td className="py-3.5 px-4 font-black">₦{Number(f.amount).toLocaleString()}</td>
                      <td className="py-3.5 px-4 text-slate-500">{f.dueDate || 'Standard'}</td>
                      <td className="py-3.5 px-4 text-amber-700 font-bold">{f.warningDate ? new Date(f.warningDate).toLocaleDateString() : 'None'}</td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setEditingFeeId(f.id)
                            setFormData({
                              class: f.class,
                              department: f.department || '',
                              feeType: f.feeType,
                              amount: String(f.amount),
                              dueDate: f.dueDate || '',
                              warningDate: f.warningDate || '',
                            })
                            window.scrollTo({ top: 0, behavior: 'smooth' })
                          }}
                          className="p-2 rounded-xl text-amber-700 hover:bg-amber-50 transition"
                          title="Edit fee structure"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteFee(f.id)}
                          className="p-2 rounded-xl text-red-500 hover:bg-red-50 transition"
                          title="Delete fee structure"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}
