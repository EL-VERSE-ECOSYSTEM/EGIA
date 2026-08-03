import { redirect } from 'next/navigation'

/** Kept for existing sidebar/bookmarks; the fully data-backed video library lives here. */
export default function Page() { redirect('/dashboard/student/video-sessions') }
