'use client'

import { useEffect, useState } from 'react'
import { getAdminDashboardStats } from '@/app/actions/admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Users, BookOpen, PieChart, Settings } from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalStudents: 0, totalTeachers: 0, totalParents: 0, totalUsers: 0 })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await getAdminDashboardStats()
        setStats(data)
      } catch (error) {
        console.error('Failed to load stats:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadStats()
  }, [])

  const statCards = [
    {
      title: 'Total Students',
      value: stats.totalStudents,
      description: 'Active students',
      icon: Users,
      color: 'bg-orange-100 text-orange-800',
      href: '/dashboard/admin/users/students',
    },
    {
      title: 'Total Teachers',
      value: stats.totalTeachers,
      description: 'Teaching staff',
      icon: BookOpen,
      color: 'bg-purple-100 text-purple-800',
      href: '/dashboard/admin/users/teachers',
    },
    {
      title: 'Total Parents',
      value: stats.totalParents,
      description: 'Parent accounts',
      icon: Users,
      color: 'bg-green-100 text-green-800',
      href: '/dashboard/admin/users/parents',
    },
    {
      title: 'All Users',
      value: stats.totalUsers,
      description: 'Total accounts',
      icon: Users,
      color: 'bg-amber-100 text-amber-800',
      href: '/dashboard/admin/users',
    },
  ]

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">School Management System Overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Link key={stat.href} href={stat.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{stat.title}</CardTitle>
                    <div className={`p-3 rounded-lg ${stat.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>
                  <CardDescription>{stat.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">
                    {isLoading ? '-' : stat.value}
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              href="/dashboard/admin/users/students/add"
              className="block p-3 bg-orange-50 hover:bg-orange-100 rounded-lg text-orange-800 font-medium transition-colors"
            >
              Add New Student
            </Link>
            <Link
              href="/dashboard/admin/users/teachers/add"
              className="block p-3 bg-purple-50 hover:bg-purple-100 rounded-lg text-purple-800 font-medium transition-colors"
            >
              Add New Teacher
            </Link>
            <Link
              href="/dashboard/admin/academics"
              className="block p-3 bg-green-50 hover:bg-green-100 rounded-lg text-green-800 font-medium transition-colors"
            >
              Manage Academics
            </Link>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>System Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between border-b pb-3">
              <span className="text-gray-600">School Name</span>
              <span className="font-semibold">EL GOODNEWS INT'L ACADEMY</span>
            </div>
            <div className="flex justify-between border-b pb-3">
              <span className="text-gray-600">Current Session</span>
              <span className="font-semibold">2024/2025</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Active Term</span>
              <span className="font-semibold">First Term</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
