'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createStudentProfile } from '@/app/actions/user'

export default function StudentSetupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    class: '',
    admissionNumber: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await createStudentProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        class: formData.class as 'JSS1' | 'JSS2' | 'JSS3' | 'SSS1' | 'SSS2' | 'SSS3',
        admissionNumber: formData.admissionNumber,
      })

      router.push('/student')
    } catch (error) {
      console.error('Error creating student profile:', error)
      alert('Failed to create student profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 px-4 py-12">
      <Card className="w-full max-w-md border-slate-700 bg-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Student Profile Setup</CardTitle>
          <CardDescription className="text-slate-400">
            Complete your student profile information
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
                placeholder="John"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300">Last Name</label>
              <Input
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="mt-1 border-slate-600 bg-slate-700 text-white"
                placeholder="Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300">Class</label>
              <Select value={formData.class} onValueChange={(value) => setFormData({ ...formData, class: value })}>
                <SelectTrigger className="border-slate-600 bg-slate-700 text-white">
                  <SelectValue placeholder="Select your class" />
                </SelectTrigger>
                <SelectContent className="border-slate-600 bg-slate-700">
                  <SelectItem value="JSS1">JSS 1</SelectItem>
                  <SelectItem value="JSS2">JSS 2</SelectItem>
                  <SelectItem value="JSS3">JSS 3</SelectItem>
                  <SelectItem value="SSS1">SSS 1</SelectItem>
                  <SelectItem value="SSS2">SSS 2</SelectItem>
                  <SelectItem value="SSS3">SSS 3</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300">Admission Number (Optional)</label>
              <Input
                value={formData.admissionNumber}
                onChange={(e) => setFormData({ ...formData, admissionNumber: e.target.value })}
                className="mt-1 border-slate-600 bg-slate-700 text-white"
                placeholder="ADM-2024-001"
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
