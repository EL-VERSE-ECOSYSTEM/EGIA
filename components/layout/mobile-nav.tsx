'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  School,
  Wallet,
  GraduationCap,
  MessageSquare,
  BookOpen,
  FileText,
  Building2,
  HelpCircle,
  Menu,
} from 'lucide-react'

interface MobileNavProps {
  role: 'admin' | 'teacher' | 'parent' | 'student' | 'super-admin'
  onOpenSidebar: () => void
}

export function MobileNav({ role, onOpenSidebar }: MobileNavProps) {
  const pathname = usePathname()

  const configMap = {
    admin: {
      activeColor: 'text-amber-500 font-black',
      activeBg: 'bg-amber-500/10 border-amber-500/30 text-amber-500',
      items: [
        { label: 'Overview', icon: LayoutDashboard, href: '/dashboard/admin/overview' },
        { label: 'Students', icon: Users, href: '/dashboard/admin/users/students/list' },
        { label: 'Wallet', icon: Wallet, href: '/dashboard/admin/wallet' },
        { label: 'Hub', icon: MessageSquare, href: '/dashboard/admin/communication' },
      ],
    },
    teacher: {
      activeColor: 'text-purple-400 font-black',
      activeBg: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
      items: [
        { label: 'Overview', icon: LayoutDashboard, href: '/dashboard/teacher/overview' },
        { label: 'Classes', icon: School, href: '/dashboard/teacher/my-classes' },
        { label: 'CBT', icon: GraduationCap, href: '/dashboard/teacher/assessments/create' },
        { label: 'Messages', icon: MessageSquare, href: '/dashboard/teacher/communication/messages' },
      ],
    },
    parent: {
      activeColor: 'text-emerald-400 font-black',
      activeBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
      items: [
        { label: 'Overview', icon: LayoutDashboard, href: '/dashboard/parent/overview' },
        { label: 'Children', icon: Users, href: '/dashboard/parent/children/list' },
        { label: 'Wallet', icon: Wallet, href: '/dashboard/parent/wallet' },
        { label: 'Reports', icon: FileText, href: '/dashboard/parent/results/report-card' },
      ],
    },
    student: {
      activeColor: 'text-orange-400 font-black',
      activeBg: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
      items: [
        { label: 'Overview', icon: LayoutDashboard, href: '/dashboard/student/overview' },
        { label: 'Wallet', icon: Wallet, href: '/dashboard/student/wallet' },
        { label: 'CBT', icon: GraduationCap, href: '/dashboard/student/assessments/upcoming' },
        { label: 'Library', icon: BookOpen, href: '/dashboard/student/library' },
      ],
    },
    'super-admin': {
      activeColor: 'text-emerald-400 font-black',
      activeBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
      items: [
        { label: 'Overview', icon: LayoutDashboard, href: '/dashboard/super-admin/overview' },
        { label: 'Schools', icon: Building2, href: '/dashboard/super-admin/overview' },
        { label: 'Users', icon: Users, href: '/dashboard/super-admin/overview' },
        { label: 'Support', icon: HelpCircle, href: '/dashboard/super-admin/overview' },
      ],
    },
  }

  const roleConfig = configMap[role] || configMap.admin

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-slate-950/90 dark:bg-slate-950/95 backdrop-blur-xl border-t border-slate-800 shadow-[0_-10px_25px_rgba(0,0,0,0.5)] px-3 py-2"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {roleConfig.items.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard/super-admin/overview' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 group',
                isActive
                  ? roleConfig.activeBg + ' shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              )}
            >
              <item.icon
                className={cn(
                  'w-5 h-5 transition-transform duration-200 group-hover:scale-110',
                  isActive ? roleConfig.activeColor : 'text-slate-400 group-hover:text-white'
                )}
              />
              <span className={cn('text-[10px] font-bold mt-0.5 tracking-tight', isActive ? roleConfig.activeColor : 'text-slate-400')}>
                {item.label}
              </span>
            </Link>
          )
        })}

        {/* Menu Tab to slide open the Sidebar Drawer */}
        <button
          type="button"
          onClick={onOpenSidebar}
          aria-label="Open full menu"
          className="flex flex-col items-center justify-center py-1 px-3 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-900/60 transition-all duration-200 group"
        >
          <Menu className="w-5 h-5 text-slate-400 group-hover:text-white transition-transform duration-200 group-hover:scale-110" />
          <span className="text-[10px] font-bold text-slate-400 mt-0.5 tracking-tight group-hover:text-white">
            Menu
          </span>
        </button>
      </div>
    </nav>
  )
}
