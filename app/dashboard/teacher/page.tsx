'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { BookOpen, BarChart3, Users, Calendar } from 'lucide-react'

export default function TeacherDashboard() {
  const quickActions = [
    {
      title: 'Create Assessment',
      description: 'Create new quiz or exam',
      icon: BookOpen,
      href: '/dashboard/teacher/assessments/create',
      color: 'bg-purple-100 text-purple-800',
    },
    {
      title: 'Mark Attendance',
      description: 'Record student attendance',
      icon: Users,
      href: '/dashboard/teacher/attendance',
      color: 'bg-purple-100 text-purple-800',
    },
    {
      title: 'View Analytics',
      description: 'Class performance insights',
      icon: BarChart3,
      href: '/dashboard/teacher/analytics',
      color: 'bg-purple-100 text-purple-800',
    },
    {
      title: 'My Classes',
      description: 'Manage assigned classes',
      icon: Calendar,
      href: '/dashboard/teacher/classes',
      color: 'bg-purple-100 text-purple-800',
    },
  ]

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Teacher Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back! Manage your classes and assessments</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickActions.map((action) => {
          const Icon = action.icon
          return (
            <Link key={action.href} href={action.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{action.title}</CardTitle>
                    <div className={`p-3 rounded-lg ${action.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>
                  <CardDescription>{action.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Assessments</CardTitle>
            <CardDescription>Your latest created assessments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-gray-500 text-sm">No assessments yet. Create your first assessment to get started.</p>
              <Link
                href="/dashboard/teacher/assessments/create"
                className="inline-block px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Create Assessment
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Class Statistics</CardTitle>
            <CardDescription>Overview of your classes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between border-b pb-3">
              <span className="text-gray-600">Classes Assigned</span>
              <span className="font-semibold">0</span>
            </div>
            <div className="flex justify-between border-b pb-3">
              <span className="text-gray-600">Total Students</span>
              <span className="font-semibold">0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Assessments Created</span>
              <span className="font-semibold">0</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
