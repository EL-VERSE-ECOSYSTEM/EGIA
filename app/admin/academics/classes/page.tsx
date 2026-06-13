'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Plus, Edit, Trash2, Users, BookOpen } from 'lucide-react'

export default function AdminClassesPage() {
  const [classes, setClasses] = useState([
    { id: '1', name: 'JSS1A', classTeacher: 'Mrs. Folake Adeyemi', students: 45, subjects: 9, form: 'JSS1' },
    { id: '2', name: 'JSS1B', classTeacher: 'Mr. Ahmed Hassan', students: 42, subjects: 9, form: 'JSS1' },
    { id: '3', name: 'JSS2A', classTeacher: 'Prof. Jane Smith', students: 48, subjects: 10, form: 'JSS2' },
    { id: '4', name: 'JSS2B', classTeacher: 'Dr. Chinaza Obi', students: 40, subjects: 10, form: 'JSS2' },
    { id: '5', name: 'JSS3A', classTeacher: 'Mrs. Grace Adekunle', students: 43, subjects: 11, form: 'JSS3' },
    { id: '6', name: 'SSS1A', classTeacher: 'Prof. Jane Smith', students: 35, subjects: 12, form: 'SSS1' },
    { id: '7', name: 'SSS1B', classTeacher: 'Dr. Chinaza Obi', students: 38, subjects: 12, form: 'SSS1' },
    { id: '8', name: 'SSS2A', classTeacher: 'Mr. Ahmed Hassan', students: 40, subjects: 13, form: 'SSS2' },
  ])

  const navItems = [
    { label: 'Overview', href: '/admin', icon: '📊' },
    { label: 'Users', href: '/admin/users', icon: '👥' },
    { label: 'Academics', href: '/admin/academics', icon: '📚', active: true },
  ]

  return (
    <DashboardLayout role="admin" userEmail="admin@school.edu" navItems={navItems}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Classes Management</h1>
            <p className="text-slate-600 mt-1">Manage all classes and their class teachers</p>
          </div>
          <Button className="bg-amber-500 hover:bg-amber-600 text-white gap-2">
            <Plus className="w-4 h-4" />
            Add Class
          </Button>
        </div>

        {/* Class Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Classes', value: classes.length, color: 'bg-blue-100 text-blue-700' },
            { label: 'Total Students', value: classes.reduce((sum, c) => sum + c.students, 0), color: 'bg-green-100 text-green-700' },
            { label: 'Avg Class Size', value: Math.round(classes.reduce((sum, c) => sum + c.students, 0) / classes.length), color: 'bg-purple-100 text-purple-700' },
            { label: 'Avg Subjects', value: Math.round(classes.reduce((sum, c) => sum + c.subjects, 0) / classes.length), color: 'bg-amber-100 text-amber-700' },
          ].map((stat, i) => (
            <div key={i} className={`rounded-lg p-4 ${stat.color}`}>
              <p className="text-sm font-medium opacity-75">{stat.label}</p>
              <p className="text-2xl font-bold mt-2">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Classes Table */}
        <div className="bg-white dark:bg-slate-800 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Class
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Form
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Class Teacher
                </th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Students
                </th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Subjects
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {classes.map((cls) => (
                <tr key={cls.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                    {cls.name}
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                    {cls.form}
                  </td>
                  <td className="px-6 py-4 text-slate-900 dark:text-white">
                    {cls.classTeacher}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1 text-slate-900 dark:text-white font-medium">
                      <Users className="w-4 h-4" />
                      {cls.students}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1 text-slate-900 dark:text-white font-medium">
                      <BookOpen className="w-4 h-4" />
                      {cls.subjects}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                        <Edit className="w-4 h-4 text-blue-600" />
                      </button>
                      <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  )
}
