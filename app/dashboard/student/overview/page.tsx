import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, ClipboardList, FileText, CheckCircle } from 'lucide-react'

export default async function StudentOverviewPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  const stats = [
    { title: 'Upcoming Exams', value: '2', icon: ClipboardList, color: 'text-orange-500' },
    { title: 'My Results', value: '15', icon: FileText, color: 'text-blue-500' },
    { title: 'Assignments', value: '4', icon: BookOpen, color: 'text-purple-500' },
    { title: 'Attendance', value: '96%', icon: CheckCircle, color: 'text-green-500' },
  ]

  return (
    <DashboardLayout role="student">
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-8">Student Dashboard Overview</h1>

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
              <CardTitle>Next Class</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl">
                <p className="text-orange-900 font-bold text-lg">Computer Science</p>
                <p className="text-orange-700">10:30 AM - 11:30 AM</p>
                <p className="text-orange-600 text-sm mt-2">Location: ICT Lab 1</p>
              </div>
              <button className="w-full mt-4 px-4 py-2 border rounded-lg hover:bg-orange-50 transition-colors">View Timetable</button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <button className="w-full text-left px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">Take Assessment</button>
              <button className="w-full text-left px-4 py-2 border rounded-lg hover:bg-orange-50 transition-colors">Submit Assignment</button>
              <button className="w-full text-left px-4 py-2 border rounded-lg hover:bg-orange-50 transition-colors">Download Materials</button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
