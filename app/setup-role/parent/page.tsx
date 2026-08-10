'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createParentProfile } from '@/app/actions/user'

export default function ParentSetupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    relationship: '',
    phoneNumber: '',
    wardAdmissionNumber: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.relationship) {
      alert('Please select your relationship (Father, Mother, Guardian, or Other) to complete setup.')
      return
    }

    setLoading(true)

    try {
      await createParentProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        wardAdmissionNumber: formData.wardAdmissionNumber,
        phoneNumber: formData.phoneNumber,
      })

      router.push('/dashboard/parent/overview')
    } catch (error: any) {
      console.error('Error creating parent profile:', error)
      alert(error.message || 'Failed to link ward. Please check the admission number.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-900 to-green-800 px-4 py-12">
      <Card className="w-full max-w-md border-emerald-700 bg-slate-900 shadow-2xl">
        <CardHeader>
          <CardTitle className="text-white text-2xl font-bold">Parent Profile Setup</CardTitle>
          <CardDescription className="text-emerald-200/60 font-medium">
            Link your child's account to start monitoring their progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-emerald-100">Ward's Admission Number</label>
              <Input
                required
                value={formData.wardAdmissionNumber}
                onChange={(e) => setFormData({ ...formData, wardAdmissionNumber: e.target.value.toUpperCase() })}
                className="border-slate-700 bg-slate-800 text-white h-12 focus:border-emerald-500 border-2"
                placeholder="EGIA-S-XXXXXX or EGIA-P-XXXXXX"
              />
              <p className="text-[10px] text-emerald-200/50">Example: EGIA-S-123456 or EGIA-P-123456</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-emerald-100">First Name</label>
                <Input
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="border-slate-700 bg-slate-800 text-white h-12"
                  placeholder="Michael"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-emerald-100">Last Name</label>
                <Input
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="border-slate-700 bg-slate-800 text-white h-12"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-emerald-100">Relationship</label>
              <Select value={formData.relationship} onValueChange={(value) => setFormData({ ...formData, relationship: value })}>
                <SelectTrigger className="border-slate-700 bg-slate-800 text-white h-12">
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent className="border-slate-700 bg-slate-800 text-white">
                  <SelectItem value="father">Father</SelectItem>
                  <SelectItem value="mother">Mother</SelectItem>
                  <SelectItem value="guardian">Guardian</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-emerald-100">Phone Number</label>
              <Input
                required
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="border-slate-700 bg-slate-800 text-white h-12"
                placeholder="+234..."
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-14 font-black text-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? 'Linking Ward...' : 'Complete Registration'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
