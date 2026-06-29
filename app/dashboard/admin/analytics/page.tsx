export const dynamic = "force-dynamic"
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  TrendingUp,
  CreditCard,
  GraduationCap,
  Download,
  Calendar,
  PieChart,
  Users,
  Activity,
  ArrowRight
} from 'lucide-react'
import { getSchoolAnalytics, generatePerformanceReport, generateFinancialReport } from '@/app/actions/analytics'
import { AdminRevenueChart } from '@/components/charts/admin-revenue-chart'

export default async function AdminAnalyticsPage() {
  const schoolStats = await getSchoolAnalytics()
  const performanceReport = await generatePerformanceReport()
  const financialReport = await generateFinancialReport()

  const metrics = [
    { label: 'Total Revenue', value: \`₦\${schoolStats.totalRevenue.toLocaleString()}\`, icon: CreditCard, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Enrolled Students', value: schoolStats.totalStudents.toString(), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Staff Count', value: schoolStats.totalTeachers.toString(), icon: GraduationCap, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'CBT Activity', value: '88%', icon: Activity, color: 'text-amber-600', bg: 'bg-amber-50' }
  ]

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Institutional Analytics</h1>
          <p className="text-slate-500 font-medium mt-2">Comprehensive data analysis and institutional performance tracking.</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" className="h-12 px-6 rounded-2xl font-black text-slate-600 border-slate-200 gap-2">
            <Download size={18} /> EXPORT DATA
          </Button>
          <Button className="h-12 px-6 rounded-2xl font-black bg-slate-900 text-white gap-2">
            <Calendar size={18} /> SELECT PERIOD
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {metrics.map((m, idx) => (
          <Card key={idx} className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] bg-white group hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className={\`p-4 rounded-2xl \${m.bg} group-hover:scale-110 transition-transform\`}>
                  <m.icon className={\`w-6 h-6 \${m.color}\`} />
                </div>
                <TrendingUp size={16} className="text-emerald-600" />
              </div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{m.label}</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{m.value}</h3>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <Card className="lg:col-span-2 border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] bg-white overflow-hidden">
          <CardHeader className="p-10 pb-0 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-black">Revenue Performance</CardTitle>
              <p className="text-sm font-bold text-slate-400 mt-1">Fee collection trends over the current academic session</p>
            </div>
            <PieChart className="text-slate-200 w-10 h-10" />
          </CardHeader>
          <CardContent className="p-10 h-[450px]">
            <AdminRevenueChart />
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] bg-white overflow-hidden">
           <CardHeader className="p-10 pb-6 border-b border-slate-50">
              <CardTitle className="text-xl font-black">Financial Summary</CardTitle>
              <CardDescription className="font-bold text-slate-400">Current term status</CardDescription>
           </CardHeader>
           <CardContent className="p-10 space-y-8">
              <div className="space-y-2">
                 <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-400">
                    <span>Collection Progress</span>
                    <span>{financialReport.completionRate}%</span>
                 </div>
                 <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden shadow-inner">
                    <div
                      className="bg-emerald-500 h-full rounded-full shadow-lg shadow-emerald-200"
                      style={{ width: \`\${financialReport.completionRate}%\` }}
                    />
                 </div>
              </div>

              <div className="space-y-6 pt-4">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                          <CreditCard size={24} />
                       </div>
                       <div>
                          <p className="text-sm font-black text-slate-900">Total Collected</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Verified Payments</p>
                       </div>
                    </div>
                    <p className="text-lg font-black text-emerald-600">₦{financialReport.totalCollected.toLocaleString()}</p>
                 </div>

                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
                          <CreditCard size={24} />
                       </div>
                       <div>
                          <p className="text-sm font-black text-slate-900">Pending Amount</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Unverified / Unpaid</p>
                       </div>
                    </div>
                    <p className="text-lg font-black text-red-600">₦{financialReport.pendingAmount.toLocaleString()}</p>
                 </div>
              </div>

              <div className="pt-6">
                 <Button className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest gap-2">
                    GENERATE PDF REPORT <Download size={14} />
                 </Button>
              </div>
           </CardContent>
        </Card>
      </div>
    </div>
  )
}
