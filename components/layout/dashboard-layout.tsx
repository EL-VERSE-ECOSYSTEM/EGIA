'use client'

import { Sidebar } from '@/components/layout/sidebar'

export default function DashboardLayout({
  children,
  role = 'admin' // In reality, this would be fetched from session
}: {
  children: React.ReactNode
  role?: 'admin' | 'teacher' | 'parent' | 'student'
}) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role={role} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
