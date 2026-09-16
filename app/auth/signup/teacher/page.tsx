'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GraduationCap, Loader2, AlertCircle, Briefcase, User, CheckCircle2, BookOpen, Plus, X, Sparkles, Building2 } from 'lucide-react'
import { registerTeacher, getRegistrationSubjects } from '@/app/actions/auth-server'
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator'

export default function TeacherSignUpPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: 'Male',
    email: '',
    password: '',
    type: 'FULL_TIME', // FULL_TIME, PART_TIME
    resumptionDate: '',
    resumptionTime: '',
    schoolCode: '',
    bio: ''
  })

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
        setLoading(false)
      } else {
        setGeneratedStaffId(result.staffCode || null)
        setShowSuccessModal(true)
        setLoading(false)
      }
    } catch (err: any) {
      setError(err?.message || 'Account failed to create. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 sm:p-8 relative overflow-hidden perspective-[1200px]">
      {/* Background Glow Lights */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-teal-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <header className="relative max-w-5xl mx-auto w-full flex items-center justify-between py-4 border-b border-slate-800 z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-teal-500/20 border border-teal-500/30 backdrop-blur-md shadow-lg text-teal-400">
            <GraduationCap className="w-6 h-6" />
          </div>
          <span className="font-black text-xl tracking-tight text-white uppercase">
            EL <span className="text-teal-400">LEARNERS APP</span>
          </span>
        </div>
        <Link href="/auth/signin" className="text-xs font-black text-teal-400 hover:text-teal-300 uppercase tracking-wider transition bg-white/5 px-4 py-2 rounded-xl border border-white/10">
          Already registered? Sign In
        </Link>
      </header>

      <main
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          transition: 'transform 0.15s ease-out'
        }}
        className="relative max-w-3xl mx-auto w-full my-8 bg-slate-900/90 backdrop-blur-2xl border border-white/15 rounded-[2.5rem] p-6 sm:p-10 shadow-[0_30px_100px_rgba(0,0,0,0.5)] z-10"
      >
        <div className="mb-8 text-center sm:text-left space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs font-black uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" /> Faculty Onboarding
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Staff & Educator Registration
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm font-bold leading-relaxed">
            Join our team of excellence as a Full-time or Part-time Teacher. Manage CBT assessments, mark attendance, and deliver virtual sessions.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-black flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Passport picture Upload Block */}
          <div className="flex flex-col items-center justify-center p-6 bg-slate-950 rounded-3xl border border-slate-800 space-y-4">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-wider">Passport Photograph *</Label>
            {passportImage ? (
              <div className="relative">
                <img src={passportImage} alt="Profile" className="w-28 h-28 object-cover rounded-full border-4 border-teal-500 shadow-lg" />
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
                  Select Passport Image
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label htmlFor="firstName" className="text-[10px] font-black uppercase text-slate-400 tracking-widest">First Name *</Label>
              <Input
                id="firstName"
                placeholder="Jane"
                value={formData.firstName}
                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                required
                className="h-12 rounded-xl border-slate-800 bg-slate-950 text-white font-bold"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="lastName" className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Last Name *</Label>
              <Input
                id="lastName"
                placeholder="Smith"
                value={formData.lastName}
                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                required
                className="h-12 rounded-xl border-slate-800 bg-slate-950 text-white font-bold"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="gender" className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Gender *</Label>
              <select
                id="gender"
                value={formData.gender}
                onChange={e => setFormData({ ...formData, gender: e.target.value })}
                className="w-full h-12 rounded-xl border border-slate-800 bg-slate-950 px-3 font-bold text-white focus:outline-none"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="email" className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Work Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="jane@school.edu.ng"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                required
                className="h-12 rounded-xl border-slate-800 bg-slate-950 text-white font-bold"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="schoolCode" className="text-[10px] font-black uppercase text-teal-400 tracking-widest">School Registration Code *</Label>
              <Input
                id="schoolCode"
                placeholder="e.g. EXCE-12345"
                value={formData.schoolCode}
                onChange={async e => {
                  const code = e.target.value.toUpperCase()
                  setFormData({ ...formData, schoolCode: code })
                  if (code.length >= 5) {
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
                className="h-12 rounded-xl border-teal-500/40 bg-slate-950 font-mono font-bold text-white uppercase tracking-wider focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="password" className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Password *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              required
              className="h-12 rounded-xl border-slate-800 bg-slate-950 text-white font-bold"
            />
            <PasswordStrengthIndicator password={formData.password} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="type" className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Employment Type *</Label>
              <select
                id="type"
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
                className="w-full h-12 rounded-xl border border-slate-800 bg-slate-950 px-4 font-bold text-white focus:outline-none"
              >
                <option value="FULL_TIME">Full-Time</option>
                <option value="PART_TIME">Part-Time</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="resumptionDate" className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Resumption Date *</Label>
              <Input
                id="resumptionDate"
                type="date"
                value={formData.resumptionDate}
                onChange={e => setFormData({ ...formData, resumptionDate: e.target.value })}
                required
                className="h-12 rounded-xl border-slate-800 bg-slate-950 text-white font-bold"
              />
            </div>
          </div>

          {/* Classes handling selection */}
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Classes Currently Handling</Label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {classesList.map(cls => (
                <button
                  key={cls}
                  type="button"
                  onClick={() => handleClassToggle(cls)}
                  className={`h-10 rounded-xl border font-bold text-xs flex items-center justify-center transition-colors ${
                    handlingClasses.includes(cls) ? 'bg-teal-500/20 text-teal-300 border-teal-500' : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {cls}
                </button>
              ))}
            </div>
          </div>

          {/* Part-time Specific Fields */}
          {formData.type === 'PART_TIME' && (
            <div className="p-6 bg-slate-950 rounded-3xl border border-slate-800 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
              <p className="text-xs font-black uppercase text-teal-400 tracking-widest">Part-Time Specific Details</p>

              <div className="space-y-3 p-4 bg-slate-900 rounded-2xl border border-slate-800">
                <Label className="text-xs font-black uppercase text-teal-400 tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" /> Live Search Department & Subjects (Supabase Database)
                </Label>
                <p className="text-[11px] text-slate-400">Search and select subjects you teach in real time:</p>

                <Input
                  placeholder="🔍 Search subjects..."
                  value={subjectSearchQuery}
                  onChange={e => setSubjectSearchQuery(e.target.value)}
                  className="h-10 text-xs bg-slate-950 border-slate-800 text-white rounded-xl"
                />

                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-slate-950 rounded-xl border border-slate-800">
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
                            isSelected ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
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
                    className="h-10 text-xs bg-slate-950 border-slate-800 text-white rounded-xl"
                  />
                  <Button type="button" onClick={addManualTeachingSubject} size="sm" className="bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl shrink-0">
                    Add
                  </Button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-2">
                  {teachingSubjects.map(sub => (
                    <span key={sub} className="px-3 py-1 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs font-bold flex items-center gap-1.5">
                      {sub}
                      <button type="button" onClick={() => handleRemoveTeachingSubject(sub)} className="hover:text-red-400">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="resumptionTime" className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Time of Resumption *</Label>
                <Input
                  id="resumptionTime"
                  placeholder="e.g. 08:30 AM"
                  value={formData.resumptionTime}
                  onChange={e => setFormData({ ...formData, resumptionTime: e.target.value })}
                  required
                  className="h-12 rounded-xl border-slate-800 bg-slate-950 text-white font-bold"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Days of Week Present</Label>
                <div className="flex flex-wrap gap-2">
                  {daysList.map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleDayToggle(day)}
                      className={`h-10 rounded-xl border px-4 font-bold text-xs flex items-center justify-center transition-colors ${
                        presentDays.includes(day) ? 'bg-teal-600 text-white border-teal-600' : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor="bio" className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Professional Bio *</Label>
            <textarea
              id="bio"
              placeholder="Write a brief professional bio..."
              value={formData.bio}
              onChange={e => setFormData({ ...formData, bio: e.target.value })}
              required
              className="w-full h-24 p-4 rounded-xl border border-slate-800 bg-slate-950 text-white font-bold focus:outline-none transition-all"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-600 hover:bg-teal-500 text-white h-14 rounded-2xl font-black text-lg shadow-xl shadow-teal-900/30 transition-all uppercase tracking-wider"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'Register Staff Member'}
          </Button>
        </form>
      </main>

      {/* Success Staff ID Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <Card className="max-w-md w-full border border-teal-500/40 shadow-2xl rounded-[2.5rem] bg-slate-950 text-white overflow-hidden p-8 text-center animate-in fade-in zoom-in duration-300">
            <div className="mx-auto bg-teal-500/20 border border-teal-500 p-6 rounded-full w-fit mb-6 text-teal-400">
              <CheckCircle2 className="w-16 h-16" />
            </div>
            <h2 className="text-3xl font-black text-white">Staff Registered</h2>
            <p className="text-slate-400 font-bold mt-2 uppercase tracking-widest text-xs">Staff ID Generated</p>
            <div className="my-6 p-6 bg-slate-900 border border-slate-800 rounded-3xl relative">
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Your Staff ID Code</p>
              <p className="text-4xl font-black text-teal-400 mt-2 tracking-widest">{generatedStaffId}</p>
              <Button
                size="sm"
                variant="outline"
                className="mt-4 rounded-xl border-slate-700 bg-slate-800 text-white font-bold text-xs"
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
            <p className="text-slate-400 font-medium text-sm leading-relaxed mb-6">
              Please save your unique Staff ID Code to sign in to the Teacher / Faculty Portal.
            </p>
            <Button
              onClick={() => {
                setShowSuccessModal(false)
                router.push('/auth/signin')
              }}
              className="w-full bg-teal-600 hover:bg-teal-500 text-white h-14 rounded-2xl font-black text-lg"
            >
              Proceed to Sign In
            </Button>
          </Card>
        </div>
      )}

      <footer className="relative max-w-5xl mx-auto w-full text-center py-4 border-t border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-widest z-10">
        &copy; {new Date().getFullYear()} EL LEARNERS APP • Educator Portal
      </footer>
    </div>
  )
}
