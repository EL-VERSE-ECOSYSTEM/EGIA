'use client'

import { useState } from 'react'
import { registerSchoolAction, confirmSchoolPaymentAction } from '@/app/actions/school'
import { CheckCircle2, Building2, Sparkles, CreditCard, Download, ShieldCheck, ArrowRight, BookOpen, ExternalLink, Key, Lock, GraduationCap } from 'lucide-react'
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator'
import { LogoUploadField } from '@/components/uploads/LogoUploadField'
import { ProofOfAddressUploadField } from '@/components/uploads/ProofOfAddressUploadField'

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
    adminGender: 'Male',
    adminLevel: 'PRIMARY_ADMIN',
    proofOfAddressType: 'ELECTRICITY_BILL',
    proofOfAddressFileUrl: '',
    allowParents: true,
    logo_url: '',
    logo_path: '',
  })

  const [selectedClasses, setSelectedClasses] = useState<string[]>([...AVAILABLE_CLASSES])
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // 3D Mouse Movement Tilt
  const [rotateX, setRotateX] = useState(0)
  const [rotateY, setRotateY] = useState(0)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget.getBoundingClientRect()
    const cardX = e.clientX - card.left - card.width / 2
    const cardY = e.clientY - card.top - card.height / 2
    setRotateX(-cardY / 50)
    setRotateY(cardX / 50)
  }

  const handleMouseLeave = () => {
    setRotateX(0)
    setRotateY(0)
  }

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
        logoUrl: formData.logo_url,
        logoPath: formData.logo_path,
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
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 sm:p-8 relative overflow-hidden perspective-[1200px]">
      {/* 3D Dynamic Background Lights */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <header className="relative max-w-5xl mx-auto w-full flex items-center justify-between py-4 border-b border-slate-800 z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md shadow-lg">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <span className="font-black text-xl tracking-tight text-white uppercase">
            EL <span className="text-blue-400">LEARNERS APP</span>
          </span>
        </div>
        <a href="/auth/signin" className="text-xs font-black text-blue-400 hover:text-blue-300 uppercase tracking-wider transition bg-white/5 px-4 py-2 rounded-xl border border-white/10">
          Already registered? Sign In
        </a>
      </header>

      <main
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          transition: 'transform 0.15s ease-out'
        }}
        className="relative max-w-4xl mx-auto w-full my-8 bg-slate-900/90 backdrop-blur-2xl border border-white/15 rounded-[2.5rem] p-6 sm:p-10 shadow-[0_30px_100px_rgba(0,0,0,0.5)] z-10"
      >
        <div className="mb-8 text-center sm:text-left space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-black uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" /> Institutional School Onboarding
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Register Your School on EL LEARNERS APP
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm font-bold leading-relaxed">
            Enroll your institution, manage classes from Primary 3 to SSS3, set parent access, and activate your school portal with a standard NGN 30,000 subscription payment.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-black">
            {errorMessage}
          </div>
        )}

        {pendingCheckout ? (
          <div className="p-8 bg-slate-950 border border-blue-500/40 rounded-3xl space-y-6 text-center animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/20 border border-blue-500 flex items-center justify-center mx-auto text-blue-400 shadow-lg">
              <CreditCard className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">Complete Korapay Subscription Payment</h2>
              <p className="text-slate-400 text-xs font-bold mt-2 max-w-md mx-auto">
                Click below to complete the NGN 30,000 subscription payment for <strong className="text-white">{pendingCheckout.schoolName}</strong>.
              </p>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl max-w-md mx-auto text-xs font-mono space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Generated School Code:</span>
                <span className="font-bold text-blue-400 text-sm">{pendingCheckout.schoolCode}</span>
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
                className="w-full py-3.5 px-6 rounded-2xl bg-[#1E3A8A] hover:bg-blue-800 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition"
              >
                <span>Proceed to Korapay Checkout</span>
                <ExternalLink className="w-4 h-4" />
              </a>
              <button
                onClick={handleConfirmPayment}
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs uppercase tracking-wider transition disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify Completed Payment'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* School Details */}
            <div className="space-y-4">
              <h2 className="text-xs font-black uppercase tracking-wider text-blue-400 flex items-center gap-2">
                <Building2 className="w-4 h-4" /> School Profile & Branding
              </h2>
              <LogoUploadField
                schoolId=""
                existingUrl={formData.logo_url}
                onUploaded={(url, path) => setFormData(prev => ({ ...prev, logo_url: url, logo_path: path }))}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-1">Name of School *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Excellence International College"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-blue-500 transition shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-1">Location of School *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ikeja, Lagos State"
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-blue-500 transition shadow-inner"
                  />
                </div>
              </div>
            </div>

            {/* Classes Selection */}
            <div className="space-y-3">
              <h2 className="text-xs font-black uppercase tracking-wider text-blue-400 flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> Registering Classes (PRIMARY 3 TO SSS3)
              </h2>
              <p className="text-xs text-slate-400 font-bold">Select all academic levels operating in your school:</p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {AVAILABLE_CLASSES.map(cls => {
                  const isChecked = selectedClasses.includes(cls)
                  return (
                    <button
                      type="button"
                      key={cls}
                      onClick={() => handleClassToggle(cls)}
                      className={`px-3 py-2.5 rounded-xl border text-xs font-black transition flex items-center justify-between ${
                        isChecked
                          ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span>{cls}</span>
                      {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Parents Verification Option */}
            <div className="space-y-3 p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <h2 className="text-xs font-black uppercase tracking-wider text-blue-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Access Verification
              </h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black text-white">Register Parents along with Students?</p>
                  <p className="text-[11px] text-slate-400 font-medium">If enabled, parents can register accounts, link wards, and enroll for Adult Education.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.allowParents}
                    onChange={e => setFormData({ ...formData, allowParents: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            {/* Applicant Details & Document Verification */}
            <div className="space-y-4">
              <h2 className="text-xs font-black uppercase tracking-wider text-blue-400 flex items-center gap-2">
                <Building2 className="w-4 h-4" /> Applicant Details & Verification Documents
              </h2>
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                <strong>Manual Authorization Notice:</strong> Registration creates a pending school application. Active school administrator access is granted only after manual document review (e.g. recent electricity bill) and Super-Admin approval. Email and phone are collected as contact details.
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-1">Name of Applicant *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Jane Doe"
                    value={formData.adminName}
                    onChange={e => setFormData({ ...formData, adminName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-blue-500 transition shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-1">Contact Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +234 801 234 5678"
                    value={formData.adminPhone}
                    onChange={e => setFormData({ ...formData, adminPhone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-blue-500 transition shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-1">Contact Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="admin@school.com"
                    value={formData.adminEmail}
                    onChange={e => setFormData({ ...formData, adminEmail: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-blue-500 transition shadow-inner"
                  />
                </div>
              </div>

              <div>
                <ProofOfAddressUploadField
                  existingUrl={formData.proofOfAddressFileUrl}
                  onUploaded={(url) => setFormData(prev => ({ ...prev, proofOfAddressFileUrl: url }))}
                  onRemoved={() => setFormData(prev => ({ ...prev, proofOfAddressFileUrl: '' }))}
                />
                <p className="text-[11px] text-slate-500 font-medium pt-1">
                  Upload a recent electricity bill (PDF, PNG, JPG, WebP) matching the school name/address for manual Super-Admin verification.
                </p>
              </div>
            </div>

            {/* Subscription Fee Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950 to-slate-900 border border-blue-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Subscription Fee (NGN 30,000 + NGN 161.25 fee)</p>
                  <p className="text-xl font-black text-white">NGN 30,161.25</p>
                </div>
              </div>
              <span className="text-[10px] font-black px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 uppercase">
                Korapay Checkout
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-[#1E3A8A] hover:bg-blue-800 text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-blue-900/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Generating Payment Order...</span>
              ) : (
                <>
                  <span>Pay NGN 30,161.25 & Register School</span>
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
          <div className="bg-slate-950 border border-blue-500/40 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 text-white animate-in fade-in zoom-in duration-200">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-blue-500/20 border border-blue-500 flex items-center justify-center mx-auto text-blue-400">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-black text-white">Payment Successful!</h2>
              <p className="text-slate-400 text-xs sm:text-sm">
                Your school has been registered and activated on EL LEARNERS APP.
              </p>
            </div>

            {/* Receipt Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 font-mono text-xs">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Platform:</span>
                <span className="font-bold text-blue-400">EL LEARNERS APP</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">School Name:</span>
                <span className="font-bold text-white">{registeredData.schoolName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">School Registration Code:</span>
                <span className="font-black text-blue-400 text-base">{registeredData.schoolCode}</span>
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
                <span className="font-bold text-blue-400">PAID & VERIFIED</span>
              </div>
            </div>

            <p className="text-slate-400 text-xs text-center font-bold">
              Please save your <strong className="text-white">School Registration Code ({registeredData.schoolCode})</strong>. Teachers, Students, and Parents will use this code during sign up. School Admin can login with this code or email address and password.
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={handlePrintReceipt}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs flex items-center justify-center gap-2 transition"
              >
                <Download className="w-4 h-4" /> Download Receipt
              </button>
              <a
                href="/auth/signin"
                className="flex-1 py-3 px-4 rounded-xl bg-[#1E3A8A] hover:bg-blue-800 text-white font-black text-xs text-center transition"
              >
                Proceed to Sign In
              </a>
            </div>
          </div>
        </div>
      )}

      <footer className="relative max-w-5xl mx-auto w-full text-center py-4 border-t border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-widest z-10">
        &copy; {new Date().getFullYear()} EL LEARNERS APP • Institutional Gateway
      </footer>
    </div>
  )
}
