'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { BarChart3, Users, BookOpen, TrendingUp } from 'lucide-react'

export default function ParentChildrenPage() {
  const children = [
    {
      id: '1',
      name: 'Chisom Amara',
      admissionNumber: 'GOD12345',
      class: 'JSS1A',
      avgGrade: 'B+',
      avgScore: 78,
      assessments: 6,
      attendance: 94,
      status: 'active',
      lastUpdated: '2 hours ago',
    },
    {
      id: '2',
      name: 'Adanna Amara',
      admissionNumber: 'GOD12346',
      class: 'JSS2B',
      avgGrade: 'A-',
      avgScore: 85,
      assessments: 8,
      attendance: 97,
      status: 'active',
      lastUpdated: '1 hour ago',
    },
  ]

  const navItems = [
    { label: 'Overview', href: '/parent', icon: '📊' },
    { label: 'My Children', href: '/parent/children', icon: '👨‍👩‍👧‍👦', active: true },
    { label: 'Results', href: '/parent/results', icon: '📈' },
    { label: 'Payments', href: '/parent/payments', icon: '💳' },
    { label: 'Messages', href: '/parent/messages', icon: '💬' },
    { label: 'Calendar', href: '/parent/calendar', icon: '📅' },
    { label: 'Profile', href: '/parent/profile', icon: '👤' },
  ]

  const getGradeColor = (grade: string) => {
    if (grade === 'A' || grade === 'A-') return 'bg-green-100 text-green-700'
    if (grade === 'B' || grade === 'B+') return 'bg-blue-100 text-blue-700'
    if (grade === 'C') return 'bg-orange-100 text-orange-700'
    return 'bg-slate-100 text-slate-700'
  }

  return (
    <DashboardLayout role="parent" userEmail="parent@email.com" navItems={navItems}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">My Children</h1>
            <p className="text-slate-600 mt-1">Manage linked children and track their progress</p>
          </div>
          <Button className="bg-green-600 hover:bg-green-700 text-white">
            Link New Child
          </Button>
        </div>

        {/* Children Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {children.map((child) => (
            <div
              key={child.id}
              className="bg-white dark:bg-slate-800 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow"
            >
              {/* Card Header */}
              <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">{child.name}</h2>
                    <p className="text-green-100 mt-1">Class {child.class}</p>
                    <p className="text-sm text-green-100 mt-1">Admission: {child.admissionNumber}</p>
                  </div>
                  <span className="text-sm bg-green-400 text-green-900 px-3 py-1 rounded-full font-semibold">
                    Active
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Avg Grade</p>
                    <p
                      className={`text-2xl font-bold px-3 py-1 rounded-full w-fit ${getGradeColor(child.avgGrade)}`}
                    >
                      {child.avgGrade}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Avg Score</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {child.avgScore}%
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Assessments</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {child.assessments}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Attendance</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {child.attendance}%
                    </p>
                  </div>
                </div>

                {/* Progress Indicators */}
                <div className="space-y-3 mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Academic Progress
                      </p>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {child.avgScore}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${child.avgScore}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Attendance
                      </p>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {child.attendance}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${child.attendance}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Last Updated */}
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  Last updated: {child.lastUpdated}
                </p>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="text-sm">
                    View Profile
                  </Button>
                  <Button variant="outline" className="text-sm">
                    View Results
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Family Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { icon: <Users className="w-5 h-5" />, label: 'Total Children', value: 2, color: 'bg-blue-100 text-blue-700' },
              { icon: <BookOpen className="w-5 h-5" />, label: 'Total Assessments', value: 14, color: 'bg-purple-100 text-purple-700' },
              { icon: <BarChart3 className="w-5 h-5" />, label: 'Avg Performance', value: '82%', color: 'bg-green-100 text-green-700' },
              { icon: <TrendingUp className="w-5 h-5" />, label: 'Trend', value: 'Improving', color: 'bg-amber-100 text-amber-700' },
            ].map((stat, i) => (
              <div key={i} className={`rounded-lg p-4 ${stat.color}`}>
                <div className="flex items-center gap-3 mb-2">
                  {stat.icon}
                  <p className="text-xs font-medium opacity-75">{stat.label}</p>
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
