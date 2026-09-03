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
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.class) {
      alert('Please select your allocated class to complete setup.')
      return
    }

    setLoading(true)

    try {
      await createStudentProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        class: formData.class as 'JSS1' | 'JSS2' | 'JSS3' | 'SSS1' | 'SSS2' | 'SSS3',
      })

      router.push('/dashboard/student/overview')
    } catch (error: any) {
      console.error('Error creating student profile:', error)
      alert(error.message || 'Failed to create student profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-900 to-orange-800 px-4 py-12">
      <Card className="w-full max-w-md border-orange-700 bg-slate-900 shadow-2xl">
        <CardHeader>
          <CardTitle className="text-white text-2xl font-bold">Student Profile Setup</CardTitle>
          <CardDescription className="text-orange-200/60 font-medium">
            Complete your information to join EL LEARN App Academy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-orange-100">First Name</label>
                <Input
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="border-slate-700 bg-slate-800 text-white h-12 focus:border-orange-500"
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-orange-100">Last Name</label>
                <Input
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="border-slate-700 bg-slate-800 text-white h-12 focus:border-orange-500"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-orange-100">Class Allocation</label>
              <Select value={formData.class} onValueChange={(value) => setFormData({ ...formData, class: value })}>
                <SelectTrigger className="border-slate-700 bg-slate-800 text-white h-12">
                  <SelectValue placeholder="Select your class" />
                </SelectTrigger>
                <SelectContent className="border-slate-700 bg-slate-800 text-white">
                  <SelectItem value="JSS1">Junior Secondary 1 (JSS1)</SelectItem>
                  <SelectItem value="JSS2">Junior Secondary 2 (JSS2)</SelectItem>
                  <SelectItem value="JSS3">Junior Secondary 3 (JSS3)</SelectItem>
                  <SelectItem value="SSS1">Senior Secondary 1 (SSS1)</SelectItem>
                  <SelectItem value="SSS2">Senior Secondary 2 (SSS2)</SelectItem>
                  <SelectItem value="SSS3">Senior Secondary 3 (SSS3)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="p-4 bg-orange-500/10 rounded-xl border border-orange-500/20">
               <p className="text-xs text-orange-200 leading-relaxed">
                 Note: Your Admission Number (EGIA-S-XXXXXX or EGIA-P-XXXXXX) will be automatically generated upon completion of this setup.
               </p>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white h-14 font-black text-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? 'Processing...' : 'Complete Registration'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
