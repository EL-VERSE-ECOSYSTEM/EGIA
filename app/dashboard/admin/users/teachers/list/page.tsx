import { getAllTeachers } from '@/app/actions/admin'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function TeacherListPage() {
  const teachers = await getAllTeachers()

  return (
    <DashboardLayout role="admin">
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Teachers</h1>
          <Link href="/dashboard/admin/users/teachers/add">
            <Button className="bg-amber-600 hover:bg-amber-700">Add New Teacher</Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Staff List</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Qualification</TableHead>
                  <TableHead>Specialization</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teachers.map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell className="font-medium">{teacher.firstName} {teacher.lastName}</TableCell>
                    <TableCell>{teacher.user?.email}</TableCell>
                    <TableCell>{teacher.qualification}</TableCell>
                    <TableCell>{teacher.specialization}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/dashboard/admin/users/teachers/${teacher.id}`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
