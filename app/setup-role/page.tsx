'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Users, School, UserCheck } from 'lucide-react'

export default function SetupRolePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const roles = [
    {
      id: 'student',
      name: 'Student',
      description: 'Access your classes, assessments, and grades',
      icon: BookOpen,
    },
    {
      id: 'teacher',
      name: 'Teacher',
      description: 'Manage classes, create assessments, and grade students',
      icon: Users,
    },
    {
      id: 'parent',
      name: 'Parent',
      description: 'Monitor your child&apos;s academic progress and performance',
      icon: UserCheck,
    },
    {
      id: 'admin',
      name: 'Administrator',
      description: 'Manage school settings, users, and overall operations',
      icon: School,
    },
  ]

  const handleSelectRole = (roleId: string) => {
    setLoading(true)
    // Redirect to role-specific setup page
    router.push(`/setup-role/${roleId}`)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 px-4 py-12">
      <div className="w-full max-w-4xl">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-white">Welcome to EL LEARNERS App Academy</h1>
          <p className="mt-4 text-xl text-slate-300">Please select your role to get started</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {roles.map((role) => {
            const Icon = role.icon
            return (
              <Card key={role.id} className="border-slate-700 bg-slate-800">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-white">{role.name}</CardTitle>
                      <CardDescription className="text-slate-400">{role.description}</CardDescription>
                    </div>
                    <Icon className="text-blue-400" size={32} />
                  </div>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => handleSelectRole(role.id)}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    Select {role.name}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <p className="mt-8 text-center text-sm text-slate-400">
          By selecting a role, you agree to our{' '}
          <a href="#" className="text-blue-400 hover:underline">
            Terms of Service
          </a>
        </p>
      </div>
    </main>
  )
}
