'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { getSchoolPaymentConfigAction, saveSchoolPaymentConfigAction } from '@/app/actions/payment-config'
import { useNigerianBanks } from '@/hooks/useNigerianBanks'
import { createClient } from '@/lib/supabase/client'
import { CreditCard, Building, Link as LinkIcon, FileText, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminPaymentSettingsPage() {
  const { banks, loading: loadingBanks } = useNigerianBanks()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [schoolId, setSchoolId] = useState<string>('')

  const [useKorapay, setUseKorapay] = useState(true)
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountName, setAccountName] = useState('')
  const [customLink, setCustomLink] = useState('')
  const [instructions, setInstructions] = useState('')

  const fetchConfig = async () => {
    try {
      const config = await getSchoolPaymentConfigAction(schoolId)
      if (config) {
        setUseKorapay(config.useKorapay)
        setBankName(config.bankName || '')
        setAccountNumber(config.accountNumber || '')
        setAccountName(config.accountName || '')
        setCustomLink(config.customPaymentLink || '')
        setInstructions(config.instructions || '')
      }
    } catch (err: any) {
      toast.error('Could not load payment configuration')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConfig()

    const supabase = createClient()
    const configChannel = supabase
      .channel('realtime-payment-config-settings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'school_payment_config' }, () => {
        fetchConfig()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(configChannel)
    }
  }, [schoolId])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await saveSchoolPaymentConfigAction({
        schoolId,
        useKorapay,
        bankName,
        accountNumber,
        accountName,
        customPaymentLink: customLink,
        instructions
      })
      if (res.success) {
        toast.success('Payment settings updated successfully!')
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save payment settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout role="admin">
      <div className="p-6 sm:p-10 max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">School Payment Configuration</h1>
          <p className="text-slate-500 text-sm font-semibold mt-1">
            Configure how parents pay school fees — choose automated online Korapay gateway or your school's custom bank account & payment links.
          </p>
        </div>

        {loading ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-purple-600 mb-2" />
            <p className="text-xs font-bold text-slate-500">Loading payment settings...</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            {/* Gateway Mode Selection */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900">Payment Path Selection</h2>
                    <p className="text-xs text-slate-500 font-medium">Toggle between automated Korapay or manual bank transfer</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  onClick={() => setUseKorapay(true)}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                    useKorapay
                      ? 'border-purple-600 bg-purple-50/50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-black text-sm text-slate-900">Path A: Korapay Gateway</span>
                    {useKorapay && <CheckCircle2 className="w-5 h-5 text-purple-600" />}
                  </div>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Automated online payment modal for cards, USSD, and bank transfers. Direct clearance on payment success.
                  </p>
                </div>

                <div
                  onClick={() => setUseKorapay(false)}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                    !useKorapay
                      ? 'border-purple-600 bg-purple-50/50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-black text-sm text-slate-900">Path B: School Bank / Link</span>
                    {!useKorapay && <CheckCircle2 className="w-5 h-5 text-purple-600" />}
                  </div>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Parents transfer to your bank account or payment link and upload transfer receipt for admin approval.
                  </p>
                </div>
              </div>
            </div>

            {/* School Bank Account Details (Path B) */}
            {!useKorapay && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in duration-200">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900">School Bank Account Information</h2>
                    <p className="text-xs text-slate-500 font-medium">Provided to parents when uploading payment receipts</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-600 mb-1">Bank Name *</label>
                    <select
                      required={!useKorapay}
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-600"
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
                      required={!useKorapay}
                      placeholder="e.g. 1012345678"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-600"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-black uppercase text-slate-600 mb-1">Account Name *</label>
                    <input
                      type="text"
                      required={!useKorapay}
                      placeholder="e.g. EL GOODNEWS INTERNATIONAL ACADEMY"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-600"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-black uppercase text-slate-600 mb-1">Custom External Payment Link (Optional)</label>
                    <div className="relative">
                      <LinkIcon className="w-4 h-4 absolute left-4 top-3.5 text-slate-400" />
                      <input
                        type="url"
                        placeholder="https://paystack.com/pay/el-school-fees"
                        value={customLink}
                        onChange={(e) => setCustomLink(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-600"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-black uppercase text-slate-600 mb-1">Payment Instructions for Parents</label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Please include your child's Admission Number in the transfer remarks/narration."
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-600"
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-4 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs uppercase tracking-wider shadow-lg transition disabled:opacity-50"
            >
              {saving ? 'Saving Payment Settings...' : 'Save School Payment Settings'}
            </button>
          </form>
        )}
      </div>
    </DashboardLayout>
  )
}
