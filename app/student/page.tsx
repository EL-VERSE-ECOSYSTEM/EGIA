import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { getStudentProfile } from '@/app/actions/user'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, FileText, BarChart3, MessageSquare } from 'lucide-react'

export default async function StudentDashboard() {
  const session = await auth.getSession()

  if (!session?.user) {
    redirect('/sign-in')
  }

  const student = await getStudentProfile()

  if (!student) {
    redirect('/setup-role/student')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-800/50 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Welcome back, {student.firstName}!</h1>
              <p className="mt-1 text-slate-400">Class: {student.class}</p>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700">Sign Out</Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Quick Stats */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="border-slate-700 bg-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-slate-300">
                <BookOpen size={20} className="text-blue-400" />
                Assessments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">5</div>
              <p className="text-sm text-slate-400">Active assessments</p>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-slate-300">
                <BarChart3 size={20} className="text-green-400" />
                Average Grade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">A-</div>
              <p className="text-sm text-slate-400">Based on recent assessments</p>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-slate-300">
                <FileText size={20} className="text-yellow-400" />
                Attendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">95%</div>
              <p className="text-sm text-slate-400">Class attendance rate</p>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-slate-300">
                <MessageSquare size={20} className="text-purple-400" />
                Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">2</div>
              <p className="text-sm text-slate-400">Unread messages</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <Card className="border-slate-700 bg-slate-800 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-white">Recent Assessments</CardTitle>
              <CardDescription className="text-slate-400">Your latest assessment results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'Mathematics Quiz', score: '85', date: '2 days ago' },
                  { name: 'English Test', score: '92', date: '1 week ago' },
                  { name: 'Science Assignment', score: '78', date: '2 weeks ago' },
                ].map((assessment, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-lg border border-slate-700 p-4">
                    <div>
                      <p className="font-medium text-white">{assessment.name}</p>
                      <p className="text-sm text-slate-400">{assessment.date}</p>
                    </div>
                    <div className="text-xl font-bold text-blue-400">{assessment.score}%</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start bg-slate-700 hover:bg-slate-600">
                View All Assessments
              </Button>
              <Button className="w-full justify-start bg-slate-700 hover:bg-slate-600">
                Check Attendance
              </Button>
              <Button className="w-full justify-start bg-slate-700 hover:bg-slate-600">
                Dispute a Grade
              </Button>
              <Button className="w-full justify-start bg-slate-700 hover:bg-slate-600">
                Message Teacher
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
