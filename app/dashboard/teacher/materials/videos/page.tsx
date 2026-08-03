import { redirect } from 'next/navigation'

/** Legacy route retained so teachers always land on the working publishing flow. */
export default function Page() { redirect('/dashboard/teacher/video-sessions') }
