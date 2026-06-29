import { redirect } from 'next/navigation'

export default function TeacherPage() {
  redirect('/auth/signin')
}
