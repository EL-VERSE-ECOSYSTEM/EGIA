import { redirect } from 'next/navigation'

export default function StudentsIndexPage() {
  redirect('/dashboard/admin/users/students/list')
}
