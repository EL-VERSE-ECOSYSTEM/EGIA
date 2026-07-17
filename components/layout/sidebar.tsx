'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { createClient } from '@/utils/supabase/client'
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
  School,
  User,
  Award,
  FileText,
  Search,
  Wallet,
  Clock,
  Gamepad2
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SidebarProps {
  role: 'admin' | 'teacher' | 'parent' | 'student'
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname()

  const configMap = {
    admin: {
      color: 'bg-slate-900',
      activeColor: 'bg-amber-600 text-white',
      hoverColor: 'hover:bg-white/10',
      links: [
        { label: 'Overview', icon: LayoutDashboard, href: '/dashboard/admin/overview' },
        { label: 'Students', icon: Users, href: '/dashboard/admin/users/students/list' },
        { label: 'Teachers', icon: User, href: '/dashboard/admin/users/teachers/list' },
        { label: 'Academics', icon: BookOpen, href: '/dashboard/admin/academics' },
        { label: 'Pending Fees', icon: Clock, href: '/dashboard/admin/finance/fees/pending' },
        { label: 'Finance', icon: CreditCard, href: '/dashboard/admin/finance/fees/structure' },
        { label: 'Communication', icon: MessageSquare, href: '/dashboard/admin/communication' },
        { label: 'Settings', icon: Settings, href: '/dashboard/admin/settings' },
      ]
    },
    teacher: {
      color: 'bg-slate-900',
      activeColor: 'bg-purple-600 text-white',
      hoverColor: 'hover:bg-white/10',
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
      color: 'bg-slate-900',
      activeColor: 'bg-emerald-600 text-white',
      hoverColor: 'hover:bg-white/10',
      links: [
        { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard/parent/overview' },
        { label: 'My Children', icon: Users, href: '/dashboard/parent/children/list' },
        { label: 'Payments', icon: CreditCard, href: '/dashboard/parent/payments/history' },
        { label: 'Communication', icon: MessageSquare, href: '/dashboard/parent/communication' },
        { label: 'Settings', icon: Settings, href: '/dashboard/parent/settings/profile' },
      ]
    },
    student: {
      color: 'bg-slate-900',
      activeColor: 'bg-orange-600 text-white',
      hoverColor: 'hover:bg-white/10',
      links: [
        { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard/student/overview' },
        { label: 'Assessments', icon: GraduationCap, href: '/dashboard/student/assessments/upcoming' },
        { label: 'Results', icon: Award, href: '/dashboard/student/results/current' },
        { label: 'Games & Puzzles', icon: Gamepad2, href: '/dashboard/student/games' },
        { label: 'Timetable', icon: Calendar, href: '/dashboard/student/timetable' },
        { label: 'Profile', icon: User, href: '/dashboard/student/profile' },
      ]
    }
  }

  const config = configMap[role]

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/auth/signin'
  }

  return (
    <aside className={cn("w-72 flex flex-col h-screen text-slate-400 border-r border-white/5 shadow-2xl z-50 transition-all duration-500", config.color)}>
      <div className="p-8">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-12 h-12 rounded-2xl bg-amber-600 flex items-center justify-center shadow-lg shadow-amber-600/20">
            <GraduationCap className="text-white w-7 h-7" />
          </div>
          <div className="leading-tight">
            <h2 className="font-black text-white text-base tracking-tighter uppercase">EL GOODNEWS</h2>
            <p className="text-[10px] text-amber-500 font-black uppercase tracking-[0.2em]">ACADEMY</p>
          </div>
        </div>

        <nav className="space-y-1.5">
          {config.links.map((link) => {
            const isActive = pathname.startsWith(link.href)
            return (
              <Link
                key={link.label}
                href={link.href}
                className={cn(
                  "flex items-center gap-4 px-5 py-3.5 rounded-2xl text-sm font-black transition-all duration-300 group",
                  isActive
                    ? config.activeColor + " shadow-xl shadow-amber-600/10"
                    : "text-slate-500 hover:text-white " + config.hoverColor
                )}
              >
                <link.icon className={cn("w-5 h-5", isActive ? "text-white" : "group-hover:text-white transition-colors")} />
                {link.label}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="mt-auto p-6">
        <div className="p-6 rounded-[2rem] bg-white/5 border border-white/10 relative overflow-hidden group">
          <div className="flex items-center gap-4 mb-5 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-300 flex items-center justify-center font-black text-slate-900 text-xs shadow-inner">
              {role[0].toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-black text-white truncate capitalize">{role} User</p>
              <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest text-pretty">EL GOODNEWS</p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className="w-full justify-start h-11 px-4 rounded-xl text-white/50 hover:text-white hover:bg-white/10 text-xs font-black relative z-10 transition-all"
          >
            <LogOut className="w-4 h-4 mr-3" /> SIGN OUT
          </Button>
        </div>
      </div>
    </aside>
  )
}
