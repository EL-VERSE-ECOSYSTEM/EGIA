import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { getUserRole } from '@/app/actions/user'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, School, BarChart3, Settings, TrendingUp, AlertTriangle } from 'lucide-react'

export default async function AdminDashboard() {
  const session = await auth.getSession()

  if (!session?.user) {
    redirect('/sign-in')
  }

  const role = await getUserRole()
  if (role !== 'admin') {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-purple-800">
      {/* Header */}
      <header className="border-b border-purple-700 bg-purple-800/50 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">School Administration</h1>
              <p className="mt-1 text-purple-200">Manage all school operations</p>
            </div>
            <Button className="bg-purple-600 hover:bg-purple-700">Sign Out</Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Key Metrics */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="border-purple-700 bg-purple-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-purple-200">
                <Users size={20} className="text-blue-400" />
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">487</div>
              <p className="text-sm text-purple-300">Students, teachers, parents</p>
            </CardContent>
          </Card>

          <Card className="border-purple-700 bg-purple-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-purple-200">
                <School size={20} className="text-green-400" />
                Classes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">12</div>
              <p className="text-sm text-purple-300">All academic classes</p>
            </CardContent>
          </Card>

          <Card className="border-purple-700 bg-purple-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-purple-200">
                <TrendingUp size={20} className="text-yellow-400" />
                Revenue (Month)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">₦2.4M</div>
              <p className="text-sm text-purple-300">From fee payments</p>
            </CardContent>
          </Card>

          <Card className="border-purple-700 bg-purple-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-purple-200">
                <AlertTriangle size={20} className="text-red-400" />
                Pending Issues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">8</div>
              <p className="text-sm text-purple-300">Active disputes/issues</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Controls */}
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <Card className="border-purple-700 bg-purple-800 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-white">System Overview</CardTitle>
              <CardDescription className="text-purple-300">Key administration tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  { name: 'Total Students', value: '387' },
                  { name: 'Total Teachers', value: '35' },
                  { name: 'Active Classes', value: '12' },
                  { name: 'Pending Payments', value: '₦850K' },
                  { name: 'Outstanding Fees', value: '₦2.1M' },
                  { name: 'System Uptime', value: '99.8%' },
                ].map((metric, idx) => (
                  <div key={idx} className="rounded-lg border border-purple-700 p-4">
                    <p className="text-sm text-purple-300">{metric.name}</p>
                    <p className="text-xl font-bold text-white">{metric.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-700 bg-purple-800">
            <CardHeader>
              <CardTitle className="text-white">Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start bg-purple-700 hover:bg-purple-600">
                <Users className="mr-2" size={16} />
                Manage Users
              </Button>
              <Button className="w-full justify-start bg-purple-700 hover:bg-purple-600">
                <School className="mr-2" size={16} />
                Manage Classes
              </Button>
              <Button className="w-full justify-start bg-purple-700 hover:bg-purple-600">
                <BarChart3 className="mr-2" size={16} />
                View Reports
              </Button>
              <Button className="w-full justify-start bg-purple-700 hover:bg-purple-600">
                <Settings className="mr-2" size={16} />
                Settings
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <Card className="border-purple-700 bg-purple-800">
            <CardHeader>
              <CardTitle className="text-white">Recent Activity</CardTitle>
              <CardDescription className="text-purple-300">Latest system events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { action: 'New student enrolled', user: 'Chisom Doe', time: '2 hours ago' },
                  { action: 'Fee payment received', user: 'STU-ADM-001', time: '3 hours ago' },
                  { action: 'Teacher assessment created', user: 'Prof. Jane Smith', time: '1 day ago' },
                  { action: 'Grade dispute filed', user: 'Parent (John Doe)', time: '2 days ago' },
                ].map((activity, idx) => (
                  <div key={idx} className="flex items-center justify-between border-b border-purple-700 pb-4 last:border-b-0">
                    <div>
                      <p className="font-medium text-white">{activity.action}</p>
                      <p className="text-sm text-purple-300">by {activity.user}</p>
                    </div>
                    <span className="text-sm text-purple-400">{activity.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
