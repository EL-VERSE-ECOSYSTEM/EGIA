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
               <Calendar className="w-3.5 h-3.5" /> 2024/2025 Academic Session
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Welcome back, Administrator.</h1>
            <p className="text-slate-400 text-lg font-medium max-w-xl">
               Here is what is happening at EL GOODNEWS ACADEMY today.
               You have 3 new alerts and 2 pending approvals.
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
              <CardTitle className="text-2xl font-black text-slate-900">Revenue Collection Trend</CardTitle>
              <p className="text-sm font-bold text-slate-400 mt-1">Comparison between current and previous term</p>
            </div>
            <Button variant="outline" className="rounded-xl font-bold border-slate-100">Details</Button>
          </CardHeader>
          <CardContent className="p-10 h-[450px]">
            <AdminRevenueChart />
          </CardContent>
        </Card>

        <div className="space-y-8">
          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] bg-white">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-lg font-black flex items-center gap-2">
                 <AlertTriangle className="text-amber-600 w-5 h-5" /> Urgent Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-4">
              {alerts.length > 0 ? alerts.map((alert, idx) => (
                <div key={idx} className="p-5 rounded-2xl border border-slate-50 bg-slate-50/50 group hover:border-amber-200 transition-colors">
                  <p className="font-black text-sm text-slate-900">{alert.title}</p>
                  <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">{alert.desc}</p>
                  <div className="mt-3 flex items-center gap-2">
                     <Badge className="bg-amber-100 text-amber-700 border-none text-[10px] font-black uppercase px-2">High Priority</Badge>
                     <span className="text-[10px] text-slate-400 font-bold">2h ago</span>
                  </div>
                </div>
              )) : (
                <div className="text-center py-10 text-slate-400 italic font-medium">No urgent alerts</div>
              )}
              <Button variant="ghost" className="w-full text-amber-600 font-black text-xs uppercase tracking-widest mt-2 hover:bg-amber-50">View All Alerts</Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl shadow-slate-900/10 rounded-[2.5rem] bg-slate-900 text-white">
             <CardHeader className="p-8 pb-4">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-amber-500">Quick Actions</CardTitle>
             </CardHeader>
             <CardContent className="p-8 pt-0 grid grid-cols-2 gap-3">
                <Button className="bg-white/10 hover:bg-white/20 border-none rounded-xl h-12 text-xs font-black flex items-center gap-2 text-white">
                   <Plus size={16} /> ENROLL
                </Button>
                <Button className="bg-white/10 hover:bg-white/20 border-none rounded-xl h-12 text-xs font-black flex items-center gap-2 text-white">
                   <FileText size={16} /> REPORT
                </Button>
                <Button className="bg-white/10 hover:bg-white/20 border-none rounded-xl h-12 text-xs font-black flex items-center gap-2 text-white">
                   <PieChart size={16} /> ANALYTICS
                </Button>
                <Button className="bg-white/10 hover:bg-white/20 border-none rounded-xl h-12 text-xs font-black flex items-center gap-2 text-white">
                   <Plus size={16} /> EXAM
                </Button>
             </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] bg-white overflow-hidden mb-12">
        <CardHeader className="p-10 pb-4 border-b border-slate-50 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-black">System Audit Log</CardTitle>
            <p className="text-sm font-bold text-slate-400 mt-1">Real-time monitoring of all administrative actions</p>
          </div>
          <Badge className="bg-slate-100 text-slate-900 font-black px-4 py-1">LIVE FEED</Badge>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-50">
            {auditLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-8 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-900">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-lg font-black text-slate-900 capitalize">{log.action.replace('_', ' ')}</p>
                    <p className="text-sm font-bold text-slate-400 mt-0.5">
                       Resource: <span className="text-slate-600">{log.resource}</span> ({log.resourceId})
                    </p>
                  </div>
                </div>
                <div className="text-right">
                   <p className="text-sm font-black text-slate-900">{new Date(log.createdAt).toLocaleTimeString()}</p>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{new Date(log.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
            {auditLogs.length === 0 && (
              <div className="text-center py-20 text-slate-400 italic font-medium">No recent activity found</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
