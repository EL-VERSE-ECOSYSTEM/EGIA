export const dynamic = "force-dynamic"
import React from 'react'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  Play,
  Activity,
  Award,
  Laptop,
  MessageSquare,
  ShieldCheck
} from 'lucide-react'
import { getStudentDashboardData, getStudentProfile } from '@/lib/api/queries'
import { auth } from '@/lib/auth'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { PrintButton } from '@/components/ui/print-button'

export default async function StudentOverviewPage() {
  const session = await auth.getSession()
  if (!session?.user) {
    redirect('/auth/signin')
  }

  const studentProfile = await getStudentProfile(session.user.id)
  if (!studentProfile || session.user.role?.toUpperCase() !== 'STUDENT') {
    redirect('/dashboard-redirect')
  }

  const data = await getStudentDashboardData(studentProfile.id, studentProfile.class)

  const dynamicStats = data.stats || {
    completedCBTs: 0,
    classRank: 'N/A',
    studyMaterials: 0,
    assignments: 0,
    curriculumProgress: 65
  }

  const aiRecommendation = data.aiRecommendation || {
    subject: 'Mathematics',
    text: 'Review standard class study materials to boost your curriculum coverage.'
  }

  const stats = [
     { label: 'Completed CBTs', value: String(dynamicStats.completedCBTs), icon: Activity, color: 'text-orange-600', bg: 'bg-orange-50' },
     { label: 'Class Rank', value: dynamicStats.classRank, icon: Award, color: 'text-amber-600', bg: 'bg-amber-50' },
     { label: 'Study Materials', value: String(dynamicStats.studyMaterials), icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
     { label: 'Assignments', value: String(dynamicStats.assignments), icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50' }
  ]

  return (
    <DashboardLayout role="student">
    <div className="p-8 max-w-[1600px] mx-auto space-y-10">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-12 text-white shadow-2xl flex flex-col justify-between">
           <div className="absolute top-0 right-0 p-8 opacity-10">
              <Laptop size={300} strokeWidth={1} />
           </div>
           <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/10 text-orange-400 text-xs font-black uppercase tracking-widest mb-6">
                 <Award className="w-3.5 h-3.5" /> Student Portal
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Hello, {studentProfile?.firstName || 'Student'}.</h1>
              <p className="text-slate-400 text-lg font-medium max-w-xl">
                 You're doing great! You've completed {dynamicStats.curriculumProgress}% of this term's curriculum.
                 Check your upcoming assessments below.
              </p>
           </div>
           <div className="relative z-10 flex gap-4 mt-8">
              <Link href="/dashboard/student/assessments/upcoming">
                 <Button className="bg-orange-600 hover:bg-orange-700 text-white h-14 px-8 rounded-2xl font-black shadow-xl shadow-orange-600/20">
                    TAKE CBT EXAM
                 </Button>
              </Link>
           </div>
        </div>

        {/* Dynamic Digital Student ID Card */}
        <Card className="border-none shadow-2xl rounded-[2.5rem] bg-gradient-to-br from-orange-600 to-amber-600 text-white p-8 relative overflow-hidden group">
          <div className="absolute -bottom-10 -right-10 opacity-10 text-white">
            <GraduationCap size={200} />
          </div>
          <div className="relative z-10 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-white/20 p-2 rounded-lg">
                  <GraduationCap className="text-white w-5 h-5" />
                </div>
                <span className="font-black text-xs tracking-wider uppercase">EL LEARNERS APP</span>
              </div>
              <Badge className="bg-white/20 text-white font-black text-[9px] border-none uppercase tracking-widest px-2.5 py-1">PUPIL ID</Badge>
            </div>

            <div className="flex gap-6 items-center pt-2">
              <div className="w-24 h-24 rounded-full border-4 border-white/20 bg-white/10 flex items-center justify-center font-black text-white text-3xl uppercase tracking-wider overflow-hidden">
                {studentProfile?.profileImage ? (
                  <img src={studentProfile.profileImage} alt="Pupil Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{studentProfile?.firstName?.[0] || 'S'}</span>
                )}
              </div>
              <div className="space-y-1">
                <p className="font-black text-2xl tracking-tight leading-none truncate">{studentProfile?.firstName} {studentProfile?.lastName}</p>
                <p className="text-xs font-black text-orange-200 uppercase tracking-widest">{studentProfile?.class || 'PRIMARY 3'}</p>
                <p className="text-[10px] font-bold text-white/70 uppercase">Department: {studentProfile?.department || 'SCIENCE'}</p>
              </div>
            </div>

            <div className="h-[1px] bg-white/15" />

            <div className="grid grid-cols-2 gap-4 pt-1">
              <div>
                <p className="text-[9px] font-black uppercase text-white/50 tracking-wider">Admission No</p>
                <p className="font-black text-sm tracking-wider font-mono">{studentProfile?.admissionNumber || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase text-white/50 tracking-wider">Academic Session</p>
                <p className="font-black text-sm tracking-wider font-mono">2026/2027</p>
              </div>
            </div>

            <div className="text-center pt-2">
              <PrintButton label="PRINT DIGITAL ID CARD" className="bg-white text-orange-700 hover:bg-orange-50 font-black rounded-xl text-xs h-9 px-4" />
            </div>
          </div>
        </Card>
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
                       <Button className="rounded-[1.25rem] font-black bg-slate-900 hover:bg-slate-800 text-white h-12 px-6">START</Button>
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
                  <CardTitle className="text-lg font-black">Learning Progress</CardTitle>
               </CardHeader>
               <CardContent className="p-8 pt-0 space-y-8">
                  <div>
                    <div className="flex justify-between text-sm mb-3">
                      <span className="font-black text-slate-700">First Term Syllabus</span>
                      <span className="font-black text-orange-600 uppercase tracking-widest">{dynamicStats.curriculumProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden shadow-inner">
                      <div className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full shadow-lg shadow-orange-200" style={{ width: `${dynamicStats.curriculumProgress}%` }}></div>
                    </div>
                  </div>

                  <div className="p-6 rounded-[2rem] bg-blue-50 border border-blue-100 flex gap-4">
                    <AlertCircle className="w-6 h-6 text-blue-600 shrink-0" />
                    <div>
                      <p className="text-sm font-black text-blue-900">AI Study Recommendation</p>
                      <p className="text-xs text-blue-700 mt-1 font-medium leading-relaxed">
                        {aiRecommendation.text}
                      </p>
                      <Button variant="link" className="text-blue-600 p-0 h-auto text-xs font-black mt-3 uppercase tracking-widest">Start Revision</Button>
                    </div>
                  </div>
               </CardContent>
            </Card>

            <Card className="border-none shadow-xl shadow-slate-900/10 rounded-[2.5rem] bg-slate-900 text-white overflow-hidden">
               <div className="p-8 space-y-6 text-white">
                  <h3 className="font-black text-lg text-amber-500">Quick Links</h3>
                  <div className="grid grid-cols-2 gap-4">
                     <Button className="bg-white/10 hover:bg-white/20 border-none rounded-2xl h-14 font-black text-xs uppercase tracking-widest text-white">NOTES</Button>
                     <Button className="bg-white/10 hover:bg-white/20 border-none rounded-2xl h-14 font-black text-xs uppercase tracking-widest text-white">TIMETABLE</Button>
                     <Button className="bg-white/10 hover:bg-white/20 border-none rounded-2xl h-14 font-black text-xs uppercase tracking-widest text-white">GRADES</Button>
                     <Button className="bg-white/10 hover:bg-white/20 border-none rounded-2xl h-14 font-black text-xs uppercase tracking-widest text-white">SUPPORT</Button>
                  </div>
               </div>
            </Card>
         </div>
      </div>
    </div>
    </DashboardLayout>
  )
}
