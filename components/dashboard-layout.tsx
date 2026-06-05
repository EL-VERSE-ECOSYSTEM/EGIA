'use client'

import { ReactNode } from 'react'
import { Sidebar } from '@/components/sidebar'

interface DashboardLayoutProps {
  children: ReactNode
  role?: 'admin' | 'teacher' | 'parent' | 'student'
}

export function DashboardLayout({ children, role = 'student' }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar role={role} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
