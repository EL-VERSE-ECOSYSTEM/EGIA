'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { LogOut, Menu } from 'lucide-react'
import { useState } from 'react'
import { signOut } from 'next-auth/react'

interface SidebarProps {
  role?: 'ADMIN' | 'TEACHER' | 'PARENT' | 'STUDENT'
}

const menuItems = {
  ADMIN: [
    { label: 'Overview', href: '/dashboard/admin/overview' },
    { label: 'Users', href: '/dashboard/admin/users/students/list' },
    { label: 'Academics', href: '/dashboard/admin/academics/classes/list' },
    { label: 'Payments', href: '/dashboard/admin/finance/fees/payments' },
    { label: 'Reports', href: '/dashboard/admin/reports/academic/performance' },
    { label: 'Settings', href: '/dashboard/admin/settings/general' },
  ],
  TEACHER: [
    { label: 'Overview', href: '/dashboard/teacher/overview' },
    { label: 'My Classes', href: '/dashboard/teacher/my-classes' },
    { label: 'Assessments', href: '/dashboard/teacher/assessments' },
    { label: 'Attendance', href: '/dashboard/teacher/attendance/mark' },
    { label: 'Results', href: '/dashboard/teacher/results' },
    { label: 'Messages', href: '/dashboard/teacher/communication/messages' },
  ],
  PARENT: [
    { label: 'Overview', href: '/dashboard/parent/overview' },
    { label: 'Children', href: '/dashboard/parent/children/list' },
    { label: 'Results', href: '/dashboard/parent/results/current' },
    { label: 'Payments', href: '/dashboard/parent/payments/dashboard' },
    { label: 'Messages', href: '/dashboard/parent/communication/messages' },
    { label: 'Support', href: '/dashboard/parent/communication/support/my-tickets' },
  ],
  STUDENT: [
    { label: 'Overview', href: '/dashboard/student/overview' },
    { label: 'Assessments', href: '/dashboard/student/assessments/upcoming' },
    { label: 'Results', href: '/dashboard/student/results' },
    { label: 'Attendance', href: '/dashboard/student/attendance/summary' },
    { label: 'Timetable', href: '/dashboard/student/timetable/weekly' },
    { label: 'Messages', href: '/dashboard/student/communication/messages' },
  ],
}

export function Sidebar({ role = 'STUDENT' }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true)
  const items = menuItems[role] || []

  const roleColors = {
    ADMIN: 'bg-amber-50 border-amber-200',
    TEACHER: 'bg-purple-50 border-purple-200',
    PARENT: 'bg-green-50 border-green-200',
    STUDENT: 'bg-orange-50 border-orange-200',
  }

  return (
    <aside className={cn(
      'border-r transition-all duration-300 min-h-screen sticky top-0',
      roleColors[role] || roleColors.STUDENT,
      isOpen ? 'w-64' : 'w-20'
    )}>
      <div className="flex items-center justify-between p-4">
        {isOpen && <h1 className="font-bold text-lg text-amber-700">EL GOODNEWS</h1>}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 hover:bg-white rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      <nav className="px-4 py-6 space-y-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block px-4 py-2 rounded-lg hover:bg-white/50 transition-colors text-sm"
          >
            {isOpen ? item.label : item.label.charAt(0)}
          </Link>
        ))}
      </nav>

      <div className="absolute bottom-4 left-4 right-4">
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={() => signOut({ callbackUrl: '/' })}
        >
          <LogOut className="w-4 h-4" />
          {isOpen && 'Logout'}
        </Button>
      </div>
    </aside>
  )
}
