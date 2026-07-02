import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { getParentProfile } from '@/app/actions/user'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { User, TrendingUp, AlertCircle, MessageSquare } from 'lucide-react'

export default async function ParentDashboard() {
  const session = await auth.getSession()

  if (!session?.user) {
    redirect('/sign-in')
  }

  const parent = await getParentProfile()

  if (!parent) {
    redirect('/setup-role/parent')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-900 to-orange-800">
      {/* Header */}
      <header className="border-b border-orange-700 bg-orange-800/50 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Welcome, {parent.firstName}!</h1>
              <p className="mt-1 text-orange-200">Monitor your child&apos;s progress</p>
            </div>
            <Button className="bg-orange-600 hover:bg-orange-700">Sign Out</Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Child Cards */}
        <div className="mb-8">
          <h2 className="mb-4 text-2xl font-bold text-white">Your Children</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-orange-700 bg-orange-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Chisom Doe</CardTitle>
                    <CardDescription className="text-orange-300">Class: SSS 2</CardDescription>
                  </div>
                  <User className="text-orange-400" size={32} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-orange-200">Average Grade:</span>
                    <span className="font-bold text-white">A-</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-orange-200">Attendance:</span>
                    <span className="font-bold text-white">94%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-orange-700 bg-orange-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-orange-200">
                <TrendingUp size={20} className="text-green-400" />
                Recent Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">Excellent</div>
              <p className="text-sm text-orange-300">Last assessment: 88%</p>
            </CardContent>
          </Card>

          <Card className="border-orange-700 bg-orange-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-orange-200">
                <AlertCircle size={20} className="text-yellow-400" />
                Outstanding Fees
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">₦45,000</div>
              <p className="text-sm text-orange-300">Due by end of term</p>
            </CardContent>
          </Card>

          <Card className="border-orange-700 bg-orange-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-orange-200">
                <MessageSquare size={20} className="text-purple-400" />
                Messages from School
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">1</div>
              <p className="text-sm text-orange-300">Unread messages</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <Card className="border-orange-700 bg-orange-800 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-white">Recent Assessments</CardTitle>
              <CardDescription className="text-orange-300">Your child&apos;s latest results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'Mathematics Exam', score: '85', status: 'Graded' },
                  { name: 'English Composition', score: '92', status: 'Graded' },
                  { name: 'Biology Project', score: 'Pending', status: 'Under Review' },
                ].map((assessment, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-lg border border-orange-700 p-4">
                    <div>
                      <p className="font-medium text-white">{assessment.name}</p>
                      <p className="text-sm text-orange-300">{assessment.status}</p>
                    </div>
                    <div className="text-xl font-bold text-orange-400">{assessment.score}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-700 bg-orange-800">
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start bg-orange-700 hover:bg-orange-600">
                View Full Reports
              </Button>
              <Button className="w-full justify-start bg-orange-700 hover:bg-orange-600">
                Check Attendance
              </Button>
              <Button className="w-full justify-start bg-orange-700 hover:bg-orange-600">
                Pay Fees
              </Button>
              <Button className="w-full justify-start bg-orange-700 hover:bg-orange-600">
                Contact Teacher
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
