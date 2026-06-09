'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { db } from '@/lib/db'
import { userRole } from '@/lib/db/schema'
import { createAdminProfile } from '@/app/actions/user'

export default function AdminSetupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSetupAdmin = async () => {
    setLoading(true)

    try {
      await createAdminProfile()
      router.push('/dashboard/admin/overview')
    } catch (error) {
      console.error('Error setting up admin:', error)
      alert('Failed to setup admin account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 px-4 py-12">
      <Card className="w-full max-w-md border-slate-700 bg-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Administrator Setup</CardTitle>
          <CardDescription className="text-slate-400">
            Complete your administrator setup
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-slate-300">
              You&apos;re about to create an administrator account. Admin users have full access to the school management system.
            </p>

            <div className="rounded-lg border border-slate-600 bg-slate-700/50 p-4">
              <h3 className="mb-2 font-semibold text-white">Admin Privileges Include:</h3>
              <ul className="space-y-2 text-sm text-slate-300">
                <li>✓ Manage all users (teachers, students, parents)</li>
                <li>✓ Configure school settings and fee structure</li>
                <li>✓ Monitor all academic activities</li>
                <li>✓ Generate reports and analytics</li>
                <li>✓ Manage payments and financial records</li>
              </ul>
            </div>

            <Button
              onClick={handleSetupAdmin}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Setting up...' : 'Continue to Admin Dashboard'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
