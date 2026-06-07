import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default async function AdminOverview() {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    redirect("/sign-in")
  }

  const [studentCount, teacherCount, parentCount, recentPayments] = await Promise.all([
    prisma.student.count(),
    prisma.teacher.count(),
    prisma.parent.count(),
    prisma.payment.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { student: true }
    })
  ])

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-amber-600">Admin Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teacherCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Parents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{parentCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Fee Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentPayments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.student.firstName} {p.student.lastName}</TableCell>
                  <TableCell>₦{p.amount.toLocaleString()}</TableCell>
                  <TableCell>{p.feeType}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs ${
                      p.status === 'SUCCESS' ? 'bg-green-100 text-green-800' :
                      p.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {p.status}
                    </span>
                  </TableCell>
                  <TableCell>{p.createdAt.toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
              {recentPayments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                    No recent payments found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
