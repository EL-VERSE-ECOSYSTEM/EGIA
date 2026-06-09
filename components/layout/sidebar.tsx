'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  CreditCard,
  MessageSquare,
  Settings,
  ShieldAlert,
  Calendar,
  LogOut,
  ChevronLeft,
  ChevronRight,
  School,
  User,
  Award,
  FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SidebarProps {
  role: 'admin' | 'teacher' | 'parent' | 'student'
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname()

  const configMap = {
    admin: {
      color: 'bg-amber-900',
      activeColor: 'bg-amber-800 text-amber-50',
      hoverColor: 'hover:bg-amber-800/50',
      links: [
        { label: 'Overview', icon: LayoutDashboard, href: '/dashboard/admin/overview' },
        { label: 'Users', icon: Users, href: '/dashboard/admin/users/students/list' },
        { label: 'Academics', icon: BookOpen, href: '/dashboard/admin/academics' },
        { label: 'Finance', icon: CreditCard, href: '/dashboard/admin/finance/fees/structure' },
        { label: 'Communication', icon: MessageSquare, href: '/dashboard/admin/communication' },
        { label: 'Disciplinary', icon: ShieldAlert, href: '/dashboard/admin/disciplinary' },
        { label: 'Settings', icon: Settings, href: '/dashboard/admin/settings' },
      ]
    },
    teacher: {
      color: 'bg-purple-900',
      activeColor: 'bg-purple-800 text-purple-50',
      hoverColor: 'hover:bg-purple-800/50',
      links: [
        { label: 'Overview', icon: LayoutDashboard, href: '/dashboard/teacher/overview' },
        { label: 'My Classes', icon: School, href: '/dashboard/teacher/my-classes' },
        { label: 'Assessments', icon: GraduationCap, href: '/dashboard/teacher/assessments/create' },
        { label: 'Lesson Notes', icon: FileText, href: '/dashboard/teacher/lesson-notes' },
        { label: 'Results', icon: Award, href: '/dashboard/teacher/results' },
        { label: 'Profile', icon: User, href: '/dashboard/teacher/profile' },
      ]
    },
    parent: {
      color: 'bg-emerald-900',
      activeColor: 'bg-emerald-800 text-emerald-50',
      hoverColor: 'hover:bg-emerald-800/50',
      links: [
        { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard/parent/overview' },
        { label: 'My Children', icon: Users, href: '/dashboard/parent/children/list' },
        { label: 'Payments', icon: CreditCard, href: '/dashboard/parent/payments/history' },
        { label: 'Communication', icon: MessageSquare, href: '/dashboard/parent/communication' },
        { label: 'Settings', icon: Settings, href: '/dashboard/parent/settings/profile' },
      ]
    },
    student: {
      color: 'bg-orange-900',
      activeColor: 'bg-orange-800 text-orange-50',
      hoverColor: 'hover:bg-orange-800/50',
      links: [
        { label: 'My Dashboard', icon: LayoutDashboard, href: '/dashboard/student/overview' },
        { label: 'Assessments', icon: GraduationCap, href: '/dashboard/student/assessments/upcoming' },
        { label: 'My Results', icon: Award, href: '/dashboard/student/results/current' },
        { label: 'Timetable', icon: Calendar, href: '/dashboard/student/timetable' },
        { label: 'My Profile', icon: User, href: '/dashboard/student/profile' },
      ]
    }
  }

  const config = configMap[role]

  return (
    <aside className={cn("w-64 flex flex-col h-screen text-slate-300 transition-all", config.color)}>
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
          <GraduationCap className="text-white w-6 h-6" />
        </div>
        <div>
          <h2 className="font-bold text-white text-sm leading-tight uppercase tracking-widest">EL GOODNEWS</h2>
          <p className="text-[10px] text-white/50 font-bold uppercase tracking-tighter">INT'L ACADEMY</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {config.links.map((link) => {
          const isActive = pathname.startsWith(link.href)
          return (
            <Link
              key={link.label}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all group",
                isActive ? config.activeColor : config.hoverColor
              )}
            >
              <link.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-white/40 group-hover:text-white")} />
              {link.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 mt-auto">
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-900 text-xs">
              JD
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">John Doe</p>
              <p className="text-[10px] text-white/40 capitalize">{role}</p>
            </div>
          </div>
          <Button variant="ghost" className="w-full justify-start h-8 px-2 text-white/60 hover:text-white hover:bg-white/10 text-xs font-bold">
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
          </Button>
        </div>
      </div>
    </aside>
  )
}
