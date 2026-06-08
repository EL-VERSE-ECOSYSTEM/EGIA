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
  Clock
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
    { label: 'Revenue (Term)', value: `₦${(parseFloat(statsData.revenue) / 1000000).toFixed(1)}M`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-100', trend: '-5%', up: false },
    { label: 'Active CBTs', value: statsData.activeCBTs.toString(), icon: GraduationCap, color: 'text-amber-600', bg: 'bg-amber-100', trend: 'Active', up: true }
  ]

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">School Administration Overview</h1>
          <p className="text-slate-500">Real-time metrics for EL GOODNEWS INT'L ACADEMY</p>
        </div>
        <div className="flex gap-3">
          <Badge className="bg-amber-100 text-amber-800 border-amber-200 py-1.5 px-3">
            <Calendar className="w-4 h-4 mr-2" /> 2024/2025 Session
          </Badge>
          <Button className="bg-amber-600 hover:bg-amber-700 font-bold">Generate Report</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, idx) => (
          <Card key={idx} className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className={`flex items-center text-sm font-bold ${stat.up ? 'text-emerald-600' : 'text-red-600'}`}>
                  {stat.trend}
                  {stat.up ? <ArrowUpRight className="w-4 h-4 ml-1" /> : <ArrowDownRight className="w-4 h-4 ml-1" />}
                </div>
              </div>
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</h3>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue Collection Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]">
            <AdminRevenueChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Urgent Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {alerts.length > 0 ? alerts.map((alert, idx) => (
              <div key={idx} className="p-4 rounded-xl border flex items-start gap-3 bg-slate-50/50">
                <AlertTriangle className={`w-5 h-5 shrink-0 ${alert.priority === 'high' ? 'text-red-600' : 'text-amber-600'}`} />
                <div>
                  <p className="font-bold text-sm text-slate-900">{alert.title}</p>
                  <p className="text-xs text-slate-500">{alert.desc}</p>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-slate-400 italic">No urgent alerts found</div>
            )}
            <Button variant="ghost" className="w-full text-amber-600 font-bold mt-2">View All Alerts</Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="justify-start text-xs h-10">Add Student</Button>
            <Button variant="outline" className="justify-start text-xs h-10">Manage Fees</Button>
            <Button variant="outline" className="justify-start text-xs h-10">System Logs</Button>
            <Button variant="outline" className="justify-start text-xs h-10">Broadcast</Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">System Audit Log</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {auditLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between text-sm py-2 border-b">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
                    <Clock className="w-4 h-4" />
                  </div>
                  <p><span className="font-bold">{log.action}:</span> {log.resource} ({log.resourceId})</p>
                </div>
                <span className="text-slate-400">{new Date(log.createdAt).toLocaleTimeString()}</span>
              </div>
            ))}
            {auditLogs.length === 0 && (
              <div className="text-center py-4 text-slate-400 italic text-xs">No recent activity</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
