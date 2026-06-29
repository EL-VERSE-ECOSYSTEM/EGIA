export const dynamic = "force-dynamic"
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  BookOpen,
  AlertCircle,
  FileText,
  Activity,
  Award,
  Laptop,
} from 'lucide-react'
import { getStudentDashboardData, getStudentProfile } from '@/lib/api/queries'
import { auth } from '@/lib/auth'
import Link from 'next/link'

export default async function StudentOverviewPage() {
  const session = await auth.getSession()
  const studentProfile = await getStudentProfile(session?.user.id || '')
  const data = await getStudentDashboardData(studentProfile?.id || '', studentProfile?.class || '')

  const stats = [
     { label: 'Completed CBTs', value: data.completedCBTsCount.toString(), icon: Activity, color: 'text-orange-600', bg: 'bg-orange-50' },
     { label: 'Class Rank', value: '-', icon: Award, color: 'text-amber-600', bg: 'bg-amber-50' },
     { label: 'Study Materials', value: data.materialCount.toString(), icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
     { label: 'Assignments', value: '0', icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50' }
  ]

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-10">
      <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-12 text-white shadow-2xl">
         <div className="absolute top-0 right-0 p-8 opacity-10">
            <Laptop size={300} strokeWidth={1} />
         </div>
         <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div>
               <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/10 text-orange-400 text-xs font-black uppercase tracking-widest mb-6">
                  <Award className="w-3.5 h-3.5" /> Student Portal
               </div>
               <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Hello, {studentProfile?.firstName || 'Student'}.</h1>
               <p className="text-slate-400 text-lg font-medium max-w-xl">
                  Ready to excel? Track your performance and stay on top of your academic goals.
               </p>
            </div>
            <div className="flex gap-4">
               <Link href="/dashboard/student/assessments/upcoming">
                  <Button className="bg-orange-600 hover:bg-orange-700 text-white h-14 px-8 rounded-2xl font-black shadow-xl shadow-orange-600/20">
                     TAKE CBT EXAM
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
         <Card className="lg:col-span-2 border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] bg-white overflow-hidden">
            <CardHeader className="p-10 pb-4 border-b border-slate-50 flex flex-row items-center justify-between">
               <div>
                  <CardTitle className="text-2xl font-black">Upcoming Assessments</CardTitle>
                  <p className="text-sm font-bold text-slate-400 mt-1">Pending tests and end of term exams</p>
               </div>
               <Badge className="bg-orange-100 text-orange-700 border-none px-4 font-black">{data.upcomingAssessments.length} PENDING</Badge>
            </CardHeader>
            <CardContent className="p-0">
               <div className="divide-y divide-slate-50">
                  {data.upcomingAssessments.length > 0 ? data.upcomingAssessments.map((task, idx) => (
                    <div key={idx} className="p-10 flex items-center justify-between group hover:bg-slate-50/50 transition-colors">
                       <div className="flex items-center gap-8">
                          <div className="w-16 h-16 rounded-3xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
                             <Laptop size={32} />
                          </div>
                          <div>
                             <p className="text-xl font-black text-slate-900">{task.title}</p>
                             <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">{task.subject} • {new Date(task.createdAt).toLocaleDateString()}</p>
                          </div>
                       </div>
                       <Link href={`/dashboard/student/assessments/cbt/${task.id}/take`}>
                          <Button className="rounded-[1.25rem] font-black bg-slate-900 hover:bg-slate-800 text-white h-12 px-6">START</Button>
                       </Link>
                    </div>
                  )) : (
                    <div className="p-24 text-center text-slate-400 italic font-medium">No assessments currently available</div>
                  )}
               </div>
            </CardContent>
         </Card>

         <div className="space-y-8">
            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] bg-white">
               <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-lg font-black">Study Guide</CardTitle>
               </CardHeader>
               <CardContent className="p-8 pt-0 space-y-8">
                  <div className="p-6 rounded-[2rem] bg-blue-50 border border-blue-100 flex gap-4">
                    <AlertCircle className="w-6 h-6 text-blue-600 shrink-0" />
                    <div>
                      <p className="text-sm font-black text-blue-900">Recommendation</p>
                      <p className="text-xs text-blue-700 mt-1 font-medium leading-relaxed">
                        Keep track of your upcoming assessments and review your past CBT attempts to identify areas of improvement.
                      </p>
                    </div>
                  </div>
               </CardContent>
            </Card>

            <Card className="border-none shadow-xl shadow-slate-900/10 rounded-[2.5rem] bg-slate-900 text-white overflow-hidden">
               <div className="p-8 space-y-6 text-white">
                  <h3 className="font-black text-lg text-amber-500">Quick Links</h3>
                  <div className="grid grid-cols-2 gap-4">
                     <Link href="/dashboard/student/materials/notes" className="w-full"><Button className="w-full bg-white/10 hover:bg-white/20 border-none rounded-2xl h-14 font-black text-xs uppercase tracking-widest text-white">NOTES</Button></Link>
                     <Link href="/dashboard/student/timetable" className="w-full"><Button className="w-full bg-white/10 hover:bg-white/20 border-none rounded-2xl h-14 font-black text-xs uppercase tracking-widest text-white">TIMETABLE</Button></Link>
                     <Link href="/dashboard/student/results/current" className="w-full"><Button className="w-full bg-white/10 hover:bg-white/20 border-none rounded-2xl h-14 font-black text-xs uppercase tracking-widest text-white">GRADES</Button></Link>
                     <Link href="/dashboard/student/communication/support/new" className="w-full"><Button className="w-full bg-white/10 hover:bg-white/20 border-none rounded-2xl h-14 font-black text-xs uppercase tracking-widest text-white">SUPPORT</Button></Link>
                  </div>
               </div>
            </Card>
         </div>
      </div>
    </div>
  )
}
