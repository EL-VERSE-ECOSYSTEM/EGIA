import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getTeacherProfile, getTeacherClasses } from '@/lib/api/queries'

export default async function TeacherClassesIndex() {
  const session = await auth.getSession()
  const profile = await getTeacherProfile(session?.user.id || '')
  const classes = await getTeacherClasses(profile?.id || '')

  if (classes && classes.length > 0) {
    redirect('/dashboard/teacher/my-classes/' + classes[0].id)
  }

  return (
    <div className="p-20 text-center text-slate-400 font-bold">
      No classes assigned yet. Please contact admin.
    </div>
  )
}
