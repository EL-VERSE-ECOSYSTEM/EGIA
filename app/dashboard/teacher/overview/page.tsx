export const dynamic = "force-dynamic"
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  GraduationCap,
  BookOpen,
  Clock,
  ArrowUpRight,
  PlusCircle,
  FileText,
  Calendar,
  ChevronRight
} from 'lucide-react'
import { TeacherPerformanceChart } from '@/components/charts/teacher-performance-chart'

import { getTeacherDashboardData, getTeacherProfile } from '@/lib/api/queries'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import Link from 'next/link'

export default async function TeacherOverviewPage() {
  const session = await auth.getSession()
  const teacherProfile = await getTeacherProfile(session?.user.id || '')
  const data = await getTeacherDashboardData(teacherProfile?.id || '')

  const classes = data.classes.map(c => ({
    id: c.id,
    name: c.name,
    subject: c.subject,
    nextLesson: 'N/A', // Would come from timetable logic
    performance: 80 // Mock performance for now
  }))

  const chartData = classes.map(c => ({
    name: c.name,
    avg: c.performance
  }))

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-purple-900">Academic Overview</h1>
          <p className="text-slate-600">Managing Mr. Samuel Okoro's teaching schedule and assessments.</p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-purple-600 hover:bg-purple-700 font-bold">
            <PlusCircle className="w-4 h-4 mr-2" /> Create Assessment
          </Button>
          <Button variant="outline" className="border-purple-200 text-purple-700">
            <FileText className="w-4 h-4 mr-2" /> Lesson Notes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Students', value: data.totalStudents.toString(), icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
          { label: 'Total Classes', value: data.classes.length.toString(), icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-100' },
          { label: 'Active CBTs', value: data.upcomingAssessments.length.toString(), icon: Clock, color: 'text-orange-600', bg: 'bg-orange-100' },
          { label: 'Avg. Class Pass', value: '81.5%', icon: GraduationCap, color: 'text-emerald-600', bg: 'bg-emerald-100' }
        ].map((stat, idx) => (
          <Card key={idx} className="border-none shadow-sm">
            <CardContent className="p-6">
              <div className={`p-3 w-fit rounded-xl ${stat.bg} mb-4`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>My Classes</CardTitle>
              <CardDescription>Upcoming schedule and performance overview.</CardDescription>
            </div>
            <Button variant="ghost" className="text-purple-600">View Timetable</Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {classes.map((cls) => (
              <div key={cls.id} className="p-5 border rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-purple-200 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-50 rounded-xl text-purple-700 font-bold">
                    {cls.name}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{cls.subject}</h4>
                    <p className="text-sm text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Next Lesson: {cls.nextLesson}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Avg Performance</p>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-purple-600 h-full" style={{ width: `${cls.performance}%` }}></div>
                      </div>
                      <span className="text-sm font-bold">{cls.performance}%</span>
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" className="text-slate-400">
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Class Analytics</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <TeacherPerformanceChart data={chartData} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Upcoming Assessments</CardTitle>
            <Badge className="bg-purple-100 text-purple-800 border-purple-200">2 New</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.upcomingAssessments.length > 0 ? data.upcomingAssessments.map((exam, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <p className="font-bold text-slate-900">{exam.title}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span className="font-bold text-purple-600">{exam.subject}</span>
                    <span>{new Date(exam.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <Badge variant={exam.status === 'published' ? 'secondary' : 'outline'}>{exam.status}</Badge>
              </div>
            )) : (
              <p className="text-center text-slate-400 py-4 italic">No upcoming assessments</p>
            )}
            <Button variant="link" className="w-full text-purple-600 font-bold" asChild>
              <Link href="/dashboard/teacher/assessments">Manage All Assessments</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Student Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { name: 'Divine Goodnews', action: 'Submitted Math Quiz', time: '10 mins ago', grade: 'A' },
              { name: 'Emeka Obi', action: 'Viewed Study Materials', time: '45 mins ago', grade: null },
              { name: 'Sarah Ahmed', action: 'Raised a dispute', time: '1 hour ago', grade: null }
            ].map((act, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm py-2 border-b last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500">
                    {act.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{act.name}</p>
                    <p className="text-xs text-slate-500">{act.action}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">{act.time}</p>
                  {act.grade && <span className="text-xs font-extrabold text-emerald-600">Grade: {act.grade}</span>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
