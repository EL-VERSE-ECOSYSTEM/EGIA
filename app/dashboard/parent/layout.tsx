import type { ReactNode } from 'react'
import { requireDashboardRole } from '@/lib/auth/dashboard-access'

export default async function ParentDashboardLayout({ children }: { children: ReactNode }) {
  await requireDashboardRole(['PARENT', 'SUPER_ADMIN'])
  return children
}