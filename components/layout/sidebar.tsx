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
  Gamepad2,
  Video,
  X,
  BookMarked,
  BarChart3,
  MonitorPlay,
  FolderOpen,
  HelpCircle,
  Bell
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SidebarProps {
  role: 'admin' | 'teacher' | 'parent' | 'student'
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ role, isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname()

  const configMap = {
    admin: {
      color: 'bg-slate-900 border-r border-amber-500/20',
      activeColor: 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-amber-500/20',
      hoverColor: 'hover:bg-amber-500/10 hover:text-amber-300',
      links: [
        { label: 'Overview', icon: LayoutDashboard, href: '/dashboard/admin/overview' },
        { label: 'Students List', icon: Users, href: '/dashboard/admin/users/students/list' },
        { label: 'Teachers List', icon: User, href: '/dashboard/admin/users/teachers/list' },
        { label: 'Academics Control', icon: BookOpen, href: '/dashboard/admin/academics' },
        { label: 'Library Catalog', icon: BookMarked, href: '/dashboard/admin/library/books' },
        { label: 'Assessments Log', icon: GraduationCap, href: '/dashboard/admin/assessments' },
        { label: 'Disciplinary Records', icon: ShieldAlert, href: '/dashboard/admin/disciplinary' },
        { label: 'Pending Fees', icon: Clock, href: '/dashboard/admin/finance/fees/pending' },
        { label: 'Fees Structure', icon: CreditCard, href: '/dashboard/admin/finance/fees/structure' },
        { label: 'School Wallet', icon: Wallet, href: '/dashboard/admin/wallet' },
        { label: 'Teacher Utility & Payroll', icon: Wallet, href: '/dashboard/admin/finance/teacher-requests' },
        { label: 'Communication Hub', icon: MessageSquare, href: '/dashboard/admin/communication' },
        { label: 'Notifications', icon: Bell, href: '/dashboard/admin/communication/notifications/history' },
        { label: 'Analytical Reports', icon: BarChart3, href: '/dashboard/admin/reports' },
        { label: 'Settings', icon: Settings, href: '/dashboard/admin/settings' },
      ]
    },
    teacher: {
      color: 'bg-slate-950 border-r border-purple-500/20',
      activeColor: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-purple-600/20',
      hoverColor: 'hover:bg-purple-500/10 hover:text-purple-300',
      links: [
        { label: 'Overview', icon: LayoutDashboard, href: '/dashboard/teacher/overview' },
        { label: 'My Classes', icon: School, href: '/dashboard/teacher/my-classes' },
        { label: 'Assessments Desk', icon: GraduationCap, href: '/dashboard/teacher/assessments/create' },
        { label: 'Attendance Registry', icon: Calendar, href: '/dashboard/teacher/attendance/mark' },
        { label: 'CBT Proctor Control', icon: MonitorPlay, href: '/dashboard/teacher/cbt/monitor' },
        { label: 'Learning Materials', icon: FolderOpen, href: '/dashboard/teacher/materials/upload' },
        { label: 'Video Lecture Rooms', icon: Video, href: '/dashboard/teacher/video-sessions' },
        { label: 'Lesson Notes Catalog', icon: FileText, href: '/dashboard/teacher/lesson-notes' },
        { label: 'Results & Compilation', icon: Award, href: '/dashboard/teacher/results' },
        { label: 'Analytics Panel', icon: BarChart3, href: '/dashboard/teacher/analytics/student-growth' },
        { label: 'Communication Desk', icon: MessageSquare, href: '/dashboard/teacher/communication/messages' },
        { label: 'Notifications', icon: Bell, href: '/dashboard/teacher/communication/notifications' },
        { label: 'My Wallet', icon: Wallet, href: '/dashboard/teacher/wallet' },
        { label: 'Profile Settings', icon: User, href: '/dashboard/teacher/profile' },
      ]
    },
    parent: {
      color: 'bg-slate-950 border-r border-emerald-500/20',
      activeColor: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-emerald-600/20',
      hoverColor: 'hover:bg-emerald-500/10 hover:text-emerald-300',
      links: [
        { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard/parent/overview' },
        { label: 'My Children Profile', icon: Users, href: '/dashboard/parent/children/list' },
        { label: 'Parent Wallet', icon: Wallet, href: '/dashboard/parent/wallet' },
        { label: 'Payments History', icon: CreditCard, href: '/dashboard/parent/payments/history' },
        { label: 'Library Catalog', icon: BookOpen, href: '/dashboard/parent/library/available' },
        { label: 'Report Cards Desk', icon: FileText, href: '/dashboard/parent/results/report-card' },
        { label: 'School Calendar', icon: Calendar, href: '/dashboard/parent/calendar' },
        { label: 'Communication Hub', icon: MessageSquare, href: '/dashboard/parent/communication' },
        { label: 'Notifications', icon: Bell, href: '/dashboard/parent/communication/notifications' },
        { label: 'Help & Support Desk', icon: HelpCircle, href: '/dashboard/parent/help/contact-support' },
        { label: 'Settings', icon: Settings, href: '/dashboard/parent/settings/profile' },
      ]
    },
    student: {
      color: 'bg-slate-950 border-r border-orange-500/20',
      activeColor: 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-orange-500/20',
      hoverColor: 'hover:bg-orange-500/10 hover:text-orange-300',
      links: [
        { label: 'Dashboard Overview', icon: LayoutDashboard, href: '/dashboard/student/overview' },
        { label: 'Learner Wallet', icon: Wallet, href: '/dashboard/student/wallet' },
        { label: 'Digital Library Desk', icon: BookOpen, href: '/dashboard/student/library' },
        { label: 'Video Lecture Rooms', icon: Video, href: '/dashboard/student/video-sessions' },
        { label: 'E-Books & Materials', icon: FolderOpen, href: '/dashboard/student/materials/e-books' },
        { label: 'CBT Assessments', icon: GraduationCap, href: '/dashboard/student/assessments/upcoming' },
        { label: 'Attendance Card', icon: Calendar, href: '/dashboard/student/attendance/calendar' },
        { label: 'Study Planner Desk', icon: Clock, href: '/dashboard/student/study-planner/goals' },
        { label: 'Leaderboard Rankings', icon: BarChart3, href: '/dashboard/student/leaderboard/class' },
        { label: 'Results Sheet', icon: Award, href: '/dashboard/student/results/current' },
        { label: 'Communication Hub', icon: MessageSquare, href: '/dashboard/student/communication/messages' },
        { label: 'Notifications', icon: Bell, href: '/dashboard/student/communication/notifications' },
        { label: 'Educational Games', icon: Gamepad2, href: '/dashboard/student/games' },
        { label: 'Class Timetable', icon: Calendar, href: '/dashboard/student/timetable' },
        { label: 'Profile Settings', icon: User, href: '/dashboard/student/profile' },
      ]
    }
  }

  const config = configMap[role]
  const [isAdultEnrolled, setIsAdultEnrolled] = React.useState(false)
  const [isAppointedTeacher, setIsAppointedTeacher] = React.useState(false)
  const [schoolInfo, setSchoolInfo] = React.useState<{ name: string; logoUrl: string } | null>(null)
  const [adminRoleInfo, setAdminRoleInfo] = React.useState<{ level: string; department?: string | null } | null>(null)

  React.useEffect(() => {
    const supabase = createClient()
    async function loadSchoolBranding() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch user's school
      const { data: userRec } = await supabase
        .from('user')
        .select('schoolid')
        .eq('id', user.id)
        .maybeSingle()

      const schoolId = userRec?.schoolid || user.user_metadata?.school_id

      if (schoolId) {
        const { data: sch } = await supabase
          .from('school')
          .select('name, logo_url')
          .eq('id', schoolId)
          .maybeSingle()

        if (sch) {
          setSchoolInfo({
            name: String(sch.name || 'EL LEARNERS'),
            logoUrl: String(sch.logo_url || '/app-logo.png')
          })
        }
      }

      // Fetch admin role level if role is admin
      if (role === 'admin') {
        const { data: roleRec } = await supabase
          .from('school_admin_roles')
          .select('level, department')
          .eq('userid', user.id)
          .eq('is_active', true)
          .maybeSingle()

        if (roleRec) {
          setAdminRoleInfo({
            level: String(roleRec.level || 'PRIMARY_ADMIN'),
            department: roleRec.department ? String(roleRec.department) : null,
          })
        }
      }
    }

    loadSchoolBranding()
  }, [role])

  React.useEffect(() => {
    if (role === 'parent') {
      import('@/app/actions/adult-education').then(({ checkWeeklyPaymentStatus }) => {
        checkWeeklyPaymentStatus().then(status => {
          setIsAdultEnrolled(!!status.enrolled)
        }).catch(err => console.error(err))
      })
    } else if (role === 'teacher') {
      import('@/app/actions/adult-education').then(({ isTeacherAppointedForAdultEd }) => {
        isTeacherAppointedForAdultEd().then(appointed => {
          setIsAppointedTeacher(!!appointed)
        }).catch(err => console.error(err))
      })
    }
  }, [role])

  // Dynamically append Adult Education links if applicable
  const links = [...config.links]
  if (role === 'parent' && isAdultEnrolled) {
    links.push(
      { label: 'Adult Video Classes/Sessions', icon: MonitorPlay, href: '/dashboard/parent/adult-education/video-classes' },
      { label: 'Adult Assignment and Assessment', icon: FileText, href: '/dashboard/parent/adult-education/assignments' },
      { label: 'Saved Sessions', icon: BookMarked, href: '/dashboard/parent/adult-education/saved-sessions' },
      { label: 'Live Classes', icon: Video, href: '/dashboard/parent/adult-education/live-classes' },
    )
  } else if (role === 'teacher' && isAppointedTeacher) {
    links.push(
      { label: 'Manage Adult Videos', icon: MonitorPlay, href: '/dashboard/teacher/adult-education/video-classes' },
      { label: 'Manage Adult Assignments', icon: FileText, href: '/dashboard/teacher/adult-education/assignments' },
      { label: 'Manage Adult Saved Sessions', icon: BookMarked, href: '/dashboard/teacher/adult-education/saved-sessions' },
      { label: 'Manage Adult Live Classes', icon: Video, href: '/dashboard/teacher/adult-education/live-classes' },
    )
  } else if (role === 'admin') {
    links.push(
      { label: 'Manage Adult Videos', icon: MonitorPlay, href: '/dashboard/teacher/adult-education/video-classes' },
      { label: 'Manage Adult Assignments', icon: FileText, href: '/dashboard/teacher/adult-education/assignments' },
      { label: 'Manage Adult Saved Sessions', icon: BookMarked, href: '/dashboard/teacher/adult-education/saved-sessions' },
      { label: 'Manage Adult Live Classes', icon: Video, href: '/dashboard/teacher/adult-education/live-classes' },
    )
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/auth/signin'
  }

  return (
    <aside
      className={cn(
        "w-72 flex flex-col h-screen text-slate-400 border-r border-white/5 shadow-2xl z-50 transition-all duration-300 overflow-y-auto shrink-0",
        config.color,
        "fixed lg:static top-0 left-0",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}
    >
      <div className="p-8">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shadow-lg shadow-amber-600/10 shrink-0">
              {schoolInfo?.logoUrl ? (
                <img
                  src={schoolInfo.logoUrl}
                  alt={schoolInfo.name || 'School Logo'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/app-logo.png'
                  }}
                />
              ) : (
                <GraduationCap className="text-amber-500 w-7 h-7" />
              )}
            </div>
            <div className="leading-tight overflow-hidden">
              <h2 className="font-black text-white text-sm tracking-tighter uppercase truncate">
                {schoolInfo?.name || 'EL LEARNERS'}
              </h2>
              <p className="text-[10px] text-amber-500 font-black uppercase tracking-[0.15em] truncate">
                {role === 'admin' ? (
                  adminRoleInfo?.level === 'PRIMARY_ADMIN' ? 'Primary Admin' :
                  adminRoleInfo?.level === 'VICE_PRINCIPAL_ACADEMICS' ? 'VP Academics' :
                  adminRoleInfo?.level === 'VICE_PRINCIPAL_ADMIN' ? 'VP Admin' :
                  adminRoleInfo?.level === 'HOD_SCIENCE' ? 'HOD Science' :
                  adminRoleInfo?.level === 'HOD_ARTS' ? 'HOD Arts' :
                  adminRoleInfo?.level === 'HOD_COMMERCIAL' ? 'HOD Commercial' : 'School Admin'
                ) : 'ACADEMY'}
              </p>
            </div>
          </div>

          {/* Close button for Mobile Sidebar Drawer */}
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
              aria-label="Close Navigation"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <nav className="space-y-1.5">
          {links.map((link) => {
            const isActive = pathname.startsWith(link.href)
            return (
              <Link
                key={link.label}
                href={link.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-4 px-5 py-3.5 rounded-2xl text-xs font-black transition-all duration-300 group",
                  isActive
                    ? config.activeColor + " shadow-xl shadow-amber-600/10"
                    : "text-slate-500 hover:text-white " + config.hoverColor
                )}
              >
                <link.icon className={cn("w-4 h-4 animate-icon-wiggle", isActive ? "text-white" : "group-hover:text-white transition-colors")} />
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
              <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest text-pretty">EL LEARNERS</p>
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
