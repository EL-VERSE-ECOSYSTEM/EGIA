import type { ReactNode } from 'react'
import { requireDashboardRole } from '@/lib/auth/dashboard-access'

export default async function TeacherDashboardLayout({ children }: { children: ReactNode }) {
  await requireDashboardRole(['TEACHER', 'SUPER_ADMIN'])
  return children
}