'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GraduationCap, Loader2, AlertCircle, Laptop, CheckCircle2, User, Plus, X, Building2, BookOpen } from 'lucide-react'
import { registerStudent, getRegistrationSubjects } from '@/app/actions/auth-server'
import { initializeStudentRegistrationPayment, getStudentIdByAdmissionNumber } from '@/app/actions/payments'
import { getSchoolByCodeAction } from '@/app/actions/school'
import { Badge } from '@/components/ui/badge'

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

  // School Verification state
  const [verifyingSchool, setVerifyingSchool] = useState(false)
  const [schoolDetails, setSchoolDetails] = useState<{ id: string; name: string; allowParents: boolean } | null>(null)
  const [schoolError, setSchoolError] = useState<string | null>(null)

  // Subjects Done tag list & database subjects with live search
  const [subjectsDone, setSubjectsDone] = useState<string[]>([])
  const [availableSubjects, setAvailableSubjects] = useState<{ id: string; name: string; category?: string }[]>([])
  const [subjectSearchQuery, setSubjectSearchQuery] = useState('')
  const [manualSubject, setManualSubject] = useState('')

  // Passport photo state
  const [passportImage, setProfileImage] = useState<string | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [isValidDate, setIsValidDate] = useState(false)
  const [generatedAdmissionNumber, setGeneratedAdmissionNumber] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const now = new Date()
    const deadline = new Date('2026-09-30T23:59:59')
    setIsValidDate(now <= deadline)

    // Pull subjects from Supabase DB in real-time / on load
    getRegistrationSubjects()
      .then(subjects => setAvailableSubjects(subjects || []))
      .catch(() => setAvailableSubjects([]))

    const pendingAdmission = localStorage.getItem('pending_student_admission')
    if (pendingAdmission) {
      setGeneratedAdmissionNumber(pendingAdmission)
      setShowSuccessModal(true)
      localStorage.removeItem('pending_student_admission')
    }
  }, [])

  const handleSchoolCodeCheck = async (code: string) => {
    const cleanCode = code.trim().toUpperCase()
    if (cleanCode.length < 5) {
      setSchoolDetails(null)
      setSchoolError(null)
      return
    }

    setVerifyingSchool(true)
    setSchoolError(null)

    try {
      const res = await getSchoolByCodeAction(cleanCode)
      if (res.success && res.school) {
        setSchoolDetails({
          id: res.school.id,
          name: res.school.name,
          allowParents: res.school.allowParents ?? true
        })
        setSchoolError(null)
      } else {
        setSchoolDetails(null)
        setSchoolError('Invalid School Code. Please check with your school administrator.')
      }
    } catch (err) {
      setSchoolError('Could not verify school code at this time.')
    } finally {
      setVerifyingSchool(false)
    }
  }

  const handleAddSubject = (name: string) => {
    if (!name || subjectsDone.some(s => s.toLowerCase() === name.toLowerCase())) return
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

  const isSeniorClass = formData.class === 'SSS1' || formData.class === 'SSS2' || formData.class === 'SSS3'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.schoolCode) {
      setError('School Registration Code is required.')
      return
    }

    if (schoolError || !schoolDetails) {
      setError('Please provide a valid School Registration Code before proceeding.')
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
      return alert('Please select or add at least one subject done.')
    }

    setLoading(true)

    try {
      const payload = {
        ...formData,
        schoolCode: formData.schoolCode.trim().toUpperCase(),
        department: isSeniorClass ? (formData.department || 'SCIENCE') : 'GENERAL',
        subjectsDone,
        profileImage: passportImage,
        facialVerificationVideo: null
      }

      const result = await registerStudent(payload)

      if (result.error || !result.admissionNumber) {
        setError(result.error || 'Failed to generate admission number')
        setLoading(false)
        return
      }

      const admissionNum = result.admissionNumber
      setGeneratedAdmissionNumber(admissionNum)
      localStorage.setItem('pending_student_admission', admissionNum)

      const studentId = await getStudentIdByAdmissionNumber(admissionNum)
      if (!studentId) throw new Error('Registration record could not be loaded for payment.')
      const payment = await initializeStudentRegistrationPayment(studentId)
      alert(`Your admission number is ${admissionNum}. Continue to Korapay to pay the ₦2,000 registration fee.`)
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
        <span className="font-black text-xl tracking-tight text-white">EL LEARNERS APP <span className="text-orange-500">ACADEMY</span></span>
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

              {/* Real-time School Code Verification Block */}
              <div className="space-y-2 bg-orange-500/10 border border-orange-500/30 p-4 rounded-2xl">
                <div className="flex justify-between items-center">
                  <Label htmlFor="schoolCode" className="text-xs font-black uppercase text-orange-400 tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-4 h-4" /> School Registration Code *
                  </Label>
                  {verifyingSchool && (
                    <span className="text-[10px] text-orange-400 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Verifying...
                    </span>
                  )}
                </div>
                <Input
                  id="schoolCode"
                  placeholder="e.g. EXCE-12345"
                  value={formData.schoolCode}
                  onChange={e => {
                    const code = e.target.value.toUpperCase()
                    setFormData({ ...formData, schoolCode: code })
                    handleSchoolCodeCheck(code)
                  }}
                  required
                  className="h-11 rounded-xl border-slate-800 bg-slate-950 text-white font-mono uppercase focus:ring-2 focus:ring-orange-500"
                />

                {schoolDetails && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs font-bold text-emerald-400">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Verified: <strong>{schoolDetails.name}</strong></span>
                    </div>
                    <Badge className={schoolDetails.allowParents ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}>
                      {schoolDetails.allowParents ? 'Parents Allowed' : 'Parents Disabled'}
                    </Badge>
                  </div>
                )}

                {schoolError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs font-bold text-red-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{schoolError}</span>
                  </div>
                )}
              </div>

              {/* Passport Picture Upload */}
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
                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
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
                    onChange={e => setFormData({ ...formData, middleName: e.target.value })}
                    className="h-11 rounded-xl border-slate-800 bg-slate-950 text-white text-xs font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="lastName" className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
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
                    onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
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
                    onChange={e => setFormData({ ...formData, dateOfResumption: e.target.value })}
                    required
                    className="h-12 rounded-xl border-slate-800 bg-slate-950 text-white"
                  />
                </div>
              </div>

              {/* Class & Department Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="class" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Admission Class</Label>
                  <select
                    id="class"
                    value={formData.class}
                    onChange={e => setFormData({ ...formData, class: e.target.value })}
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

                {isSeniorClass && (
                  <div className="space-y-2">
                    <Label htmlFor="department" className="text-[10px] font-black uppercase text-orange-400 tracking-widest ml-1">Department *</Label>
                    <select
                      id="department"
                      value={formData.department}
                      onChange={e => setFormData({ ...formData, department: e.target.value })}
                      className="w-full h-12 rounded-xl border border-orange-500/40 bg-slate-950 px-4 font-bold text-white focus:outline-none"
                    >
                      <option value="SCIENCE">SCIENCE</option>
                      <option value="ARTS">ARTS</option>
                      <option value="COMMERCIAL">COMMERCIAL</option>
                    </select>
                  </div>
                )}

                {!isSeniorClass && (
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john.doe@example.com"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="h-12 rounded-xl border-slate-800 bg-slate-950 text-white"
                    />
                  </div>
                )}
              </div>

              {isSeniorClass && (
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john.doe@example.com"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="h-12 rounded-xl border-slate-800 bg-slate-950 text-white"
                  />
                </div>
              )}

              {/* Department & Real-Time Subjects Done Selection */}
              <div className="space-y-3 p-4 bg-slate-950 rounded-2xl border border-slate-800">
                <Label className="text-xs font-black uppercase text-orange-400 tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" /> Live Search Department & Subjects (Supabase Database)
                </Label>
                <p className="text-[11px] text-slate-400">Search and click subjects or add custom subjects below:</p>

                {/* Live Search Box */}
                <Input
                  placeholder="🔍 Type to search subjects in real time..."
                  value={subjectSearchQuery}
                  onChange={e => setSubjectSearchQuery(e.target.value)}
                  className="h-10 text-xs bg-slate-900 border-slate-800 text-white rounded-xl placeholder:text-slate-500"
                />

                {/* Filtered DB Subject Badges */}
                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-2 bg-slate-900 rounded-xl border border-slate-800">
                  {availableSubjects
                    .filter(sub => sub.name.toLowerCase().includes(subjectSearchQuery.toLowerCase()))
                    .map(sub => {
                      const isSelected = subjectsDone.some(s => s.toLowerCase() === sub.name.toLowerCase())
                      return (
                        <button
                          type="button"
                          key={sub.id}
                          onClick={() => handleAddSubject(sub.name)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                            isSelected
                              ? 'bg-orange-500 text-white'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {sub.name}
                          {isSelected ? <CheckCircle2 className="w-3 h-3" /> : <Plus className="w-3 h-3 text-slate-400" />}
                        </button>
                      )
                    })}
                  {availableSubjects.filter(sub => sub.name.toLowerCase().includes(subjectSearchQuery.toLowerCase())).length === 0 && (
                    <p className="text-[11px] text-slate-500 p-2 italic">No matching subject found in database.</p>
                  )}
                </div>

                {/* Manual Subject Addition */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Add custom subject if not listed above..."
                    value={manualSubject}
                    onChange={e => setManualSubject(e.target.value)}
                    className="h-10 text-xs bg-slate-900 border-slate-800 text-white rounded-xl"
                  />
                  <Button type="button" onClick={addManualSubject} size="sm" className="bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl shrink-0">
                    Add Subject
                  </Button>
                </div>

                {/* Selected Subjects Tags */}
                <div className="space-y-1 pt-2">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Selected Subjects ({subjectsDone.length}):</span>
                  <div className="flex flex-wrap gap-1.5">
                    {subjectsDone.map(sub => (
                      <span key={sub} className="px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-300 text-xs font-bold flex items-center gap-1.5">
                        {sub}
                        <button type="button" onClick={() => handleRemoveSubject(sub)} className="hover:text-red-400">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
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
                  onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
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
