export const dynamic = "force-dynamic"
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  UserCheck,
  GraduationCap,
  TrendingUp,
  Calendar,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Plus,
  FileText,
  PieChart,
  Activity,
  BookOpen,
  BookMarked,
  ShieldCheck,
  CreditCard,
  MessageSquare,
  ArrowRight
} from 'lucide-react'
import { getAdminDashboardStats, getRecentAuditLogs, getUrgentAlerts } from '@/lib/api/queries'
import { AdminRevenueChart } from '@/components/charts/admin-revenue-chart'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/dashboard-layout'

import { getReportCards } from '@/app/actions/report-cards'

export default async function AdminOverviewPage() {
  const statsData = await getAdminDashboardStats()
  const auditLogs = await getRecentAuditLogs()
  const alerts = await getUrgentAlerts()
  const reportCards = await getReportCards()

  const pendingCardsCount = reportCards.filter(c => c.status === 'PENDING').length

  // Render real live audit logs/violations from the database!
  const liveAuditLogs = auditLogs.map((log) => {
    const details = log.details as Record<string, any> || {}
    return {
      id: log.id,
      user: log.userId || 'System',
      type: log.action || 'Database Operation',
      message: details.message || details.reason || `Operated on ${log.resource} (ID: ${log.resourceId || 'N/A'})`,
      time: new Date(log.createdAt).toLocaleDateString(undefined, { dateStyle: 'short', timeStyle: 'short' })
    }
  })

  const stats = [
    { label: 'Total Students', value: statsData.totalStudents.toLocaleString(), icon: Users, color: 'text-blue-600', bg: 'bg-blue-100', trend: '+12%', up: true },
    { label: 'Total Teachers', value: statsData.totalTeachers.toString(), icon: UserCheck, color: 'text-purple-600', bg: 'bg-purple-100', trend: '+2%', up: true },
    { label: 'Revenue (Term)', value: `₦${(parseFloat(statsData.revenue) / 1000000).toFixed(1)}M`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-100', trend: '+12%', up: true },
    { label: 'Active CBTs', value: statsData.activeCBTs.toString(), icon: GraduationCap, color: 'text-amber-600', bg: 'bg-amber-100', trend: 'Active', up: true }
  ]

  // Admin Quick Navigation Departments Configuration
  const departments = [
    {
      title: 'Student Registry & Enrollment',
      description: 'Register and enroll new pupils, allocate classes, manage student databases and subject catalogs.',
      link: '/dashboard/admin/users/students/list',
      icon: Users,
      badge: 'Student Registry',
      color: 'bg-blue-50 border-blue-100 text-blue-600',
      btnColor: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-100'
    },
    {
      title: 'Academics, Sessions & Terms',
      description: 'Configure active academic calendars, start new school sessions and manage terminal periods.',
      link: '/dashboard/admin/academics/sessions/active',
      icon: BookOpen,
      badge: 'Academic Timeline',
      color: 'bg-amber-50 border-amber-100 text-amber-600',
      btnColor: 'bg-amber-500 hover:bg-amber-600 text-amber-950 shadow-amber-100'
    },
    {
      title: 'Teacher Directory & Payroll',
      description: 'Manage institutional faculty, review performance logs, monitor teaching subjects, and process payroll.',
      link: '/dashboard/admin/users/teachers/list',
      icon: UserCheck,
      badge: 'Faculty Management',
      color: 'bg-purple-50 border-purple-100 text-purple-600',
      btnColor: 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-100'
    },
    {
      title: 'Institutional Finances',
      description: 'Track custom fees structures, approve installment plans, issue payment receipts, and review pending bills.',
      link: '/dashboard/admin/finance/fees/structure',
      icon: CreditCard,
      badge: 'Revenue Desk',
      color: 'bg-emerald-50 border-emerald-100 text-emerald-600',
      btnColor: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-100'
    },
    {
      title: 'Digital Library & Cataloging',
      description: 'Upload textbooks, manage electronic copy indexes, track borrowing statistics, and run book imports.',
      link: '/dashboard/admin/library/books',
      icon: BookMarked,
      badge: 'Library Control',
      color: 'bg-rose-50 border-rose-100 text-rose-600',
      btnColor: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-100'
    },
    {
      title: 'Messaging & Communications',
      description: 'Oversight over support tickets, messaging hubs, broadcasts and student disputes mediation panels.',
      link: '/dashboard/admin/communication',
      icon: MessageSquare,
      badge: 'Communications Hub',
      color: 'bg-indigo-50 border-indigo-100 text-indigo-600',
      btnColor: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100'
    }
  ]

  return (
    <DashboardLayout role="admin">
    <div className="p-8 max-w-[1600px] mx-auto space-y-10">
      <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-12 text-white shadow-2xl">
         <div className="absolute top-0 right-0 p-8 opacity-10">
            <Activity size={300} strokeWidth={1} />
         </div>
         <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/10 text-amber-500 text-xs font-black uppercase tracking-widest mb-6">
               <Calendar className="w-3.5 h-3.5" /> Live Administration Node
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-pretty">Welcome back, Administrator.</h1>
            <p className="text-slate-400 text-lg font-medium max-w-xl">
               Monitor institutional performance and manage academy operations in real-time.
            </p>
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
                <div className={`flex items-center gap-1 text-sm font-black ${stat.up ? 'text-emerald-600' : 'text-red-600'}`}>
                  {stat.trend}
                  {stat.up ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                </div>
              </div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</h3>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dynamic Institutional Quick Navigation System Row */}
      <div className="space-y-6">
        <div>
           <h2 className="text-2xl font-black text-slate-900 tracking-tight">Institutional Navigation Command Center</h2>
           <p className="text-slate-400 text-sm font-bold mt-1">Access critical administrative departments and management desks directly with active redirection.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {departments.map((dept, idx) => (
              <Card key={idx} className="border-none shadow-lg hover:shadow-2xl shadow-slate-200/50 rounded-3xl bg-white transition-all duration-300 group overflow-hidden flex flex-col justify-between">
                 <CardContent className="p-8 space-y-4 flex-1">
                    <div className="flex justify-between items-start">
                       <div className={`p-3.5 rounded-2xl ${dept.color.split(' ')[0]} border ${dept.color.split(' ')[1]}`}>
                          <dept.icon className="w-6 h-6" />
                       </div>
                       <Badge className={`border-none font-black text-[9px] px-2.5 py-1 tracking-wider uppercase ${dept.color}`}>
                          {dept.badge}
                       </Badge>
                    </div>
                    <div>
                       <h3 className="text-lg font-black text-slate-900 group-hover:text-amber-600 transition-colors">{dept.title}</h3>
                       <p className="text-xs font-bold text-slate-400 leading-relaxed mt-2">{dept.description}</p>
                    </div>
                 </CardContent>
                 <div className="px-8 pb-8">
                    <Link href={dept.link} className="block">
                       <Button className={`w-full font-black text-xs h-12 rounded-xl flex items-center justify-center gap-2 group-hover:translate-y-[-2px] transition-transform ${dept.btnColor}`}>
                          ACCESS DEPARTMENT <ArrowRight className="w-4 h-4" />
                       </Button>
                    </Link>
                 </div>
              </Card>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <Card className="lg:col-span-2 border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] bg-white overflow-hidden">
          <CardHeader className="p-10 pb-0 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-black text-slate-900">Institutional Revenue</CardTitle>
              <p className="text-sm font-bold text-slate-400 mt-1">Fee collection trends across all departments</p>
            </div>
            <Link href="/dashboard/admin/finance/fees">
               <Button variant="outline" className="rounded-xl font-bold border-slate-100">Details</Button>
            </Link>
          </CardHeader>
          <CardContent className="p-10 h-[450px]">
            <AdminRevenueChart />
          </CardContent>
        </Card>

        <div className="space-y-8">
          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] bg-white">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-lg font-black flex items-center gap-2 text-slate-900">
                 <AlertTriangle className="text-amber-600 w-5 h-5" /> Pending Endorsements
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-4">
              <div className="p-6 rounded-[2rem] bg-amber-50 border border-amber-100 space-y-4 text-center">
                 <p className="text-sm font-bold text-amber-900">There are {pendingCardsCount} report cards waiting for endorsement.</p>
                 <Link href="/dashboard/admin/academics/report-cards" className="block">
                    <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl h-12 shadow-lg shadow-amber-200">ENDORSE NOW</Button>
                 </Link>
              </div>
              <Button variant="ghost" className="w-full text-slate-400 font-black text-xs uppercase tracking-widest mt-2">View Audit Log</Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl shadow-slate-900/10 rounded-[2.5rem] bg-slate-900 text-white">
             <CardHeader className="p-8 pb-4">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-amber-500">Global Actions</CardTitle>
             </CardHeader>
             <CardContent className="p-8 pt-0 grid grid-cols-2 gap-3">
                <Link href="/dashboard/admin/users/students/list">
                   <Button className="w-full bg-white/10 hover:bg-white/20 border-none rounded-xl h-12 text-[10px] font-black flex items-center gap-2 text-white">
                      <Plus size={14} /> ENROLL
                   </Button>
                </Link>
                <Link href="/dashboard/admin/academics">
                   <Button className="w-full bg-white/10 hover:bg-white/20 border-none rounded-xl h-12 text-[10px] font-black flex items-center gap-2 text-white">
                      <Calendar size={14} /> SESSION
                   </Button>
                </Link>
                <Link href="/dashboard/admin/finance/fees/structure">
                   <Button className="w-full bg-white/10 hover:bg-white/20 border-none rounded-xl h-12 text-[10px] font-black flex items-center gap-2 text-white">
                      <FileText size={14} /> FINANCE
                   </Button>
                </Link>
                <Link href="/dashboard/admin/communication">
                   <Button className="w-full bg-white/10 hover:bg-white/20 border-none rounded-xl h-12 text-[10px] font-black flex items-center gap-2 text-white">
                      <Activity size={14} /> MESSAGING
                   </Button>
                </Link>
             </CardContent>
          </Card>
        </div>
      </div>

      {/* Real-time Content Censorship & Messaging Oversight Monitor */}
      <div className="grid grid-cols-1 gap-10">
        <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
          <CardHeader className="p-10 pb-6 border-b border-slate-50">
            <CardTitle className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <Clock className="text-red-500 animate-pulse" /> Real-time Audit & Censorship Monitor
            </CardTitle>
            <p className="text-sm font-bold text-slate-400 mt-1">Live audit stream of automatically logged events and blocked content matching moderation filters (WhatsApp, Foul Language, Vernacular)</p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {liveAuditLogs.length > 0 ? liveAuditLogs.map((v) => (
                <div key={v.id} className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                  <div className="space-y-1">
                    <p className="font-black text-slate-900">{v.user}</p>
                    <p className="text-sm text-slate-500 font-semibold italic bg-red-50/50 p-3 rounded-xl border border-red-100 inline-block">
                      "{v.message}"
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge className="bg-red-100 text-red-700 border-none font-black text-[10px] tracking-wider uppercase px-3 py-1">
                      {v.type}
                    </Badge>
                    <span className="text-xs font-bold text-slate-400">{v.time}</span>
                  </div>
                </div>
              )) : (
                <div className="p-12 text-center text-slate-400 font-medium">
                  No recent audit logs or censorship violations logged.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </DashboardLayout>
  )
}
