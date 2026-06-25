'use client'

import { Sidebar } from '@/components/layout/sidebar'
import { Bell, Search, User } from 'lucide-react'

export default function DashboardLayout({
  children,
  role = 'admin'
}: {
  children: React.ReactNode
  role?: 'admin' | 'teacher' | 'parent' | 'student'
}) {
  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar role={role} />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 border-b border-slate-200 bg-white/50 backdrop-blur-md px-8 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Dashboard / <span className="text-slate-900">{role}</span></h1>
          </div>
          <div className="flex items-center gap-6">
            <button className="relative p-2.5 rounded-xl bg-white border border-slate-100 text-slate-500 hover:bg-slate-50 transition-colors shadow-sm">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-amber-600 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-10 w-[1px] bg-slate-200 mx-2"></div>
            <div className="flex items-center gap-3 pl-2">
              <div className="text-right hidden md:block">
                <p className="text-xs font-black text-slate-900">Admin Account</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">School Board</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
                <User className="w-5 h-5" />
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-slate-50/50">
          {children}
        </main>
      </div>
    </div>
  )
}
