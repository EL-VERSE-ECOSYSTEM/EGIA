import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getAdminDashboardStats } from '@/app/actions/admin'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, BookOpen, UserCheck, Shield } from 'lucide-react'

export default async function AdminOverviewPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  const stats = await getAdminDashboardStats()

  const statCards = [
    { title: 'Total Students', value: stats.totalStudents, icon: BookOpen, color: 'text-orange-500' },
    { title: 'Total Teachers', value: stats.totalTeachers, icon: Users, color: 'text-purple-500' },
    { title: 'Total Parents', value: stats.totalParents, icon: UserCheck, color: 'text-green-500' },
    { title: 'Total Users', value: stats.totalUsers, icon: Shield, color: 'text-amber-500' },
  ]

  return (
    <DashboardLayout role="admin">
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard Overview</h1>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {statCards.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <button className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors">Add Student</button>
              <button className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors">Add Teacher</button>
              <button className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors">Create Session</button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">All systems operational.</p>
              <div className="mt-4 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 w-[99.9%]" />
              </div>
              <p className="text-xs mt-2 text-right">99.9% Uptime</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
