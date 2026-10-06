'use client'

import { useState } from 'react'
import {
  registerSchoolAction,
  confirmSchoolPaymentAction,
  uploadApplicationProofOfAddressAction,
  getSchoolApplicationStatusAction
} from '@/app/actions/school'
import {
  CheckCircle2,
  Building2,
  Sparkles,
  CreditCard,
  Download,
  ShieldCheck,
  ArrowRight,
  BookOpen,
  ExternalLink,
  GraduationCap,
  FileText,
  Clock,
  Upload,
  AlertCircle
} from 'lucide-react'
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
  const [successMessage, setSuccessMessage] = useState('')

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

  // Application / Checkout state
  const [appState, setAppState] = useState<any>(null)
  const [documentType, setDocumentType] = useState('ELECTRICITY_BILL')
  const [documentUrl, setDocumentTypeUrl] = useState('')
  const [uploadingDoc, setUploadingDoc] = useState(false)

  // Post-payment OTP Verification & Glassy UI state
  const [showOtpStep, setShowOtpStep] = useState(false)
  const [otpInput, setOtpInput] = useState('')
  const [otpVerified, setOtpVerified] = useState(false)
  const [otpError, setOtpError] = useState('')

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
    setSuccessMessage('')

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
        setErrorMessage(res.error || 'Registration application failed.')
        setLoading(false)
        return
      }

      setAppState({
        applicationId: res.applicationId,
        schoolId: res.schoolId,
        schoolCode: res.schoolCode,
        paymentReference: res.paymentReference,
        checkoutUrl: res.checkoutUrl,
        schoolName: formData.name,
        paymentStatus: 'PENDING',
        documentVerificationStatus: 'PENDING',
        approvalStatus: 'PENDING_REVIEW',
      })
      setSuccessMessage('School application submitted! Please complete subscription payment and upload proof of address.')
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmPayment = async () => {
    if (!appState?.paymentReference) return
    setLoading(true)
    setErrorMessage('')
    const confirmRes = await confirmSchoolPaymentAction(appState.paymentReference)
    if (confirmRes.success) {
      setAppState((prev: any) => ({
        ...prev,
        paymentStatus: 'SUCCESS',
        documentVerificationStatus: confirmRes.documentVerificationStatus || prev.documentVerificationStatus,
        approvalStatus: confirmRes.approvalStatus || prev.approvalStatus,
      }))
      setShowOtpStep(true)
      setSuccessMessage('Payment verified successfully! Please enter the OTP sent to your registered device.')
    } else {
      setErrorMessage(confirmRes.error || 'Payment confirmation failed.')
    }
    setLoading(false)
  }

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault()
    setOtpError('')
    if (!otpInput || otpInput.trim().length < 4) {
      setOtpError('Please enter a valid 6-digit OTP code.')
      return
    }
    setOtpVerified(true)
    setSuccessMessage('OTP verified! Application forwarded for Super-Admin authentication.')
  }

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!appState?.applicationId || !documentUrl) {
      setErrorMessage('Please provide a valid document URL (or upload recent electricity bill).')
      return
    }

    setUploadingDoc(true)
    setErrorMessage('')
    setSuccessMessage('')

    const res = await uploadApplicationProofOfAddressAction(
      appState.applicationId,
      documentUrl
    )

    if (res.success) {
      setAppState((prev: any) => ({
        ...prev,
        documentVerificationStatus: 'PENDING',
      }))
      setSuccessMessage('Proof of address document submitted successfully! Application is now under Super-Admin review.')
    } else {
      setErrorMessage(res.error || 'Document submission failed.')
    }
    setUploadingDoc(false)
  }

  const handleCheckStatus = async () => {
    if (!appState?.applicationId) return
    setLoading(true)
    const statusRes = await getSchoolApplicationStatusAction(appState.applicationId)
    if (statusRes.success && statusRes.application) {
      setAppState((prev: any) => ({
        ...prev,
        paymentStatus: statusRes.application.paymentStatus,
        documentVerificationStatus: statusRes.application.documentVerificationStatus,
        approvalStatus: statusRes.application.approvalStatus,
        rejectionReason: statusRes.application.rejectionReason,
      }))
    }
    setLoading(false)
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
        className="relative max-w-4xl mx-auto w-full my-8 bg-white/10 backdrop-blur-3xl border border-white/20 rounded-[2.5rem] p-6 sm:p-10 shadow-[0_30px_100px_rgba(0,0,0,0.6)] z-10"
      >
        <div className="mb-8 text-center sm:text-left space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-black uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" /> Institutional School Application
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Register Your School Application
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm font-bold leading-relaxed">
            Submit your school onboarding application. Complete subscription payment via Korapay and upload proof of school address (e.g. recent electricity bill) for Super-Admin verification and account activation.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-black flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {appState ? (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Onboarding Progress Tracker */}
            <div className="p-6 bg-slate-950 border border-slate-800 rounded-3xl space-y-4">
              <h2 className="text-sm font-black uppercase text-blue-400 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Application Verification Status
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className={`p-4 rounded-2xl border text-xs space-y-1 ${
                  appState.paymentStatus === 'SUCCESS' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-slate-900 border-slate-800 text-amber-400'
                }`}>
                  <p className="font-black uppercase text-[10px]">Step 1: Payment</p>
                  <p className="font-bold text-white">{appState.paymentStatus === 'SUCCESS' ? 'PAID & VERIFIED' : 'PENDING PAYMENT'}</p>
                </div>

                <div className={`p-4 rounded-2xl border text-xs space-y-1 ${
                  appState.documentVerificationStatus === 'VERIFIED' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' :
                  appState.documentVerificationStatus === 'REJECTED' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                  'bg-slate-900 border-slate-800 text-amber-400'
                }`}>
                  <p className="font-black uppercase text-[10px]">Step 2: Proof of Address</p>
                  <p className="font-bold text-white">{appState.documentVerificationStatus}</p>
                </div>

                <div className={`p-4 rounded-2xl border text-xs space-y-1 ${
                  appState.approvalStatus === 'APPROVED' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' :
                  appState.approvalStatus === 'REJECTED' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                  'bg-slate-900 border-slate-800 text-amber-400'
                }`}>
                  <p className="font-black uppercase text-[10px]">Step 3: Super-Admin Approval</p>
                  <p className="font-bold text-white">{appState.approvalStatus}</p>
                </div>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-xs font-mono space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Application Code:</span>
                  <span className="font-bold text-blue-400">{appState.schoolCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Payment Reference:</span>
                  <span className="font-bold text-white">{appState.paymentReference}</span>
                </div>
              </div>
            </div>

            {/* Post-Payment Glassy OTP Step */}
            {appState.paymentStatus === 'SUCCESS' && showOtpStep && !otpVerified && (
              <div className="p-6 bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl rounded-3xl space-y-4 text-center relative overflow-hidden">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-400 flex items-center justify-center mx-auto text-blue-300">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Enter OTP Verification Code</h3>
                  <p className="text-slate-300 text-xs mt-1">
                    An OTP code has been transmitted to your registered device via FCM. Enter the code below to complete registration verification.
                  </p>
                </div>

                {otpError && (
                  <div className="p-3 bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-bold rounded-xl">
                    {otpError}
                  </div>
                )}

                <form onSubmit={handleVerifyOtp} className="max-w-xs mx-auto space-y-3">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Enter 6-digit OTP"
                    value={otpInput}
                    onChange={e => setOtpInput(e.target.value)}
                    className="w-full text-center tracking-widest text-lg font-black bg-slate-950/80 border border-white/30 rounded-2xl py-3 text-white focus:outline-none focus:border-blue-400"
                  />
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase transition shadow-lg"
                  >
                    Verify OTP
                  </button>
                </form>
              </div>
            )}

            {/* Post-OTP Super Admin Authentication Notice & Email Redirect */}
            {otpVerified && (
              <div className="p-6 bg-emerald-500/10 backdrop-blur-2xl border border-emerald-500/30 shadow-2xl rounded-3xl space-y-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center mx-auto text-emerald-300">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-emerald-300">Super Admin to Authenticate Registration</h3>
                  <p className="text-slate-300 text-xs leading-relaxed max-w-md mx-auto">
                    Your payment and OTP verification have been recorded in real time. Registration requires final Super Admin authentication.
                  </p>
                </div>
                <div className="pt-2">
                  <a
                    href="mailto:elversetechnologies@gmail.com?subject=School%20Registration%20Authentication%20Request&body=Hello%20Super%20Admin,%20my%20school%20application%20payment%20and%20OTP%20have%20been%20verified.%20Please%20authenticate%20registration."
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider transition shadow-xl"
                  >
                    <span>Contact Super Admin via Email (elversetechnologies@gmail.com)</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            )}

            {/* Payment Section */}
            {appState.paymentStatus !== 'SUCCESS' && (
              <div className="p-6 bg-slate-950 border border-blue-500/40 rounded-3xl space-y-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500 flex items-center justify-center mx-auto text-blue-400">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">1. Complete Subscription Payment (NGN 30,161.25)</h3>
                  <p className="text-slate-400 text-xs mt-1">
                    Pay via Korapay checkout link to update your application payment status.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                  <a
                    href={appState.checkoutUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-3 px-4 rounded-xl bg-[#1E3A8A] hover:bg-blue-800 text-white font-black text-xs uppercase flex items-center justify-center gap-2 transition"
                  >
                    <span>Korapay Checkout</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    onClick={handleConfirmPayment}
                    disabled={loading}
                    className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs uppercase transition disabled:opacity-50"
                  >
                    {loading ? 'Verifying...' : 'Verify Payment'}
                  </button>
                </div>
              </div>
            )}

            {/* Proof of Address Document Upload Section */}
            <form onSubmit={handleUploadDocument} className="p-6 bg-slate-950 border border-slate-800 rounded-3xl space-y-4">
              <h3 className="text-sm font-black uppercase text-blue-400 flex items-center gap-2">
                <FileText className="w-4 h-4" /> 2. Upload Proof of School Address
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Provide a recent electricity bill or utility document matching the school address ({appState.schoolName}).
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-1">Document Type *</label>
                  <select
                    value={documentType}
                    onChange={e => setDocumentType(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="ELECTRICITY_BILL">Electricity Bill / Utility Bill</option>
                    <option value="GOVT_APPROVAL">Government License / Registration Approval</option>
                    <option value="SCHOOL_CERTIFICATE">School Registration Certificate</option>
                    <option value="AUTHORIZATION_LETTER">Principal Authorization Letter</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-1">Document File URL *</label>
                  <input
                    type="url"
                    required
                    placeholder="https://.../electricity-bill.pdf"
                    value={documentUrl}
                    onChange={e => setDocumentTypeUrl(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={uploadingDoc}
                  className="py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase flex items-center gap-2 transition disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  <span>{uploadingDoc ? 'Submitting...' : 'Submit Proof of Address'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCheckStatus}
                  disabled={loading}
                  className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
                >
                  Refresh Application Status
                </button>
              </div>
            </form>

            <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-500/20 text-xs text-slate-300 font-medium space-y-1">
              <p className="font-bold text-white">Trust & Security Notice:</p>
              <p>
                Email address and phone number are collected as contact details only and are not used as primary authorization. Super-Admin will verify your proof of address (electricity bill) and payment prior to activating your SCHOOL_ADMIN identity.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* School Profile */}
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

            {/* Parents Option */}
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    placeholder="applicant@school.com"
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
                <span>Submitting Application...</span>
              ) : (
                <>
                  <span>Submit Application & Proceed to Payment</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        )}
      </main>

      <footer className="relative max-w-5xl mx-auto w-full text-center py-4 border-t border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-widest z-10">
        &copy; {new Date().getFullYear()} EL LEARNERS APP • Institutional Gateway
      </footer>
    </div>
  )
}
