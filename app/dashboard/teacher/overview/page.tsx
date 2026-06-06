import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, ClipboardList, CheckCircle, Clock } from 'lucide-react'

export default async function TeacherOverviewPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  const stats = [
    { title: 'My Classes', value: '4', icon: BookOpen, color: 'text-blue-500' },
    { title: 'Active Assessments', value: '3', icon: ClipboardList, color: 'text-purple-500' },
    { title: 'Pending Grading', value: '12', icon: CheckCircle, color: 'text-green-500' },
    { title: 'Upcoming Lessons', value: '2', icon: Clock, color: 'text-amber-500' },
  ]

  return (
    <DashboardLayout role="teacher">
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-8">Teacher Dashboard Overview</h1>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {stats.map((stat) => (
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
              <CardTitle>Today's Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-bold">Mathematics</p>
                    <p className="text-sm text-muted-foreground">JSS 1A • 09:00 AM - 10:00 AM</p>
                  </div>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded">Active</span>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-bold">Further Mathematics</p>
                    <p className="text-sm text-muted-foreground">SSS 2 Science • 11:00 AM - 12:30 PM</p>
                  </div>
                  <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded">Upcoming</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <button className="w-full text-left px-4 py-2 border rounded-lg hover:bg-purple-50 transition-colors">Create New Assessment</button>
              <button className="w-full text-left px-4 py-2 border rounded-lg hover:bg-purple-50 transition-colors">Mark Attendance</button>
              <button className="w-full text-left px-4 py-2 border rounded-lg hover:bg-purple-50 transition-colors">Upload Lesson Notes</button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
