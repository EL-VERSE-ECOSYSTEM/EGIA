'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Users, TrendingUp, DollarSign, MessageSquare } from 'lucide-react'

export default function ParentDashboard() {
  const quickActions = [
    {
      title: 'My Children',
      description: 'View linked children',
      icon: Users,
      href: '/dashboard/parent/children',
      color: 'bg-green-100 text-green-800',
    },
    {
      title: 'Results',
      description: 'View academic results',
      icon: TrendingUp,
      href: '/dashboard/parent/results',
      color: 'bg-green-100 text-green-800',
    },
    {
      title: 'Payments',
      description: 'Pay school fees',
      icon: DollarSign,
      href: '/dashboard/parent/payments',
      color: 'bg-green-100 text-green-800',
    },
    {
      title: 'Messages',
      description: 'Contact teachers',
      icon: MessageSquare,
      href: '/dashboard/parent/messages',
      color: 'bg-green-100 text-green-800',
    },
  ]

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Parent Portal</h1>
        <p className="text-gray-600 mt-2">Monitor your child's academic progress and manage school payments</p>
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
            <CardTitle>Recent Results</CardTitle>
            <CardDescription>Your child's latest results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-gray-500 text-sm">Link a child to view their results.</p>
              <Link
                href="/dashboard/parent/children"
                className="inline-block px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Link Child
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Outstanding Payments</CardTitle>
            <CardDescription>Fees awaiting payment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between border-b pb-3">
              <span className="text-gray-600">Tuition</span>
              <span className="font-semibold text-red-600">₦0</span>
            </div>
            <div className="flex justify-between border-b pb-3">
              <span className="text-gray-600">Development Levy</span>
              <span className="font-semibold text-red-600">₦0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Due</span>
              <span className="font-bold text-red-600">₦0</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
