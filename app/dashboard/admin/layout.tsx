import type { ReactNode } from 'react'
import { requireDashboardRole } from '@/lib/auth/dashboard-access'

export default async function AdminDashboardLayout({ children }: { children: ReactNode }) {
  await requireDashboardRole(['ADMIN', 'SCHOOL_ADMIN', 'SUPER_ADMIN'])
  return children
}