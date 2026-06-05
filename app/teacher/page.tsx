import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { getTeacherProfile } from '@/app/actions/user'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, BookOpen, CheckCircle, BarChart3 } from 'lucide-react'

export default async function TeacherDashboard() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    redirect('/sign-in')
  }

  const teacher = await getTeacherProfile()

  if (!teacher) {
    redirect('/setup-role/teacher')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 to-green-800">
      {/* Header */}
      <header className="border-b border-green-700 bg-green-800/50 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Welcome, Prof. {teacher.firstName}!</h1>
              <p className="mt-1 text-green-200">{teacher.specialization || 'Teacher'}</p>
            </div>
            <Button className="bg-green-600 hover:bg-green-700">Sign Out</Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Quick Stats */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="border-green-700 bg-green-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-green-200">
                <Users size={20} className="text-green-400" />
                Total Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">48</div>
              <p className="text-sm text-green-300">Across all classes</p>
            </CardContent>
          </Card>

          <Card className="border-green-700 bg-green-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-green-200">
                <BookOpen size={20} className="text-yellow-400" />
                Assessments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">12</div>
              <p className="text-sm text-green-300">This term</p>
            </CardContent>
          </Card>

          <Card className="border-green-700 bg-green-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-green-200">
                <CheckCircle size={20} className="text-blue-400" />
                Pending Grading
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">23</div>
              <p className="text-sm text-green-300">Submissions to review</p>
            </CardContent>
          </Card>

          <Card className="border-green-700 bg-green-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-green-200">
                <BarChart3 size={20} className="text-purple-400" />
                Avg Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">78%</div>
              <p className="text-sm text-green-300">Class average</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Actions */}
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <Card className="border-green-700 bg-green-800 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-white">Today&apos;s Tasks</CardTitle>
              <CardDescription className="text-green-300">Priority actions for today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { task: 'Grade 5 submissions for Mathematics Test', time: 'Due today' },
                  { task: 'Create Quiz for English Literature', time: 'Due tomorrow' },
                  { task: 'Review attendance records for JSS2', time: 'Due this week' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-lg border border-green-700 p-4">
                    <div>
                      <p className="font-medium text-white">{item.task}</p>
                      <p className="text-sm text-green-300">{item.time}</p>
                    </div>
                    <input type="checkbox" className="h-5 w-5 rounded border-green-600 bg-green-700" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-700 bg-green-800">
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start bg-green-700 hover:bg-green-600">
                Create Assessment
              </Button>
              <Button className="w-full justify-start bg-green-700 hover:bg-green-600">
                Grade Submissions
              </Button>
              <Button className="w-full justify-start bg-green-700 hover:bg-green-600">
                View Class Attendance
              </Button>
              <Button className="w-full justify-start bg-green-700 hover:bg-green-600">
                Message Students
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
