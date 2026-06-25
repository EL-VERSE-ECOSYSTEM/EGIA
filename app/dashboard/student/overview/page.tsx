export const dynamic = "force-dynamic"
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  GraduationCap,
  BookOpen,
  Clock,
  Calendar,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  FileText,
  Play
} from 'lucide-react'

import { getStudentDashboardData, getStudentProfile } from '@/lib/api/queries'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export default async function StudentOverviewPage() {
  const session = await auth.getSession()
  const studentProfile = await getStudentProfile(session?.user.id || '')
  const data = await getStudentDashboardData(studentProfile?.id || '', studentProfile?.class || '')

  const nextClass = { subject: 'Mathematics', teacher: 'Mr. Samuel Okoro', time: '10:30 AM', room: 'Rm 3A' }
  const recentResults = [
    { subject: 'English', score: 82, grade: 'A', date: 'Oct 12' },
    { subject: 'Basic Science', score: 75, grade: 'B', date: 'Oct 10' }
  ]

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-orange-900">Hello, {session?.user.name?.split(' ')[0] || 'Student'}! 👋</h1>
          <p className="text-slate-600 font-medium">Ready for another productive day at EL GOODNEWS ACADEMY?</p>
        </div>
        <div className="flex gap-2">
          <Button asChild className="bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-200">
            <Link href="/dashboard/student/assessments/upcoming">Take Assessment</Link>
          </Button>
          <Button variant="outline" className="border-orange-200 text-orange-700">
            <Calendar className="w-4 h-4 mr-2" /> My Timetable
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <Card className="lg:col-span-2 border-none bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-20">
            <GraduationCap className="w-48 h-48" />
          </div>
          <CardContent className="p-8 relative z-10">
            <div className="flex flex-col md:flex-row justify-between gap-6">
              <div className="space-y-4">
                <Badge className="bg-white/20 text-white hover:bg-white/30 border-none px-3 py-1">Next Lesson</Badge>
                <div>
                  <h3 className="text-3xl font-bold">{nextClass.subject}</h3>
                  <p className="text-orange-100 flex items-center gap-2 mt-1">
                     {nextClass.teacher}
                  </p>
                </div>
                <div className="flex items-center gap-6 text-orange-50">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" /> {nextClass.time}
                  </div>
                  <div className="flex items-center gap-2">
                     {nextClass.room}
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <Button className="bg-white text-orange-600 hover:bg-orange-50 font-bold px-8 py-6 rounded-2xl group">
                  <Play className="w-5 h-5 mr-2 fill-current group-hover:scale-110 transition-transform" />
                  Join Live Class
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Recent Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentResults.map((res, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-orange-50/50 border border-orange-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center font-bold text-orange-600 shadow-sm">
                    {res.grade}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-900">{res.subject}</p>
                    <p className="text-xs text-slate-500">{res.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">{res.score}%</p>
                </div>
              </div>
            ))}
            <Button variant="ghost" className="w-full text-orange-600 font-bold text-sm">View All Results</Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="hover:border-orange-300 transition-colors">
          <CardContent className="p-4 flex flex-col items-center text-center gap-2">
            <div className="p-3 bg-orange-100 rounded-2xl mb-2">
              <BookOpen className="w-6 h-6 text-orange-600" />
            </div>
            <h4 className="font-bold text-slate-900">Study Materials</h4>
            <p className="text-xs text-slate-500 leading-relaxed">Access class notes, videos and resources.</p>
          </CardContent>
        </Card>
        <Card className="hover:border-orange-300 transition-colors">
          <CardContent className="p-4 flex flex-col items-center text-center gap-2">
            <div className="p-3 bg-orange-100 rounded-2xl mb-2">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <h4 className="font-bold text-slate-900">Track Progress</h4>
            <p className="text-xs text-slate-500 leading-relaxed">View detailed analytics of your grades.</p>
          </CardContent>
        </Card>
        <Card className="hover:border-orange-300 transition-colors">
          <CardContent className="p-4 flex flex-col items-center text-center gap-2">
            <div className="p-3 bg-orange-100 rounded-2xl mb-2">
              <MessageSquare className="w-6 h-6 text-orange-600" />
            </div>
            <h4 className="font-bold text-slate-900">Messages</h4>
            <p className="text-xs text-slate-500 leading-relaxed">Chat with your teachers for guidance.</p>
          </CardContent>
        </Card>
        <Card className="hover:border-orange-300 transition-colors">
          <CardContent className="p-4 flex flex-col items-center text-center gap-2">
            <div className="p-3 bg-orange-100 rounded-2xl mb-2">
              <ShieldCheck className="w-6 h-6 text-orange-600" />
            </div>
            <h4 className="font-bold text-slate-900">Support</h4>
            <p className="text-xs text-slate-500 leading-relaxed">Get help with any technical issues.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Upcoming Assessments</CardTitle>
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">{data.upcomingAssessments.length} Pending</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.upcomingAssessments.length > 0 ? data.upcomingAssessments.map((task, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 group hover:border-orange-200 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-orange-50">
                    <Laptop className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{task.title}</p>
                    <p className="text-xs text-slate-500">{task.subject}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="text-[10px] uppercase font-bold">CBT</Badge>
                  <p className="text-xs font-bold text-slate-400 mt-1">{new Date(task.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            )) : (
              <p className="text-center text-slate-400 py-4 italic text-sm">No upcoming assessments found.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Learning Path Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-slate-700">First Term Syllabus</span>
                <span className="font-bold text-orange-600">65%</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-orange-500 h-full w-[65%] rounded-full"></div>
              </div>
            </div>
            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-blue-900">AI Study Recommendation</p>
                <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                  Based on your recent English results, focusing on "Parts of Speech" could improve your score by 15%.
                </p>
                <Button variant="link" className="text-blue-600 p-0 h-auto text-xs font-bold mt-2">Start Revision</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

import { User, MapPin, Laptop, MessageSquare, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
