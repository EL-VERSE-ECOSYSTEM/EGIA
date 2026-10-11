import type { ReactNode } from 'react'
import { requireDashboardRole } from '@/lib/auth/dashboard-access'

export default async function SuperAdminDashboardLayout({ children }: { children: ReactNode }) {
  await requireDashboardRole(['SUPER_ADMIN'])
  return children
}