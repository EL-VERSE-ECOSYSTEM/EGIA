import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  CreditCard,
  MessageSquare,
  CheckCircle2,
  Calendar,
  AlertCircle,
  TrendingUp,
  FileText,
  ChevronRight
} from 'lucide-react'

import { getParentChildren, getParentProfile } from '@/lib/api/queries'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export default async function ParentOverviewPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  const parentProfile = await getParentProfile(session?.user.id || '')
  const dbChildren = await getParentChildren(parentProfile?.id || '')

  const children = dbChildren.map(c => ({
    id: c.id,
    name: c.firstName + ' ' + c.lastName,
    class: c.class || 'N/A',
    average: '84.2%', // Mock performance
    attendance: '98%', // Mock attendance
    status: 'In School'
  }))

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-emerald-900">Welcome back, {session?.user.name || 'Parent'}</h1>
          <p className="text-slate-600">Here's a summary of your children's performance and school activities.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
            <Link href="/dashboard/parent/payments/make-payment">Pay School Fees</Link>
          </Button>
          <Button variant="outline" className="border-emerald-200 text-emerald-700">
            <Calendar className="w-4 h-4 mr-2" /> Academic Calendar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-emerald-50 border-emerald-100">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-emerald-600 rounded-2xl">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-emerald-700 font-medium">Linked Children</p>
              <h3 className="text-2xl font-bold text-emerald-900">{children.length} Students</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-orange-50 border-orange-100">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-orange-600 rounded-2xl">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-orange-700 font-medium">Pending Fees</p>
              <h3 className="text-2xl font-bold text-orange-900">₦25,000.00</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-100">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-2xl">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-blue-700 font-medium">Unread Messages</p>
              <h3 className="text-2xl font-bold text-blue-900">4 New</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
        <Users className="w-5 h-5 text-emerald-600" /> My Children
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {children.map((child) => (
          <Card key={child.id} className="overflow-hidden hover:shadow-lg transition-shadow border-emerald-100">
            <CardHeader className="bg-emerald-50/50 border-b border-emerald-100 flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold">
                  {child.name.charAt(0)}
                </div>
                <div>
                  <CardTitle className="text-lg">{child.name}</CardTitle>
                  <CardDescription>{child.class}</CardDescription>
                </div>
              </div>
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">{child.status}</Badge>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Average Grade</p>
                  <p className="text-xl font-bold text-slate-900">{child.average}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Attendance</p>
                  <p className="text-xl font-bold text-slate-900">{child.attendance}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 border-emerald-200 text-emerald-700">
                  <FileText className="w-4 h-4 mr-2" /> Results
                </Button>
                <Button variant="outline" size="sm" className="flex-1 border-emerald-200 text-emerald-700">
                  <TrendingUp className="w-4 h-4 mr-2" /> Performance
                </Button>
                <Button size="icon" variant="ghost" className="text-emerald-600">
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Announcements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { title: 'Mid-Term Break', date: 'Oct 24, 2024', desc: 'School will be closed for mid-term break from Oct 28th to Nov 1st.' },
              { title: 'PTA Meeting', date: 'Oct 15, 2024', desc: 'General PTA meeting for all parents scheduled for this Saturday at 10 AM.' },
              { title: 'CBT Readiness', date: 'Oct 10, 2024', desc: 'All JSS 3 students are required to participate in the mock CBT test.' }
            ].map((news, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-100 hover:border-emerald-200 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-slate-900">{news.title}</h4>
                  <span className="text-xs text-slate-400 font-medium">{news.date}</span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{news.desc}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {[
              { event: 'Inter-House Sports', date: 'Nov 12', type: 'School Event' },
              { event: 'Math Olympiad', date: 'Nov 18', type: 'Academic' },
              { event: 'Science Fair', date: 'Dec 05', type: 'Project' }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex flex-col items-center justify-center text-emerald-700 shrink-0">
                  <span className="text-xs font-bold leading-none">{item.date.split(' ')[0]}</span>
                  <span className="text-lg font-extrabold leading-none">{item.date.split(' ')[1]}</span>
                </div>
                <div>
                  <p className="font-bold text-slate-900">{item.event}</p>
                  <p className="text-xs text-slate-500">{item.type}</p>
                </div>
              </div>
            ))}
            <Button variant="ghost" className="w-full text-emerald-600 font-bold">View Full Calendar</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

import Link from 'next/link'
