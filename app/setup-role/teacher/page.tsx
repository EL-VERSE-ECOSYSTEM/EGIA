'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { createTeacherProfile } from '@/app/actions/user'

export default function TeacherSetupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    staffCode: '',
    qualification: '',
    specialization: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await createTeacherProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        staffCode: formData.staffCode,
        qualification: formData.qualification,
        specialization: formData.specialization,
      })

      router.push('/dashboard/teacher/overview')
    } catch (error: any) {
      console.error('Error creating teacher profile:', error)
      alert(error.message || 'Failed to create teacher profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-900 to-violet-800 px-4 py-12">
      <Card className="w-full max-w-md border-purple-700 bg-slate-900 shadow-2xl">
        <CardHeader>
          <CardTitle className="text-white text-2xl font-bold">Academic Staff Setup</CardTitle>
          <CardDescription className="text-purple-200/60 font-medium">
            Complete your profile using the staff code provided by administration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-purple-100">Staff Verification Code</label>
              <Input
                required
                value={formData.staffCode}
                onChange={(e) => setFormData({ ...formData, staffCode: e.target.value })}
                className="border-slate-700 bg-slate-800 text-white h-12 focus:border-purple-500"
                placeholder="Enter Code"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-purple-100">First Name</label>
                <Input
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="border-slate-700 bg-slate-800 text-white h-12 focus:border-purple-500"
                  placeholder="Jane"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-purple-100">Last Name</label>
                <Input
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="border-slate-700 bg-slate-800 text-white h-12 focus:border-purple-500"
                  placeholder="Smith"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-purple-100">Highest Qualification</label>
              <Input
                value={formData.qualification}
                onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                className="border-slate-700 bg-slate-800 text-white h-12 focus:border-purple-500"
                placeholder="e.g. B.Sc. Education"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-purple-100">Specialization</label>
              <Input
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                className="border-slate-700 bg-slate-800 text-white h-12 focus:border-purple-500"
                placeholder="e.g. Mathematics / Physics"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white h-14 font-black text-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? 'Verifying...' : 'Complete Staff Setup'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
