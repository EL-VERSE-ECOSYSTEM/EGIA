'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GraduationCap, Loader2, AlertCircle, Briefcase, User, CheckCircle2, BookOpen, Plus, X } from 'lucide-react'
import { registerTeacher, getRegistrationSubjects } from '@/app/actions/auth-server'

export default function TeacherSignUpPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    type: 'FULL_TIME', // FULL_TIME, PART_TIME
    resumptionDate: '',
    resumptionTime: '',
    schoolCode: '',
    bio: ''
  })

  const [handlingClasses, setHandlingClasses] = useState<string[]>([])
  const [teachingSubjects, setTeachingSubjects] = useState<string[]>([])
  const [presentDays, setPresentDays] = useState<string[]>([])

  // DB Subjects & Department Live Pulling
  const [availableSubjects, setAvailableSubjects] = useState<{ id: string; name: string; category?: string }[]>([])
  const [subjectSearchQuery, setSubjectSearchQuery] = useState('')
  const [manualSubject, setManualSubject] = useState('')

  useEffect(() => {
    getRegistrationSubjects()
      .then(subjects => setAvailableSubjects(subjects || []))
      .catch(() => setAvailableSubjects([]))
  }, [])

  const handleAddTeachingSubject = (name: string) => {
    if (!name || teachingSubjects.some(s => s.toLowerCase() === name.toLowerCase())) return
    setTeachingSubjects([...teachingSubjects, name])
  }

  const addManualTeachingSubject = () => {
    const name = manualSubject.trim()
    if (!name || teachingSubjects.some(item => item.toLowerCase() === name.toLowerCase())) return
    setTeachingSubjects([...teachingSubjects, name])
    setManualSubject('')
  }

  const handleRemoveTeachingSubject = (sub: string) => {
    setTeachingSubjects(teachingSubjects.filter(s => s !== sub))
  }

  // Passport Image preview
  const [passportImage, setProfileImage] = useState<string | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedStaffId, setGeneratedStaffId] = useState<string | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [copied, setCopied] = useState(false)
  const router = useRouter()

  // Class / Days options
  const classesList = ['Primary 3', 'Primary 4', 'Primary 5', 'Primary 6', 'JSS 1', 'JSS 2', 'JSS 3', 'SSS 1', 'SSS 2', 'SSS 3']
  const daysList = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

  const handleClassToggle = (cls: string) => {
    if (handlingClasses.includes(cls)) {
      setHandlingClasses(handlingClasses.filter(c => c !== cls))
    } else {
      setHandlingClasses([...handlingClasses, cls])
    }
  }

  const handleDayToggle = (day: string) => {
    if (presentDays.includes(day)) {
      setPresentDays(presentDays.filter(d => d !== day))
    } else {
      setPresentDays([...presentDays, day])
    }
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

    if (!passportImage) {
      return alert('Please upload a passport photograph.')
    }

    setLoading(true)

    const payload = {
      ...formData,
      handlingClasses,
      teachingSubjects,
      presentDays,
      profileImage: passportImage,
      facialVerificationVideo: null
    }

    try {
      const result = await registerTeacher(payload)

      if (result.error) {
        setError(result.error)
        alert(result.error)
        setLoading(false)
      } else {
        setGeneratedStaffId(result.staffCode || null)
        setShowSuccessModal(true)
        alert(`SUCCESS! Staff Registered! Your dynamically generated Staff ID is: ${result.staffCode}. Please write this down to log in.`)
        setLoading(false)
      }
    } catch (err) {
      setError('Account failed to create')
      alert('Account failed to create')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 py-16">
      <div className="mb-10 flex items-center gap-2">
        <div className="bg-purple-600 p-2 rounded-lg">
          <GraduationCap className="text-white w-6 h-6" />
        </div>
        <span className="font-black text-xl tracking-tight text-slate-900">EL LEARNERS APP <span className="text-purple-600">ACADEMY</span></span>
      </div>

      <Card className="max-w-xl w-full border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] overflow-hidden bg-white">
        <div className="h-2 bg-purple-600 w-full" />
        <CardHeader className="text-center pt-10">
          <div className="mx-auto bg-purple-100 p-4 rounded-2xl w-fit mb-4">
            <Briefcase className="w-8 h-8 text-purple-600" />
          </div>
          <CardTitle className="text-3xl font-black text-slate-900">Staff Registration</CardTitle>
          <CardDescription className="text-slate-500 font-bold mt-2">
            Join our team of excellence as a Full-time or Part-time Teacher
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-10 pb-12">
          <form onSubmit={handleSubmit} className="space-y-6">
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
                  <img src={passportImage} alt="Profile" className="w-28 h-28 object-cover rounded-full border-4 border-purple-200 shadow-lg" />
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
                    Select Passport Image
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="Jane"
                  value={formData.firstName}
                  onChange={e => setFormData({...formData, firstName: e.target.value})}
                  required
                  className="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-purple-600 transition-all duration-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Smith"
                  value={formData.lastName}
                  onChange={e => setFormData({...formData, lastName: e.target.value})}
                  required
                  className="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-purple-600 transition-all duration-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Work Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="jane@school.edu.ng"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  required
                  className="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-purple-600 transition-all duration-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="schoolCode" className="text-[10px] font-black uppercase text-purple-600 tracking-widest ml-1">School Registration Code *</Label>
                <Input
                  id="schoolCode"
                  placeholder="e.g. SCHO-12345"
                  value={formData.schoolCode}
                  onChange={async e => {
                    const code = e.target.value.toUpperCase()
                    setFormData({...formData, schoolCode: code})
                    if (code.length >= 6) {
                      const { getSchoolByCodeAction } = await import('@/app/actions/school')
                      const res = await getSchoolByCodeAction(code)
                      if (res.success && res.school) {
                        setError(null)
                      } else {
                        setError('Invalid School Registration Code. Please verify with your school administration.')
                      }
                    }
                  }}
                  required
                  className="h-12 rounded-xl border-purple-200 bg-purple-50/30 font-bold uppercase tracking-wider focus:bg-white focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all duration-300"
                />
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
                className="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-purple-600 transition-all duration-300"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Employment Type</Label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value})}
                  className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50/50 px-4 font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none transition-all duration-300"
                >
                  <option value="FULL_TIME">Full-Time</option>
                  <option value="PART_TIME">Part-Time</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="resumptionDate" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Resumption Date</Label>
                <Input
                  id="resumptionDate"
                  type="date"
                  value={formData.resumptionDate}
                  onChange={e => setFormData({...formData, resumptionDate: e.target.value})}
                  required
                  className="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-purple-600 transition-all duration-300"
                />
              </div>
            </div>

            {/* Classes handling selection */}
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Classes Currently Handling</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {classesList.map(cls => (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => handleClassToggle(cls)}
                    className={`h-11 rounded-xl border font-bold text-xs flex items-center justify-center transition-colors ${
                      handlingClasses.includes(cls) ? 'bg-purple-100 text-purple-700 border-purple-200' : 'border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    {cls}
                  </button>
                ))}
              </div>
            </div>

            {/* Part-time Specific Fields */}
            {formData.type === 'PART_TIME' && (
              <div className="p-6 bg-purple-50/50 rounded-3xl border border-purple-100 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                <p className="text-xs font-black uppercase text-purple-600 tracking-widest">Part-Time Specific Details</p>

                <div className="space-y-3 p-4 bg-white rounded-2xl border border-purple-100 shadow-sm">
                  <Label className="text-xs font-black uppercase text-purple-600 tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" /> Live Search Department & Subjects (Supabase Database)
                  </Label>
                  <p className="text-[11px] text-slate-500">Search and select subjects you teach in real time:</p>

                  <Input
                    placeholder="🔍 Search subjects..."
                    value={subjectSearchQuery}
                    onChange={e => setSubjectSearchQuery(e.target.value)}
                    className="h-10 text-xs bg-slate-50 border-slate-200 rounded-xl"
                  />

                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                    {availableSubjects
                      .filter(sub => sub.name.toLowerCase().includes(subjectSearchQuery.toLowerCase()))
                      .map(sub => {
                        const isSelected = teachingSubjects.some(s => s.toLowerCase() === sub.name.toLowerCase())
                        return (
                          <button
                            type="button"
                            key={sub.id}
                            onClick={() => handleAddTeachingSubject(sub.name)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                              isSelected ? 'bg-purple-600 text-white' : 'bg-white text-slate-700 hover:bg-purple-50 border border-slate-200'
                            }`}
                          >
                            {sub.name}
                            {isSelected ? <CheckCircle2 className="w-3 h-3" /> : <Plus className="w-3 h-3 text-slate-400" />}
                          </button>
                        )
                      })}
                  </div>

                  <div className="flex gap-2">
                    <Input
                      placeholder="Custom subject if not in list..."
                      value={manualSubject}
                      onChange={e => setManualSubject(e.target.value)}
                      className="h-10 text-xs bg-slate-50 border-slate-200 rounded-xl"
                    />
                    <Button type="button" onClick={addManualTeachingSubject} size="sm" className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shrink-0">
                      Add
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {teachingSubjects.map(sub => (
                      <span key={sub} className="px-3 py-1 rounded-full bg-purple-100 border border-purple-200 text-purple-700 text-xs font-bold flex items-center gap-1.5">
                        {sub}
                        <button type="button" onClick={() => handleRemoveTeachingSubject(sub)} className="hover:text-red-500">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="resumptionTime" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Time of Resumption</Label>
                  <Input
                    id="resumptionTime"
                    placeholder="e.g. 08:30 AM"
                    value={formData.resumptionTime}
                    onChange={e => setFormData({...formData, resumptionTime: e.target.value})}
                    required
                    className="h-12 rounded-xl border-slate-200 bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Days of Week Present</Label>
                  <div className="flex flex-wrap gap-2">
                    {daysList.map(day => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleDayToggle(day)}
                        className={`h-10 rounded-xl border px-4 font-bold text-xs flex items-center justify-center transition-colors ${
                          presentDays.includes(day) ? 'bg-purple-600 text-white border-purple-600' : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="bio" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Bio</Label>
              <textarea
                id="bio"
                placeholder="Write a brief professional bio..."
                value={formData.bio}
                onChange={e => setFormData({...formData, bio: e.target.value})}
                required
                className="w-full h-24 p-4 rounded-xl border border-slate-200 bg-slate-50/50 font-bold focus:bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none transition-all"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white h-14 rounded-2xl font-black text-lg shadow-xl shadow-purple-200 mt-6 animate-pulse"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'Register Staff'}
            </Button>
          </form>
          <div className="mt-8 text-center text-sm font-bold text-slate-400">
            Already registered? <Link href="/auth/signin" className="text-purple-600 font-black hover:underline ml-1">Sign In</Link>
          </div>
        </CardContent>
      </Card>

      {/* Dynamic Success Modal / Pop up Notification */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <Card className="max-w-md w-full border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden p-8 text-center animate-in fade-in zoom-in duration-300">
            <div className="mx-auto bg-purple-50 p-6 rounded-full w-fit mb-6">
              <CheckCircle2 className="w-16 h-16 text-purple-600" />
            </div>
            <h2 className="text-3xl font-black text-slate-900">Staff Registered</h2>
            <p className="text-slate-500 font-bold mt-2 uppercase tracking-widest text-xs">Staff ID Generated</p>
            <div className="my-6 p-6 bg-slate-50 border border-slate-100 rounded-3xl relative group">
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Your Staff ID (Staff Code)</p>
              <p className="text-4xl font-black text-purple-600 mt-2 tracking-widest">{generatedStaffId}</p>
              <Button
                size="sm"
                variant="outline"
                className="mt-4 rounded-xl border-slate-200 font-bold text-xs"
                onClick={() => {
                  if (generatedStaffId) {
                    navigator.clipboard.writeText(generatedStaffId)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  }
                }}
              >
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </Button>
            </div>
            <p className="text-slate-500 font-medium text-sm leading-relaxed mb-6">
              Please write this down or copy it to log in to the Staff/Teacher Portal.
            </p>
            <Button
              onClick={() => {
                setShowSuccessModal(false)
                router.push('/auth/signin')
              }}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white h-14 rounded-2xl font-black text-lg"
            >
              Proceed to Sign In
            </Button>
          </Card>
        </div>
      )}
    </div>
  )
}
