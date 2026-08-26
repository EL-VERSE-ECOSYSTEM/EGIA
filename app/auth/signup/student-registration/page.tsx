'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GraduationCap, Loader2, AlertCircle, Laptop, CreditCard, CheckCircle2, User, Plus, X, Building2 } from 'lucide-react'
import { registerStudent } from '@/app/actions/auth-server'
import { initializeStudentRegistrationPayment, getStudentIdByAdmissionNumber } from '@/app/actions/payments'
import { Badge } from '@/components/ui/badge'
import { getRegistrationSubjects } from '@/app/actions/auth-server'

export default function StudentRegistrationPage() {
  const [formData, setFormData] = useState({
    schoolCode: '',
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
  const [subjectsDone, setSubjectsDone] = useState<string[]>([])
  const [availableSubjects, setAvailableSubjects] = useState<{ id: string; name: string }[]>([])
  const [manualSubject, setManualSubject] = useState('')

  // Passport photo state
  const [passportImage, setProfileImage] = useState<string | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [isValidDate, setIsValidDate] = useState(false)
  const [generatedAdmissionNumber, setGeneratedAdmissionNumber] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const now = new Date()
    const deadline = new Date('2026-09-30T23:59:59')
    setIsValidDate(now <= deadline)
    getRegistrationSubjects().then(setAvailableSubjects).catch(() => setAvailableSubjects([]))

    const pendingAdmission = localStorage.getItem('pending_student_admission')
    if (pendingAdmission) {
      setGeneratedAdmissionNumber(pendingAdmission)
      setShowSuccessModal(true)
      localStorage.removeItem('pending_student_admission')
    }
  }, [])

  const handleAddSubject = (name: string) => {
    if (!name || subjectsDone.includes(name)) return
    setSubjectsDone([...subjectsDone, name])
  }

  const addManualSubject = () => {
    const name = manualSubject.trim()
    if (!name || subjectsDone.some(item => item.toLowerCase() === name.toLowerCase())) return
    setSubjectsDone([...subjectsDone, name])
    setManualSubject('')
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.schoolCode) {
      setError('School Registration Code is required.')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
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
        schoolCode: formData.schoolCode.trim().toUpperCase(),
        department: (formData.class === 'SSS1' || formData.class === 'SSS2' || formData.class === 'SSS3') ? (formData.department || 'SCIENCE') : null,
        subjectsDone,
        profileImage: passportImage,
        facialVerificationVideo: null
      }

      const result = await registerStudent(payload)

      if (result.error) {
        setError(result.error)
        setLoading(false)
        return
      }

      setGeneratedAdmissionNumber(result.admissionNumber)
      localStorage.setItem('pending_student_admission', result.admissionNumber)

      const studentId = await getStudentIdByAdmissionNumber(result.admissionNumber)
      if (!studentId) throw new Error('Registration record could not be loaded for payment.')
      const payment = await initializeStudentRegistrationPayment(studentId)
      alert(`Your admission number is ${result.admissionNumber}. Continue to Korapay to pay the ₦2,000 registration fee.`)
      window.location.assign(payment.checkoutUrl)
    } catch (err: any) {
      console.warn('Unexpected registration redirect handling failed:', err)
      setError('An unexpected error occurred during registration. Please refresh and try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 py-16">
      <div className="mb-10 flex items-center gap-2">
        <div className="bg-orange-600 p-2 rounded-lg">
          <GraduationCap className="text-white w-6 h-6" />
        </div>
        <span className="font-black text-xl tracking-tight text-white">EL LEARNERS App <span className="text-orange-500">ACADEMY</span></span>
      </div>

      {!isValidDate ? (
        <Card className="max-w-md w-full border border-slate-800 shadow-2xl rounded-[2.5rem] overflow-hidden bg-slate-900 text-white text-center p-6 sm:p-12">
          <div className="mx-auto bg-red-500/10 border border-red-500/30 p-6 rounded-full w-fit mb-6">
            <AlertCircle className="w-16 h-16 text-red-500" />
          </div>
          <h2 className="text-3xl font-black text-white">Registration Closed</h2>
          <p className="text-slate-400 font-medium max-w-sm mx-auto mt-6 leading-relaxed">
            Session registration is strictly open until September 30th only.
          </p>
        </Card>
      ) : showSuccessModal ? (
        <Card className="max-w-md w-full border border-slate-800 shadow-2xl rounded-[2.5rem] overflow-hidden bg-slate-900 text-white text-center p-6 sm:p-12">
          <div className="h-2 bg-emerald-500 w-full absolute top-0 left-0" />
          <div className="mx-auto bg-emerald-500/10 border border-emerald-500/30 p-6 rounded-full w-fit mb-6">
            <CheckCircle2 className="w-16 h-16 text-emerald-400" />
          </div>
          <h2 className="text-3xl font-black text-white">Registration Complete</h2>
          <p className="text-slate-400 font-bold mt-2 uppercase tracking-widest text-xs">Admission Number Generated</p>
          <div className="my-6 p-6 bg-slate-950 border border-slate-800 rounded-3xl">
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Your Admission Number</p>
            <p className="text-4xl font-black text-orange-400 mt-2 tracking-widest">{generatedAdmissionNumber}</p>
          </div>
          <p className="text-slate-400 font-medium text-sm leading-relaxed mb-8">
            You can now use this unique Admission Number and your set password to log in to the student portal.
          </p>
          <Button
            onClick={() => router.push('/auth/signin')}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 h-14 rounded-2xl font-black text-lg"
          >
            Proceed to Sign In
          </Button>
        </Card>
      ) : (
        <Card className="max-w-xl w-full border border-slate-800 shadow-2xl rounded-[2.5rem] overflow-hidden bg-slate-900 text-white">
          <div className="h-2 bg-orange-600 w-full" />
          <CardHeader className="text-center pt-10">
            <div className="mx-auto bg-orange-500/10 border border-orange-500/30 p-4 rounded-2xl w-fit mb-4">
              <Laptop className="w-8 h-8 text-orange-400" />
            </div>
            <CardTitle className="text-3xl font-black text-white">Student / Pupil Registration</CardTitle>
            <CardDescription className="text-slate-400 font-bold mt-2 leading-relaxed">
              Complete full registration & pay the ₦2,000 activation fee
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-10 pb-12">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-black rounded-2xl flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  {error}
                </div>
              )}

              {/* School Registration Code */}
              <div className="space-y-2 bg-orange-500/10 border border-orange-500/30 p-4 rounded-2xl">
                <Label htmlFor="schoolCode" className="text-xs font-black uppercase text-orange-400 tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-4 h-4" /> School Registration Code *
                </Label>
                <Input
                  id="schoolCode"
                  placeholder="e.g. EGIA-19001"
                  value={formData.schoolCode}
                  onChange={e => setFormData({ ...formData, schoolCode: e.target.value.toUpperCase() })}
                  required
                  className="h-11 rounded-xl border-slate-800 bg-slate-950 text-white font-mono uppercase focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Passport picture Upload Block */}
              <div className="flex flex-col items-center justify-center p-6 bg-slate-950 rounded-3xl border border-slate-800 space-y-4">
                <Label className="text-xs font-black uppercase text-slate-400 tracking-wider">Passport Photograph</Label>
                {passportImage ? (
                  <div className="relative">
                    <img src={passportImage} alt="Profile" className="w-28 h-28 object-cover rounded-full border-4 border-orange-500 shadow-lg" />
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
                    <User className="w-16 h-16 bg-slate-900 p-3 rounded-full text-slate-400 border border-slate-800" />
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
                    <Button type="button" variant="outline" className="border-slate-800 bg-slate-900 text-slate-300 font-bold text-xs h-10 px-4 rounded-xl">
                      Upload Passport
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl text-[10px] font-bold text-orange-300">
                 ⚠️ CRITICAL: Enter student's first, middle, and last names exactly as printed on their Birth Certificate.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="firstName" className="text-[9px] font-black uppercase text-slate-400 tracking-wider">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={e => setFormData({...formData, firstName: e.target.value})}
                    required
                    className="h-11 rounded-xl border-slate-800 bg-slate-950 text-white text-xs font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="middleName" className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Middle Name</Label>
                  <Input
                    id="middleName"
                    placeholder="Chidi"
                    value={formData.middleName}
                    onChange={e => setFormData({...formData, middleName: e.target.value})}
                    className="h-11 rounded-xl border-slate-800 bg-slate-950 text-white text-xs font-bold"
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
                    className="h-11 rounded-xl border-slate-800 bg-slate-950 text-white text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={e => setFormData({...formData, dateOfBirth: e.target.value})}
                    required
                    className="h-12 rounded-xl border-slate-800 bg-slate-950 text-white"
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
                    className="h-12 rounded-xl border-slate-800 bg-slate-950 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="class" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Admission Class</Label>
                  <select
                    id="class"
                    value={formData.class}
                    onChange={e => setFormData({...formData, class: e.target.value})}
                    className="w-full h-12 rounded-xl border border-slate-800 bg-slate-950 px-4 font-bold text-white focus:outline-none"
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
                    className="h-12 rounded-xl border-slate-800 bg-slate-950 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  required
                  className="h-12 rounded-xl border-slate-800 bg-slate-950 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                  required
                  className="h-12 rounded-xl border-slate-800 bg-slate-950 text-white"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-600 hover:bg-orange-500 text-white h-14 rounded-2xl font-black text-lg shadow-xl shadow-orange-500/20 mt-6 transition-all"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'Register & Proceed to Payment'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
