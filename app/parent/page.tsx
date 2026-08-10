import { redirect } from 'next/navigation'

export default function ParentRoute() {
  redirect('/dashboard-redirect')
}
