'use client'

import React, { useState, useEffect } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { User, Download, X, Smartphone, CheckCircle, Menu, LogOut, ChevronDown, Settings } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { DashboardRealtimeSync } from '@/components/realtime/DashboardRealtimeSync'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { PermissionRequest } from '@/components/notifications/PermissionRequest'
import { ThemeToggle } from '@/components/ThemeToggle'
import { SchoolRenewalReminderWidget } from '@/components/school/SchoolRenewalReminderWidget'
import { StudentRegistrationLockoutWidget } from '@/components/student/StudentRegistrationLockoutWidget'
import { MobileNav } from '@/components/layout/mobile-nav'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function DashboardLayout({
  children,
  role = 'admin',
  userEmail,
  schoolId,
  studentId,
}: {
  children: React.ReactNode
  role?: 'admin' | 'teacher' | 'parent' | 'student' | 'super-admin'
  userEmail?: string
  schoolId?: string | null
  studentId?: string | null
}) {
  const activeRole = role || 'admin'
  const [mounted, setMounted] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallBtn, setShowInstallBtn] = useState(false)
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)
  const [installedSuccess, setInstalledSuccess] = useState(false)

  // Mobile sidebar drawer state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  // Escape key handler for drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSidebarOpen(false)
        setShowUserMenu(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    setMounted(true)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                          (window.navigator as Navigator & { standalone?: boolean }).standalone === true

    if (isStandalone) {
      return
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowInstallBtn(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    const isIOS = (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) && !('MSStream' in window)
    if (isIOS) {
      setShowInstallBtn(true)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setDeferredPrompt(null)
        setShowInstallBtn(false)
        setInstalledSuccess(true)
        setTimeout(() => setInstalledSuccess(false), 5000)
      }
    } else {
      setShowIOSInstructions(!showIOSInstructions)
    }
  }

  const themeColors = {
    'super-admin': {
      btn: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100 border-indigo-500',
      text: 'text-indigo-600'
    },
    student: {
      btn: 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-100 border-orange-500',
      text: 'text-orange-600'
    },
    parent: {
      btn: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-100 border-emerald-500',
      text: 'text-emerald-600'
    },
    teacher: {
      btn: 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-100 border-purple-500',
      text: 'text-purple-600'
    },
    admin: {
      btn: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-100 border-amber-500',
      text: 'text-amber-600'
    },
  }[activeRole] || {
    btn: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-100 border-amber-500',
    text: 'text-amber-600'
  }

  return (
    <div className="relative flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {mounted && <DashboardRealtimeSync role={role} />}
      {mounted && activeRole === 'admin' && (
        <SchoolRenewalReminderWidget schoolId={schoolId || null} />
      )}
      {mounted && activeRole === 'student' && (
        <StudentRegistrationLockoutWidget studentId={studentId || null} />
      )}
      {/* Mobile Sidebar backdrop overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Responsive Sidebar Drawer */}
      <div
        id="mobile-sidebar-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation Menu"
        className={`lg:static lg:z-auto z-50 ${isSidebarOpen ? 'relative' : 'hidden lg:block'}`}
      >
        <Sidebar role={activeRole} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      </div>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white/90 px-3 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/90 sm:h-20 sm:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            {/* Hamburger Button for Mobile Drawer Toggle */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition-colors hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 lg:hidden"
              aria-label="Open navigation menu"
              aria-expanded={isSidebarOpen}
              aria-controls="mobile-sidebar-drawer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="truncate text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 sm:tracking-[0.18em] dark:text-slate-400">Dashboard <span className="px-1 text-slate-300">/</span> <span className="text-slate-900 dark:text-white">{activeRole}</span></h1>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            {mounted && <ThemeToggle />}
            {mounted && <NotificationBell />}
            <div className="h-10 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>
            <div className="relative flex items-center gap-3 pl-2">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                aria-expanded={showUserMenu}
                aria-haspopup="true"
                aria-label="User Account Menu"
                className="flex items-center gap-2 rounded-xl p-1 transition-colors hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-slate-400 dark:hover:bg-slate-800 sm:gap-3"
              >
                <div className="text-right hidden md:block">
                  <p className="text-xs font-black text-slate-900 dark:text-white">EL LEARNERS</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{userEmail || `${activeRole} Portal`}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-md">
                  <User className="w-5 h-5" />
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 top-14 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-black text-slate-900 dark:text-white capitalize">{activeRole} Identity</p>
                    <p className="text-[10px] font-bold text-slate-400 truncate">{userEmail || 'Active Portal'}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowUserMenu(false)
                      window.location.href = `/dashboard/${activeRole}/profile`
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                  >
                    <User className="w-3.5 h-3.5" /> My Profile
                  </button>
                  <button
                    onClick={() => {
                      setShowUserMenu(false)
                      window.location.href = `/dashboard/${activeRole}/settings`
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                  >
                    <Settings className="w-3.5 h-3.5" /> Settings
                  </button>
                  <button
                    onClick={async () => {
                      const supabase = createClient()
                      await supabase.auth.signOut()
                      window.location.href = '/auth/signin'
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="relative flex-1 bg-slate-50/70 pb-24 dark:bg-slate-950 lg:pb-0">
          {mounted && <PermissionRequest />}
          {children}

          {/* Floating interactive PWA Download / Install App Prompt Widget */}
          {showInstallBtn && (
            <div className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 z-50 flex flex-col items-end sm:right-6 lg:bottom-8 lg:right-8">
              {/* iOS Manual PWA Install Instructions Popover */}
              {showIOSInstructions && (
                <div className="mb-3 max-w-xs rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl animate-in slide-in-from-bottom-5 duration-300 dark:border-slate-700 dark:bg-slate-900">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-black text-slate-900 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-slate-700" /> PWA Install on iOS
                    </h3>
                    <button onClick={() => setShowIOSInstructions(false)} className="text-slate-400 hover:text-slate-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                    Install <strong>EL LEARNERS</strong> directly to your home screen:
                  </p>
                  <ol className="list-decimal list-inside text-[11px] text-slate-600 font-bold space-y-1 mt-1.5">
                    <li>Tap the Safari <span className="text-blue-600">Share button</span> (square with arrow up).</li>
                    <li>Scroll down and select <span className="text-slate-900">"Add to Home Screen"</span>.</li>
                    <li>Tap <span className="text-blue-600">"Add"</span> to finish.</li>
                  </ol>
                </div>
              )}

              <button
                onClick={handleInstallClick}
                className={`flex min-h-11 items-center gap-2 rounded-full border px-4 py-3 text-xs font-bold shadow-xl transition-transform hover:scale-[1.02] active:scale-[0.98] ${themeColors.btn}`}
              >
                <Download className="w-4 h-4 animate-bounce" />
                DOWNLOAD PWA APP
              </button>
            </div>
          )}

          {/* PWA Successful Installation Prompt Banner */}
          {installedSuccess && (
            <div className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 z-50 flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-2xl border border-emerald-100 bg-white p-4 shadow-2xl animate-in fade-in zoom-in duration-300 dark:border-emerald-900 dark:bg-slate-900 sm:right-6 lg:bottom-8 lg:right-8">
              <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-900">Application Installed!</p>
                <p className="text-[10px] font-bold text-slate-400">EL LEARNERS is now accessible directly on your device desktop.</p>
              </div>
              <button onClick={() => setInstalledSuccess(false)} className="text-slate-400 hover:text-slate-600 ml-2">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </main>

        {/* Premium Glassmorphic Mobile Bottom Navigation Bar */}
        <MobileNav role={role} onOpenSidebar={() => setIsSidebarOpen(true)} />
      </div>
    </div>
  )
}
