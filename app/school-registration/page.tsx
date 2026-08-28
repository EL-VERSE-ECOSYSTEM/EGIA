'use client'

import { useState } from 'react'
import { registerSchoolAction, confirmSchoolPaymentAction } from '@/app/actions/school'
import { CheckCircle2, Building2, Sparkles, CreditCard, Download, ShieldCheck, ArrowRight, BookOpen, ExternalLink } from 'lucide-react'

const AVAILABLE_CLASSES = [
  'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6',
  'JSS1', 'JSS2', 'JSS3',
  'SSS1', 'SSS2', 'SSS3'
]

export default function SchoolRegistrationPage() {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    adminName: '',
    adminPhone: '',
    adminEmail: '',
    adminPassword: '',
    allowParents: true,
  })

  const [selectedClasses, setSelectedClasses] = useState<string[]>([...AVAILABLE_CLASSES])
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // State for post-payment / confirmation modal
  const [pendingCheckout, setPendingCheckout] = useState<any>(null)
  const [registeredData, setRegisteredData] = useState<any>(null)
  const [showReceiptModal, setShowReceiptModal] = useState(false)

  const handleClassToggle = (cls: string) => {
    if (selectedClasses.includes(cls)) {
      if (selectedClasses.length === 1) return
      setSelectedClasses(selectedClasses.filter(c => c !== cls))
    } else {
      setSelectedClasses([...selectedClasses, cls])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')

    if (!formData.name || !formData.location || !formData.adminName || !formData.adminPhone || !formData.adminEmail) {
      setErrorMessage('Please fill in all required fields.')
      return
    }

    if (selectedClasses.length === 0) {
      setErrorMessage('Please select at least one class for registration.')
      return
    }

    setLoading(true)

    try {
      const res = await registerSchoolAction({
        ...formData,
        registeredClasses: selectedClasses,
      })

      if (!res.success || !res.schoolCode) {
        setErrorMessage(res.error || 'Registration failed')
        setLoading(false)
        return
      }

      setPendingCheckout(res)
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmPayment = async () => {
    if (!pendingCheckout) return
    setLoading(true)
    const confirmRes = await confirmSchoolPaymentAction(pendingCheckout.paymentReference)
    if (confirmRes.success) {
      setRegisteredData(confirmRes)
      setShowReceiptModal(true)
      setPendingCheckout(null)
    } else {
      setErrorMessage(confirmRes.error || 'Payment confirmation failed')
    }
    setLoading(false)
  }

  const handlePrintReceipt = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 sm:p-8">
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-teal-600/20 rounded-full blur-3xl"></div>
      </div>

      <header className="relative max-w-5xl mx-auto w-full flex items-center justify-between py-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg shadow-emerald-500/20">
            EL
          </div>
          <span className="font-black text-xl tracking-tight text-white uppercase">
            EL <span className="text-emerald-400">LEARNERS APP</span>
          </span>
        </div>
        <a href="/auth/signin" className="text-xs font-bold text-slate-400 hover:text-emerald-400 transition">
          Already registered? Sign In
        </a>
      </header>

      <main className="relative max-w-4xl mx-auto w-full my-8 bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 sm:p-10 shadow-2xl">
        <div className="mb-8 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Institutional Onboarding
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Register Your School on EL LEARN APP
          </h1>
          <p className="text-slate-400 mt-2 text-sm sm:text-base">
            Enroll your institution, manage classes from Primary 3 to SSS3, set parent access, and activate your school portal with a standard NGN 30,000 subscription payment.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium">
            {errorMessage}
          </div>
        )}

        {pendingCheckout ? (
          <div className="p-8 bg-slate-950 border border-emerald-500/40 rounded-3xl space-y-6 text-center animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center mx-auto text-emerald-400">
              <CreditCard className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">Complete Korapay Subscription Payment</h2>
              <p className="text-slate-400 text-sm mt-2 max-w-md mx-auto">
                Click below to complete the NGN 30,000 subscription payment for <strong className="text-white">{pendingCheckout.schoolName}</strong>.
              </p>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl max-w-md mx-auto text-xs font-mono space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">School Code:</span>
                <span className="font-bold text-emerald-400">{pendingCheckout.schoolCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payment Reference:</span>
                <span className="font-bold text-white">{pendingCheckout.paymentReference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount:</span>
                <span className="font-bold text-white">NGN 30,000</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
              <a
                href={pendingCheckout.checkoutUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 transition"
              >
                <span>Proceed to Korapay Checkout</span>
                <ExternalLink className="w-4 h-4" />
              </a>
              <button
                onClick={handleConfirmPayment}
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify Completed Payment'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* School Details */}
            <div className="space-y-4">
              <h2 className="text-sm font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <Building2 className="w-4 h-4" /> School Profile
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Name of School *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Excellence International College"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Location of School *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ikeja, Lagos State"
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>
            </div>

            {/* Classes Selection */}
            <div className="space-y-3">
              <h2 className="text-sm font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> Registering Classes (PRIMARY 3 TO SSS3)
              </h2>
              <p className="text-xs text-slate-400">Select all academic levels operating in your school:</p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {AVAILABLE_CLASSES.map(cls => {
                  const isChecked = selectedClasses.includes(cls)
                  return (
                    <button
                      type="button"
                      key={cls}
                      onClick={() => handleClassToggle(cls)}
                      className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-between ${
                        isChecked
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span>{cls}</span>
                      {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Parents Verification Option */}
            <div className="space-y-3 p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <h2 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Access Verification
              </h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white">Register Parents along with Students?</p>
                  <p className="text-xs text-slate-400">If enabled, parents can register accounts, link wards, and enroll for Adult Education.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.allowParents}
                    onChange={e => setFormData({ ...formData, allowParents: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>
            </div>

            {/* Admin Information */}
            <div className="space-y-4">
              <h2 className="text-sm font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <Building2 className="w-4 h-4" /> School Administrator Credentials
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Name of Admin *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Jane Doe"
                    value={formData.adminName}
                    onChange={e => setFormData({ ...formData, adminName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Phone Number of Admin *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +234 801 234 5678"
                    value={formData.adminPhone}
                    onChange={e => setFormData({ ...formData, adminPhone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Email Address of Admin *</label>
                  <input
                    type="email"
                    required
                    placeholder="admin@school.com"
                    value={formData.adminEmail}
                    onChange={e => setFormData({ ...formData, adminEmail: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>
            </div>

            {/* Subscription Fee Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 to-teal-950/40 border border-emerald-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Subscription Fee</p>
                  <p className="text-xl font-black text-white">NGN 30,000</p>
                </div>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400">
                Korapay Checkout
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-base shadow-lg shadow-emerald-500/25 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Generating Payment Order...</span>
              ) : (
                <>
                  <span>Pay NGN 30,000 & Register School</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        )}
      </main>

      {/* SUCCESS PAYMENT & RECEIPT MODAL */}
      {showReceiptModal && registeredData && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-emerald-500/40 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 text-white animate-in fade-in zoom-in duration-200">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-black text-white">Payment Successful!</h2>
              <p className="text-slate-400 text-xs sm:text-sm">
                Your school has been registered and activated on EL LEARN APP.
              </p>
            </div>

            {/* Receipt Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 font-mono text-xs">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Platform:</span>
                <span className="font-bold text-emerald-400">EL LEARN APP</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">School Name:</span>
                <span className="font-bold text-white">{registeredData.schoolName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">School Registration Code:</span>
                <span className="font-black text-emerald-400 text-base">{registeredData.schoolCode}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Admin Email:</span>
                <span className="font-bold text-white">{registeredData.adminEmail}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Amount Paid:</span>
                <span className="font-bold text-white">NGN {registeredData.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="font-bold text-emerald-400">PAID & VERIFIED</span>
              </div>
            </div>

            <p className="text-slate-400 text-xs text-center">
              Please save your <strong className="text-white">School Registration Code ({registeredData.schoolCode})</strong>. Teachers, Students, and Parents will use this code during sign up.
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={handlePrintReceipt}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
              >
                <Download className="w-4 h-4" /> Download Receipt
              </button>
              <a
                href="/auth/signin"
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs text-center transition"
              >
                Proceed to Sign In
              </a>
            </div>
          </div>
        </div>
      )}

      <footer className="relative max-w-5xl mx-auto w-full text-center py-4 border-t border-slate-800 text-xs text-slate-500">
        &copy; {new Date().getFullYear()} EL LEARN APP. All rights reserved.
      </footer>
    </div>
  )
}
