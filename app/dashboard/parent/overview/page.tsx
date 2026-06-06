import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, FileText, CreditCard, Bell } from 'lucide-react'

export default async function ParentOverviewPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  const stats = [
    { title: 'My Children', value: '2', icon: Users, color: 'text-blue-500' },
    { title: 'Recent Results', value: '5', icon: FileText, color: 'text-green-500' },
    { title: 'Pending Fees', value: '₦45,000', icon: CreditCard, color: 'text-red-500' },
    { title: 'Unread Notifications', value: '3', icon: Bell, color: 'text-amber-500' },
  ]

  return (
    <DashboardLayout role="parent">
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-8">Parent Dashboard Overview</h1>

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
              <CardTitle>Children Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-bold">Chisom Doe</p>
                    <p className="text-sm text-muted-foreground">JSS 1B • Avg: 78%</p>
                  </div>
                  <button className="text-sm text-green-600 font-bold hover:underline">View Profile</button>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-bold">Kelechi Doe</p>
                    <p className="text-sm text-muted-foreground">SSS 2 Science • Avg: 84%</p>
                  </div>
                  <button className="text-sm text-green-600 font-bold hover:underline">View Profile</button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">Pay School Fees</button>
              <button className="px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors">Message Teachers</button>
              <button className="px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors">View Report Cards</button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
