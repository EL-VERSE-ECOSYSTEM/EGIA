export const dynamic = "force-dynamic"
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  GraduationCap,
  Calendar,
  Clock,
  BookOpen,
  ArrowRight,
  Plus,
  FileText,
  Activity,
  CheckCircle2
} from 'lucide-react'
import { getTeacherDashboardData, getTeacherProfile } from '@/lib/api/queries'
import { auth } from '@/lib/auth'
import Link from 'next/link'
import { SubjectConfig } from '@/components/teacher/subject-config'

export default async function TeacherOverviewPage() {
  const session = await auth.getSession()
  const teacherProfile = await getTeacherProfile(session?.user.id || '')
  const data = await getTeacherDashboardData(teacherProfile?.id || '')

  const stats = [
    { label: 'Assigned Classes', value: data.classes.length.toString(), icon: GraduationCap, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Total Students', value: data.totalStudents.toLocaleString(), icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Published CBTs', value: data.upcomingAssessments.length.toString(), icon: Activity, color: 'text-amber-600', bg: 'bg-amber-100' },
    { label: 'Lesson Notes', value: '12', icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-100' }
  ]

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-10">
      <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-12 text-white shadow-2xl">
         <div className="absolute top-0 right-0 p-8 opacity-10">
            <GraduationCap size={300} strokeWidth={1} />
         </div>
         <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div>
               <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/10 text-purple-400 text-xs font-black uppercase tracking-widest mb-6">
                  <Clock className="w-3.5 h-3.5" /> {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
               </div>
               <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-pretty">Hello, {teacherProfile?.firstName || 'Educator'}.</h1>
               <p className="text-slate-400 text-lg font-medium max-w-xl">
                  Ready to inspire excellence today? You have {data.classes.length} classes and {data.upcomingAssessments.length} active CBTs.
               </p>
            </div>
            <div className="flex gap-4">
               <Link href="/dashboard/teacher/assessments/create">
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white h-14 px-8 rounded-2xl font-black shadow-xl shadow-purple-600/20">
                     <Plus className="mr-2" /> CREATE ASSESSMENT
                  </Button>
               </Link>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat, idx) => (
          <Card key={idx} className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] bg-white hover:shadow-2xl transition-all duration-300 group">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className={`p-4 rounded-2xl ${stat.bg} group-hover:scale-110 transition-transform`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</h3>
            </CardContent>
          </Card>
        ))}
      </div>

      <SubjectConfig initialSubjects={(teacherProfile?.teachingSubjects as string[]) || []} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
         <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] bg-white">
            <CardHeader className="p-10 pb-4 border-b border-slate-50 flex flex-row items-center justify-between text-slate-900">
               <div>
                  <CardTitle className="text-2xl font-black">Today's Schedule</CardTitle>
                  <p className="text-sm font-bold text-slate-400 mt-1">Your academic schedule for today</p>
               </div>
               <Calendar className="text-slate-200 w-8 h-8" />
            </CardHeader>
            <CardContent className="p-0">
               <div className="divide-y divide-slate-50">
                  {data.classes.length > 0 ? data.classes.map((cls, idx) => (
                    <div key={idx} className="p-8 flex items-center justify-between group hover:bg-slate-50/50 transition-colors">
                       <div className="flex items-center gap-6">
                          <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-black text-xl shadow-lg">
                             {cls.name.substring(0, 3)}
                          </div>
                          <div>
                             <p className="text-lg font-black text-slate-900">{cls.name}</p>
                             <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Morning Session • Room 3A</p>
                          </div>
                       </div>
                       <Link href={`/dashboard/teacher/my-classes/${cls.id}/attendance`}>
                          <Button variant="ghost" className="rounded-xl font-black text-purple-600 hover:text-purple-700 hover:bg-purple-50 px-6">
                             MARK <ArrowRight className="ml-2 w-4 h-4" />
                          </Button>
                       </Link>
                    </div>
                  )) : (
                    <div className="p-20 text-center text-slate-400 italic font-medium">No classes scheduled for today</div>
                  )}
               </div>
            </CardContent>
         </Card>

         <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] bg-white">
            <CardHeader className="p-10 pb-4 border-b border-slate-50 flex flex-row items-center justify-between text-slate-900">
               <div>
                  <CardTitle className="text-2xl font-black">Active Assessments</CardTitle>
                  <p className="text-sm font-bold text-slate-400 mt-1">Monitor live CBT sessions and results</p>
               </div>
               <Activity className="text-slate-200 w-8 h-8" />
            </CardHeader>
            <CardContent className="p-0">
               <div className="divide-y divide-slate-50">
                  {data.upcomingAssessments.length > 0 ? data.upcomingAssessments.map((asmt, idx) => (
                    <div key={idx} className="p-8 flex items-center justify-between group hover:bg-slate-50/50 transition-colors">
                       <div className="flex items-center gap-6">
                          <div className={`w-14 h-14 rounded-2xl ${asmt.status === 'published' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'} flex items-center justify-center shadow-sm`}>
                             <Activity size={24} />
                          </div>
                          <div>
                             <p className="text-lg font-black text-slate-900">{asmt.title}</p>
                             <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{asmt.duration} MIN • {asmt.status}</p>
                          </div>
                       </div>
                       <Link href={`/dashboard/teacher/assessments/${asmt.id}/results`}>
                          <Badge className="bg-slate-100 text-slate-900 font-black px-4 py-2 uppercase text-[10px] cursor-pointer hover:bg-slate-200 transition-colors">RESULTS</Badge>
                       </Link>
                    </div>
                  )) : (
                    <div className="p-20 text-center text-slate-400 italic font-medium">No active assessments found</div>
                  )}
               </div>
               <div className="p-8 border-t border-slate-50">
                  <Link href="/dashboard/teacher/assessments/published">
                     <Button variant="outline" className="w-full h-14 rounded-2xl font-black border-slate-100 text-slate-600 hover:bg-slate-50 uppercase tracking-widest text-xs">
                        VIEW ASSESSMENT ARCHIVE
                     </Button>
                  </Link>
               </div>
            </CardContent>
         </Card>
      </div>
    </div>
  )
}
