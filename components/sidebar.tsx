'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { LogOut, Menu } from 'lucide-react'
import { useState } from 'react'

interface SidebarProps {
  role?: 'admin' | 'teacher' | 'parent' | 'student'
}

const menuItems = {
  admin: [
    { label: 'Overview', href: '/dashboard/admin' },
    { label: 'Users', href: '/dashboard/admin/users' },
    { label: 'Academics', href: '/dashboard/admin/academics' },
    { label: 'Payments', href: '/dashboard/admin/payments' },
    { label: 'Reports', href: '/dashboard/admin/reports' },
    { label: 'Settings', href: '/dashboard/admin/settings' },
  ],
  teacher: [
    { label: 'Overview', href: '/dashboard/teacher' },
    { label: 'My Classes', href: '/dashboard/teacher/classes' },
    { label: 'Assessments', href: '/dashboard/teacher/assessments' },
    { label: 'Attendance', href: '/dashboard/teacher/attendance' },
    { label: 'Results', href: '/dashboard/teacher/results' },
    { label: 'Analytics', href: '/dashboard/teacher/analytics' },
  ],
  parent: [
    { label: 'Overview', href: '/dashboard/parent' },
    { label: 'Children', href: '/dashboard/parent/children' },
    { label: 'Results', href: '/dashboard/parent/results' },
    { label: 'Payments', href: '/dashboard/parent/payments' },
    { label: 'Messages', href: '/dashboard/parent/messages' },
    { label: 'Calendar', href: '/dashboard/parent/calendar' },
  ],
  student: [
    { label: 'Overview', href: '/dashboard/student' },
    { label: 'Assessments', href: '/dashboard/student/assessments' },
    { label: 'Results', href: '/dashboard/student/results' },
    { label: 'Attendance', href: '/dashboard/student/attendance' },
    { label: 'Timetable', href: '/dashboard/student/timetable' },
    { label: 'Messages', href: '/dashboard/student/messages' },
  ],
}

export function Sidebar({ role = 'student' }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true)
  const items = menuItems[role] || []

  const roleColors = {
    admin: 'bg-amber-50 border-amber-200',
    teacher: 'bg-purple-50 border-purple-200',
    parent: 'bg-green-50 border-green-200',
    student: 'bg-orange-50 border-orange-200',
  }

  return (
    <aside className={cn(
      'border-r transition-all duration-300',
      roleColors[role] || roleColors.student,
      isOpen ? 'w-64' : 'w-20'
    )}>
      <div className="flex items-center justify-between p-4">
        {isOpen && <h1 className="font-bold text-lg">EL GOODNEWS</h1>}
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
        <Button variant="outline" className="w-full justify-start gap-2">
          <LogOut className="w-4 h-4" />
          {isOpen && 'Logout'}
        </Button>
      </div>
    </aside>
  )
}
