import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function ParentOverview() {
  const session = await auth()
  if (!session || session.user.role !== "PARENT") {
    redirect("/sign-in")
  }

  const parent = await prisma.parent.findUnique({
    where: { userId: session.user.id },
    include: {
      students: {
        include: {
          results: {
            take: 3,
            orderBy: { createdAt: 'desc' },
            include: { assessment: { include: { subject: true } } }
          },
          payments: {
            where: { status: 'PENDING' }
          }
        }
      }
    }
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-emerald-600">Parent Dashboard</h1>
        <Link href="/dashboard/parent/children/link">
          <Button className="bg-emerald-600 hover:bg-emerald-700">Link Child</Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {parent?.students.map((student) => (
          <Card key={student.id} className="border-emerald-100">
            <CardHeader className="bg-emerald-50/50">
              <CardTitle>{student.firstName} {student.lastName}</CardTitle>
              <p className="text-sm text-emerald-600">{student.class} {student.arm}</p>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div>
                <h4 className="font-semibold text-sm mb-2">Latest Results</h4>
                <ul className="space-y-1">
                  {student.results.map(r => (
                    <li key={r.id} className="text-xs flex justify-between">
                      <span>{r.assessment.subject.name}</span>
                      <span className="font-bold">{r.grade} ({r.score}%)</span>
                    </li>
                  ))}
                  {student.results.length === 0 && <li className="text-xs text-muted-foreground">No results yet</li>}
                </ul>
              </div>

              <div className="pt-2 border-t">
                <h4 className="font-semibold text-sm mb-2">Unpaid Fees</h4>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-red-600">{student.payments.length} pending items</span>
                  <Link href={`/dashboard/parent/payments/make-payment?childId=${student.id}`}>
                    <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-600">Pay Now</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {parent?.students.length === 0 && (
          <Card className="col-span-full py-12 flex flex-col items-center justify-center border-dashed">
            <p className="text-muted-foreground mb-4">You haven't linked any children yet.</p>
            <Link href="/dashboard/parent/children/link">
              <Button className="bg-emerald-600 hover:bg-emerald-700">Link Child via Admission Number</Button>
            </Link>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>School Bank Accounts for Manual Transfer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg bg-slate-50">
              <p className="font-bold text-emerald-700">First Bank</p>
              <p className="text-lg font-mono">3069520782</p>
            </div>
            <div className="p-4 border rounded-lg bg-slate-50">
              <p className="font-bold text-emerald-700">GTB</p>
              <p className="text-lg font-mono">0649893280</p>
            </div>
            <div className="p-4 border rounded-lg bg-slate-50">
              <p className="font-bold text-emerald-700">Access Bank</p>
              <p className="text-lg font-mono">1907856695</p>
            </div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground italic">
            * After payment, please upload your receipt in the "Make Payment" section to get verified.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
