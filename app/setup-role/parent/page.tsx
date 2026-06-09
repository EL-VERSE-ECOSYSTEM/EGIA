'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createParentProfile, linkChildToParent } from '@/app/actions/user'

export default function ParentSetupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    relationship: '',
    phoneNumber: '',
    occupation: '',
    childAdmissionNumber: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const parentResult = await createParentProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        relationship: formData.relationship as 'father' | 'mother' | 'guardian' | 'other',
        phoneNumber: formData.phoneNumber,
        occupation: formData.occupation,
      })

      if (formData.childAdmissionNumber && parentResult) {
        await linkChildToParent(formData.childAdmissionNumber, parentResult.id)
      }

      router.push('/dashboard/parent/overview')
    } catch (error) {
      console.error('Error creating parent profile:', error)
      alert('Failed to create parent profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 px-4 py-12">
      <Card className="w-full max-w-md border-slate-700 bg-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Parent Profile Setup</CardTitle>
          <CardDescription className="text-slate-400">
            Complete your parent profile information
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
                placeholder="Michael"
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
              <label className="block text-sm font-medium text-slate-300">Relationship</label>
              <Select value={formData.relationship} onValueChange={(value) => setFormData({ ...formData, relationship: value })}>
                <SelectTrigger className="border-slate-600 bg-slate-700 text-white">
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent className="border-slate-600 bg-slate-700">
                  <SelectItem value="father">Father</SelectItem>
                  <SelectItem value="mother">Mother</SelectItem>
                  <SelectItem value="guardian">Guardian</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300">Phone Number (Optional)</label>
              <Input
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="mt-1 border-slate-600 bg-slate-700 text-white"
                placeholder="+234 123 456 7890"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300">Occupation (Optional)</label>
              <Input
                value={formData.occupation}
                onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                className="mt-1 border-slate-600 bg-slate-700 text-white"
                placeholder="Engineer"
              />
            </div>

            <div className="pt-4 border-t border-slate-700">
              <label className="block text-sm font-medium text-amber-400">Link Child (Admission Number)</label>
              <Input
                value={formData.childAdmissionNumber}
                onChange={(e) => setFormData({ ...formData, childAdmissionNumber: e.target.value })}
                className="mt-1 border-slate-600 bg-slate-700 text-white"
                placeholder="e.g. EG/2024/001"
              />
              <p className="mt-1 text-xs text-slate-500">You can add more children later from your dashboard.</p>
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
