import type { ReactNode } from 'react'
import { requireDashboardRole } from '@/lib/auth/dashboard-access'

export default async function StudentDashboardLayout({ children }: { children: ReactNode }) {
  await requireDashboardRole(['STUDENT', 'PUPIL', 'SUPER_ADMIN'])
  return children
}