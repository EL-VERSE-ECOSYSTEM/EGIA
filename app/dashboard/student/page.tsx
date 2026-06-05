'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { BookOpen, Award, Calendar, MessageSquare } from 'lucide-react'

export default function StudentDashboard() {
  const quickActions = [
    {
      title: 'Assessments',
      description: 'Take available quizzes',
      icon: BookOpen,
      href: '/dashboard/student/assessments',
      color: 'bg-orange-100 text-orange-800',
    },
    {
      title: 'My Results',
      description: 'View your grades',
      icon: Award,
      href: '/dashboard/student/results',
      color: 'bg-orange-100 text-orange-800',
    },
    {
      title: 'Timetable',
      description: 'Class schedule',
      icon: Calendar,
      href: '/dashboard/student/timetable',
      color: 'bg-orange-100 text-orange-800',
    },
    {
      title: 'Messages',
      description: 'Contact teachers',
      icon: MessageSquare,
      href: '/dashboard/student/messages',
      color: 'bg-orange-100 text-orange-800',
    },
  ]

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Student Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome! Check your assignments and academic progress</p>
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
            <CardTitle>Active Assessments</CardTitle>
            <CardDescription>Quizzes available to you</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-gray-500 text-sm">No active assessments. Check back later for new quizzes.</p>
              <Link
                href="/dashboard/student/assessments"
                className="inline-block px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                View All
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Academic Summary</CardTitle>
            <CardDescription>Your performance overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between border-b pb-3">
              <span className="text-gray-600">Current Class</span>
              <span className="font-semibold">-</span>
            </div>
            <div className="flex justify-between border-b pb-3">
              <span className="text-gray-600">Total Assessments</span>
              <span className="font-semibold">0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Average Grade</span>
              <span className="font-semibold">-</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
