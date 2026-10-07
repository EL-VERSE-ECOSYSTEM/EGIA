'use client'

import React, { useState, useEffect } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Bell, Search, User, Download, X, Smartphone, CheckCircle, Menu, LogOut, ChevronDown, Settings, Shield } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { DashboardRealtimeSync } from '@/components/realtime/DashboardRealtimeSync'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { PermissionRequest } from '@/components/notifications/PermissionRequest'
import { ThemeToggle } from '@/components/ThemeToggle'

export default function DashboardLayout({
  children,
  role = 'admin',
  userEmail,
  navItems,
  ...rest
}: {
  children: React.ReactNode
  role?: 'admin' | 'teacher' | 'parent' | 'student' | 'super-admin'
  userEmail?: string
  navItems?: any[]
  [key: string]: any
}) {
  const activeRole = (role === 'super-admin' ? 'admin' : role) || 'admin'
  const [mounted, setMounted] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
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
                          (window.navigator as any).standalone === true

    if (isStandalone) {
      return
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallBtn(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    const isIOS = (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) && !(window as any).MSStream
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
  }[activeRole]

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] relative">
      {mounted && <DashboardRealtimeSync role={role} />}
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

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 border-b border-slate-200 bg-white/50 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {/* Hamburger Button for Mobile Drawer Toggle */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-300 transition-all"
              aria-label="Open Navigation"
              aria-expanded={isSidebarOpen}
              aria-controls="mobile-sidebar-drawer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Dashboard / <span className="text-slate-900">{activeRole}</span></h1>
          </div>

          <div className="flex items-center gap-4">
            {mounted && <ThemeToggle />}
            {mounted && <NotificationBell />}
            <div className="h-10 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>
            <div className="relative flex items-center gap-3 pl-2">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                aria-expanded={showUserMenu}
                aria-haspopup="true"
                aria-label="User Account Menu"
                className="flex items-center gap-3 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
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

        <main className="flex-1 overflow-y-auto bg-slate-50/50 relative">
          {mounted && <PermissionRequest />}
          {children}

          {/* Floating interactive PWA Download / Install App Prompt Widget */}
          {showInstallBtn && (
            <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end">
              {/* iOS Manual PWA Install Instructions Popover */}
              {showIOSInstructions && (
                <div className="mb-3 max-w-xs bg-white border border-slate-200 p-4 rounded-3xl shadow-2xl animate-in slide-in-from-bottom-5 duration-300">
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
                className={`flex items-center gap-2 px-5 py-3 rounded-full font-black text-xs border shadow-2xl transition-all scale-100 hover:scale-105 active:scale-95 duration-200 ${themeColors.btn}`}
              >
                <Download className="w-4 h-4 animate-bounce" />
                DOWNLOAD PWA APP
              </button>
            </div>
          )}

          {/* PWA Successful Installation Prompt Banner */}
          {installedSuccess && (
            <div className="fixed bottom-8 right-8 z-50 bg-white border border-emerald-100 p-4 rounded-3xl shadow-2xl flex items-center gap-3 animate-in fade-in zoom-in duration-300">
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
      </div>
    </div>
  )
}
