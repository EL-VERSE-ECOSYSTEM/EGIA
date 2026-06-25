import { redirect } from 'next/navigation'
export default function LessonNotesIndex() {
  redirect('/dashboard/teacher/lesson-notes/my-notes')
}
