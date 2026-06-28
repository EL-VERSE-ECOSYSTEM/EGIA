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
  Activity
} from 'lucide-react'
import { getAdminDashboardStats, getRecentAuditLogs, getUrgentAlerts } from '@/lib/api/queries'
import { AdminRevenueChart } from '@/components/charts/admin-revenue-chart'
import Link from 'next/link'

export default async function AdminOverviewPage() {
  const statsData = await getAdminDashboardStats()
  const auditLogs = await getRecentAuditLogs()
  const alerts = await getUrgentAlerts()

  const stats = [
    { label: 'Total Students', value: statsData.totalStudents.toLocaleString(), icon: Users, color: 'text-blue-600', bg: 'bg-blue-100', trend: '+12%', up: true },
    { label: 'Total Teachers', value: statsData.totalTeachers.toString(), icon: UserCheck, color: 'text-purple-600', bg: 'bg-purple-100', trend: '+2%', up: true },
    { label: 'Revenue (Term)', value: `₦${(parseFloat(statsData.revenue) / 1000000).toFixed(1)}M`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-100', trend: '+12%', up: true },
    { label: 'Active CBTs', value: statsData.activeCBTs.toString(), icon: GraduationCap, color: 'text-amber-600', bg: 'bg-amber-100', trend: 'Active', up: true }
  ]

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-10">
      <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-12 text-white shadow-2xl">
         <div className="absolute top-0 right-0 p-8 opacity-10">
            <Activity size={300} strokeWidth={1} />
         </div>
         <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/10 text-amber-500 text-xs font-black uppercase tracking-widest mb-6">
               <Calendar className="w-3.5 h-3.5" /> 2026/2027 Academic Session
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <Card className="lg:col-span-2 border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] bg-white overflow-hidden">
          <CardHeader className="p-10 pb-0 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-black text-slate-900">Institutional Revenue</CardTitle>
              <p className="text-sm font-bold text-slate-400 mt-1">Fee collection trends across all departments</p>
            </div>
            <Link href="/dashboard/admin/finance/fees/structure">
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
                 <AlertTriangle className="text-amber-600 w-5 h-5" /> Pending Verifications
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-4">
              <div className="p-6 rounded-[2rem] bg-amber-50 border border-amber-100 space-y-4 text-center">
                 <p className="text-sm font-bold text-amber-900">There are 8 manual payments waiting for receipt verification.</p>
                 <Link href="/dashboard/admin/finance/fees/pending" className="block">
                    <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl h-12 shadow-lg shadow-amber-200">VERIFY NOW</Button>
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
                <Link href="/dashboard/admin/users/students/add">
                   <Button className="w-full bg-white/10 hover:bg-white/20 border-none rounded-xl h-12 text-[10px] font-black flex items-center gap-2 text-white">
                      <Plus size={14} /> ENROLL
                   </Button>
                </Link>
                <Link href="/dashboard/admin/academics/sessions/active">
                   <Button className="w-full bg-white/10 hover:bg-white/20 border-none rounded-xl h-12 text-[10px] font-black flex items-center gap-2 text-white">
                      <Calendar size={14} /> SESSION
                   </Button>
                </Link>
                <Link href="/dashboard/admin/finance/fees/structure">
                   <Button className="w-full bg-white/10 hover:bg-white/20 border-none rounded-xl h-12 text-[10px] font-black flex items-center gap-2 text-white">
                      <FileText size={14} /> FINANCE
                   </Button>
                </Link>
                <Link href="/dashboard/admin/communication/messages/broadcast">
                   <Button className="w-full bg-white/10 hover:bg-white/20 border-none rounded-xl h-12 text-[10px] font-black flex items-center gap-2 text-white">
                      <Activity size={14} /> BROADCAST
                   </Button>
                </Link>
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
