'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Loader2, AlertCircle, GraduationCap, Briefcase } from 'lucide-react'
import { registerTeacher } from '@/app/actions/auth-server'

import { CheckCircle2 } from 'lucide-react'

export default function TeacherSignUpPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedStaffId, setGeneratedStaffId] = useState<string | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [copied, setCopied] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const result = await registerTeacher(formData)

      if (result.error) {
        setError(result.error)
        alert(result.error)
        setLoading(false)
      } else {
        setGeneratedStaffId(result.staffCode)
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
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
      <div className="mb-10 flex items-center gap-2">
        <div className="bg-purple-600 p-2 rounded-lg">
          <GraduationCap className="text-white w-6 h-6" />
        </div>
        <span className="font-black text-xl tracking-tight text-slate-900">EL GOODNEWS <span className="text-purple-600">ACADEMY</span></span>
      </div>

      <Card className="max-w-md w-full border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] overflow-hidden bg-white">
        <div className="h-2 bg-purple-600 w-full" />
        <CardHeader className="text-center pt-10">
          <div className="mx-auto bg-purple-100 p-4 rounded-2xl w-fit mb-4">
            <Briefcase className="w-8 h-8 text-purple-600" />
          </div>
          <CardTitle className="text-3xl font-black text-slate-900">Staff Registration</CardTitle>
          <CardDescription className="text-slate-500 font-bold mt-2">
            Join our team of excellence
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="Jane"
                  value={formData.firstName}
                  onChange={e => setFormData({...formData, firstName: e.target.value})}
                  required
                  className="h-12 rounded-xl border-slate-200"
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
                  className="h-12 rounded-xl border-slate-200"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Work Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="jane@elgoodnews.edu.ng"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                required
                className="h-12 rounded-xl border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" title="password" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                required
                className="h-12 rounded-xl border-slate-200"
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
