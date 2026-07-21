'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GraduationCap, Loader2, AlertCircle, Laptop, CreditCard, CheckCircle2, User, Plus, X } from 'lucide-react'
import { registerStudent } from '@/app/actions/auth-server'
import { initializeKorapayPayment, submitRegistrationManualPayment, getStudentIdByAdmissionNumber } from '@/app/actions/payments'
import { Badge } from '@/components/ui/badge'
import { Banknote } from 'lucide-react'

export default function StudentRegistrationPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    class: 'JSS1',
    department: 'SCIENCE',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
    dateOfResumption: ''
  })

  // Subjects Done tag list
  const [subjectInput, setSubjectInput] = useState('')
  const [subjectsDone, setSubjectsDone] = useState<string[]>([])

  // Passport photo state
  const [passportImage, setProfileImage] = useState<string | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [isPaid, setIsPaid] = useState(false)
  const [isValidDate, setIsValidDate] = useState(false)
  const [generatedAdmissionNumber, setGeneratedAdmissionNumber] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const router = useRouter()

  // Payment Method Selection & Manual Transfer Receipt State
  const [paymentMethod, setPaymentMethod] = useState<'ONLINE' | 'TRANSFER'>('ONLINE')
  const [transferReceipt, setTransferReceipt] = useState<string | null>(null)

  useEffect(() => {
    const now = new Date()
    const deadline = new Date('2026-09-30T23:59:59')
    setIsValidDate(now <= deadline)

    // Check if there is a pending student admission number from successful Korapay payment redirect return
    if (typeof window !== 'undefined') {
      const pendingAdmission = localStorage.getItem('pending_student_admission')
      if (pendingAdmission) {
        setGeneratedAdmissionNumber(pendingAdmission)
        setShowSuccessModal(true)
        setIsPaid(true)
        localStorage.removeItem('pending_student_admission')
      }
    }
  }, [])

  const handleAddSubject = () => {
    if (!subjectInput.trim()) return
    if (subjectsDone.includes(subjectInput.trim())) return
    setSubjectsDone([...subjectsDone, subjectInput.trim()])
    setSubjectInput('')
  }

  const handleRemoveSubject = (sub: string) => {
    setSubjectsDone(subjectsDone.filter(s => s !== sub))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader()
      reader.onload = () => {
        setProfileImage(reader.result as string)
      }
      reader.readAsDataURL(e.target.files[0])
    }
  }

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader()
      reader.onload = () => {
        setTransferReceipt(reader.result as string)
      }
      reader.readAsDataURL(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      alert('Passwords do not match')
      return
    }

    if (!passportImage) {
      return alert('Please upload a passport photo.')
    }

    if (subjectsDone.length === 0) {
      return alert('Please type and add at least one subject done.')
    }

    setLoading(true)

    try {
      const payload = {
        ...formData,
        department: (formData.class === 'SSS1' || formData.class === 'SSS2' || formData.class === 'SSS3') ? (formData.department || 'SCIENCE') : null,
        subjectsDone,
        profileImage: passportImage,
        facialVerificationVideo: null
      }

      const result = await registerStudent(payload)

      if (result.error) {
        setError(result.error)
        alert(result.error)
        setLoading(false)
        return
      }

      setGeneratedAdmissionNumber(result.admissionNumber)

      // Save the generated unique Admission Number in localStorage before redirecting to Korapay
      if (typeof window !== 'undefined') {
        localStorage.setItem('pending_student_admission', result.admissionNumber)
      }

      alert(`SUCCESS! Account registered in database. Generated Admission Number: ${result.admissionNumber}. Redirecting to secure Korapay payment gateway to complete activation (₦2,100)...`)
      window.location.href = 'https://checkout.korapay.com/pay/BHba4zdsceZDgyW'
    } catch (err: any) {
      console.error(err)
      setError('Payment initialization or registration failed. Please try again.')
      alert('Payment initialization or registration failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 py-16">
      <div className="mb-10 flex items-center gap-2">
        <div className="bg-orange-600 p-2 rounded-lg">
          <GraduationCap className="text-white w-6 h-6" />
        </div>
        <span className="font-black text-xl tracking-tight text-slate-900">EL GOODNEWS <span className="text-orange-600">ACADEMY</span></span>
      </div>

      {!isValidDate ? (
        <Card className="max-w-md w-full border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] overflow-hidden bg-white text-center p-12">
          <div className="mx-auto bg-red-50 p-6 rounded-full w-fit mb-6">
            <AlertCircle className="w-16 h-16 text-red-600" />
          </div>
          <h2 className="text-3xl font-black text-slate-900">Registration Closed</h2>
          <p className="text-slate-500 font-medium max-w-sm mx-auto mt-6 leading-relaxed">
            Session registration is strictly open until September 30th only.
          </p>
        </Card>
      ) : isPaid ? (
        <Card className="max-w-md w-full border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] overflow-hidden bg-white text-center p-12">
          <div className="h-2 bg-emerald-600 w-full absolute top-0 left-0" />
          <div className="mx-auto bg-emerald-50 p-6 rounded-full w-fit mb-6">
            <CheckCircle2 className="w-16 h-16 text-emerald-600" />
          </div>
          <h2 className="text-3xl font-black text-slate-900">Registration Complete</h2>
          <p className="text-slate-500 font-bold mt-2 uppercase tracking-widest text-xs">Admission Number Generated</p>
          <div className="my-6 p-6 bg-slate-50 border border-slate-100 rounded-3xl">
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Your Admission Number</p>
            <p className="text-4xl font-black text-orange-600 mt-2 tracking-widest">{generatedAdmissionNumber}</p>
          </div>
          <p className="text-slate-500 font-medium text-sm leading-relaxed mb-8">
            You can now use this unique Admission Number and your set password to log in to the student portal.
          </p>
          <Button
            onClick={() => router.push('/auth/signin')}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white h-14 rounded-2xl font-black text-lg"
          >
            Proceed to Sign In
          </Button>
        </Card>
      ) : (
        <Card className="max-w-xl w-full border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] overflow-hidden bg-white">
          <div className="h-2 bg-orange-600 w-full" />
          <CardHeader className="text-center pt-10">
            <div className="mx-auto bg-orange-100 p-4 rounded-2xl w-fit mb-4">
              <Laptop className="w-8 h-8 text-orange-600" />
            </div>
            <CardTitle className="text-3xl font-black text-slate-900">Session Registration</CardTitle>
            <CardDescription className="text-slate-500 font-bold mt-2 leading-relaxed">
              Complete full registration & pay activation fee (₦2,100)
            </CardDescription>
          </CardHeader>
          <CardContent className="px-10 pb-12">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-xs font-black rounded-2xl flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  {error}
                </div>
              )}

              {/* Passport picture Upload Block */}
              <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                <Label className="text-xs font-black uppercase text-slate-400 tracking-wider">Passport Photograph</Label>
                {passportImage ? (
                  <div className="relative">
                    <img src={passportImage} alt="Profile" className="w-28 h-28 object-cover rounded-full border-4 border-orange-200 shadow-lg" />
                    <button
                      type="button"
                      onClick={() => setProfileImage(null)}
                      className="absolute -bottom-2 -right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-2 text-xs font-bold"
                    >
                      Reset
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-300">
                    <User className="w-16 h-16 bg-slate-100 p-3 rounded-full text-slate-400 border border-slate-200" />
                  </div>
                )}

                <div className="relative w-full text-center">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    {passportImage ? 'Change passport photo:' : 'Upload a passport photograph (JPG or PNG):'}
                  </p>
                  <div className="relative inline-block mt-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
                    />
                    <Button type="button" variant="outline" className="border-slate-200 text-slate-700 font-bold text-xs h-10 px-4 rounded-xl">
                      Upload Passport
                    </Button>
                  </div>
                </div>
              </div>

              {/* Names entered exactly according to Birth Certificate */}
              <div className="p-4 bg-orange-50/50 border border-orange-100 rounded-2xl text-[10px] font-bold text-orange-950">
                 ⚠️ CRITICAL: Enter student's first, middle, and last names exactly as printed on their Birth Certificate.
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="firstName" className="text-[9px] font-black uppercase text-slate-400 tracking-wider">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={e => setFormData({...formData, firstName: e.target.value})}
                    required
                    className="h-11 rounded-xl border-slate-200 text-xs font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="middleName" className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Middle Name</Label>
                  <Input
                    id="middleName"
                    placeholder="Chidi"
                    value={formData.middleName}
                    onChange={e => setFormData({...formData, middleName: e.target.value})}
                    className="h-11 rounded-xl border-slate-200 text-xs font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="lastName" className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={e => setFormData({...formData, lastName: e.target.value})}
                    required
                    className="h-11 rounded-xl border-slate-200 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={e => setFormData({...formData, dateOfBirth: e.target.value})}
                    required
                    className="h-12 rounded-xl border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateOfResumption" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Date of Resumption</Label>
                  <Input
                    id="dateOfResumption"
                    type="date"
                    value={formData.dateOfResumption}
                    onChange={e => setFormData({...formData, dateOfResumption: e.target.value})}
                    required
                    className="h-12 rounded-xl border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="class" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Admission Class</Label>
                  <select
                    id="class"
                    value={formData.class}
                    onChange={e => setFormData({...formData, class: e.target.value})}
                    className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50/50 px-4 font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-orange-600 focus:outline-none transition-all"
                  >
                    <option value="Primary 3">Primary 3</option>
                    <option value="Primary 4">Primary 4</option>
                    <option value="Primary 5">Primary 5</option>
                    <option value="Primary 6">Primary 6</option>
                    <option value="JSS1">JSS 1</option>
                    <option value="JSS2">JSS 2</option>
                    <option value="JSS3">JSS 3</option>
                    <option value="SSS1">SSS 1</option>
                    <option value="SSS2">SSS 2</option>
                    <option value="SSS3">SSS 3</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john.doe@example.com"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    required
                    className="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-orange-600"
                  />
                </div>
              </div>

              {/* Dynamic Department Selector for SSS 1 - SSS 3 */}
              {(formData.class === 'SSS1' || formData.class === 'SSS2' || formData.class === 'SSS3') && (
                <div className="space-y-2 bg-orange-50/50 p-5 rounded-3xl border border-orange-100 animate-in fade-in duration-300">
                  <Label htmlFor="department" className="text-[10px] font-black uppercase text-orange-800 tracking-widest ml-1">Select SSS Academic Department</Label>
                  <select
                    id="department"
                    value={formData.department || 'SCIENCE'}
                    onChange={e => setFormData({...formData, department: e.target.value})}
                    required
                    className="w-full h-12 rounded-xl border border-orange-200 bg-white px-4 font-bold text-slate-800 focus:ring-2 focus:ring-orange-600 focus:outline-none transition-all"
                  >
                    <option value="SCIENCE">SCIENCE</option>
                    <option value="ARTS">ARTS</option>
                    <option value="COMMERCIAL">COMMERCIAL</option>
                  </select>
                </div>
              )}

              {/* Dynamic tag input list for subjects done */}
              <div className="space-y-2 bg-slate-50 p-5 rounded-3xl border border-slate-100">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Type In All Subjects Done One by One</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. Mathematics"
                    value={subjectInput}
                    onChange={e => setSubjectInput(e.target.value)}
                    className="h-11 rounded-xl border-slate-200 bg-white font-bold"
                  />
                  <Button type="button" onClick={handleAddSubject} className="bg-orange-600 hover:bg-orange-700 h-11 px-4 rounded-xl font-bold">
                    <Plus size={16} /> Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {subjectsDone.map(sub => (
                    <Badge key={sub} className="bg-orange-100 text-orange-800 border-none font-bold text-xs px-3 py-1 flex items-center gap-1.5 rounded-lg">
                      {sub}
                      <button type="button" onClick={() => handleRemoveSubject(sub)} className="text-orange-600 hover:text-orange-900">
                        <X size={12} />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Mandatory Online Payment Info block for Registration activation fee */}
              <div className="space-y-4 bg-orange-50/50 p-6 rounded-3xl border border-orange-100">
                <Label className="text-[10px] font-black uppercase text-orange-950 tracking-widest ml-1">Registration Activation Fee (₦2,100)</Label>
                <div className="p-4 bg-white rounded-2xl border border-orange-100 text-xs text-slate-600 font-bold space-y-1">
                  <p className="text-slate-900 font-black flex items-center gap-1.5">
                    <CreditCard className="text-orange-600 w-4 h-4" /> SECURE ONLINE PAYMENT ONLY
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium">
                    To complete registration and generate your admission details, you must make a payment of ₦2,100 via our secure Korapay payment portal. Manual bank transfers are not accepted for student sign-up.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" title="password" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  required
                  className="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" title="confirm-password" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                  required
                  className="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white h-14 rounded-2xl font-black text-lg shadow-xl shadow-orange-200 mt-6 transition-all"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'Register & Proceed to Payment'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Dynamic Success Modal / Pop up Notification */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <Card className="max-w-md w-full border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden p-8 text-center animate-in fade-in zoom-in duration-300">
            <div className="mx-auto bg-emerald-50 p-6 rounded-full w-fit mb-6">
              <CheckCircle2 className="w-16 h-16 text-emerald-600" />
            </div>
            <h2 className="text-3xl font-black text-slate-900">Registration Complete</h2>
            <p className="text-slate-500 font-bold mt-2 uppercase tracking-widest text-xs">Unique Admission Number Generated</p>
            <div className="my-6 p-6 bg-slate-50 border border-slate-100 rounded-3xl relative group">
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Your Admission Number</p>
              <p className="text-4xl font-black text-orange-600 mt-2 tracking-widest">{generatedAdmissionNumber}</p>
              <Button
                size="sm"
                variant="outline"
                className="mt-4 rounded-xl border-slate-200 font-bold text-xs"
                onClick={() => {
                  if (generatedAdmissionNumber) {
                    navigator.clipboard.writeText(generatedAdmissionNumber)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  }
                }}
              >
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </Button>
            </div>
            <p className="text-slate-500 font-medium text-sm leading-relaxed mb-6">
              Please write this down or copy it to log in to the Student Portal.
            </p>
            <Button
              onClick={() => {
                setShowSuccessModal(false)
                router.push('/auth/signin')
              }}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white h-14 rounded-2xl font-black text-lg"
            >
              Continue
            </Button>
          </Card>
        </div>
      )}
    </div>
  )
}
