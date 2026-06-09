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
        qualification: formData.qualification,
        specialization: formData.specialization,
      })

      router.push('/dashboard/teacher/overview')
    } catch (error) {
      console.error('Error creating teacher profile:', error)
      alert('Failed to create teacher profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 px-4 py-12">
      <Card className="w-full max-w-md border-slate-700 bg-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Teacher Profile Setup</CardTitle>
          <CardDescription className="text-slate-400">
            Complete your teacher profile information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300">First Name</label>
              <Input
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="mt-1 border-slate-600 bg-slate-700 text-white"
                placeholder="Jane"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300">Last Name</label>
              <Input
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="mt-1 border-slate-600 bg-slate-700 text-white"
                placeholder="Smith"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300">Qualification (Optional)</label>
              <Input
                value={formData.qualification}
                onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                className="mt-1 border-slate-600 bg-slate-700 text-white"
                placeholder="B.Sc. Education"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300">Specialization (Optional)</label>
              <Input
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                className="mt-1 border-slate-600 bg-slate-700 text-white"
                placeholder="Mathematics"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Setting up...' : 'Continue to Dashboard'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
