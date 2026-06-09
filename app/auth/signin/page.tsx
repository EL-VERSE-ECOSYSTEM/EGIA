'use client'

import React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User, GraduationCap, Users, ShieldCheck } from 'lucide-react'

export default function SignInRolePage() {
  const roles = [
    {
      title: 'Student',
      description: 'Access your courses, CBT exams, and results.',
      icon: GraduationCap,
      href: '/api/auth/signin', // Better Auth handles the actual signin
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    {
      title: 'Teacher',
      description: 'Manage assessments, lesson notes, and student performance.',
      icon: User,
      href: '/api/auth/signin',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      title: 'Parent',
      description: 'Monitor your children\'s progress and pay school fees.',
      icon: Users,
      href: '/api/auth/signin',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200'
    },
    {
      title: 'Admin',
      description: 'Full school administration and financial oversight.',
      icon: ShieldCheck,
      href: '/api/auth/signin',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200'
    }
  ]

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Welcome to EL GOODNEWS INT'L ACADEMY
          </h1>
          <p className="text-xl text-slate-600">
            Please select your role to continue to the dashboard
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roles.map((role) => (
            <Card key={role.title} className={`hover:shadow-lg transition-all border-2 ${role.borderColor}`}>
              <CardHeader className="flex flex-row items-center space-x-4 pb-2">
                <div className={`p-3 rounded-lg ${role.bgColor}`}>
                  <role.icon className={`w-8 h-8 ${role.color}`} />
                </div>
                <div>
                  <CardTitle className="text-2xl">{role.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base mb-6">
                  {role.description}
                </CardDescription>
                <Button asChild className="w-full font-bold">
                  <Link href={role.href}>Sign In as {role.title}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center text-slate-500">
          <p>Don't have an account? <Link href="/auth/signup/parent" className="text-purple-600 font-bold hover:underline">Register as Parent</Link></p>
        </div>
      </div>
    </div>
  )
}
