'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { UserIdentity, LoginContext } from '@/lib/auth/resolveIdentities'
import {
  GraduationCap,
  Users,
  Building2,
  BookOpen,
  ArrowRight,
  School,
  ShieldCheck,
  Building,
  X,
} from 'lucide-react'

interface RolePickerModalProps {
  isOpen: boolean
  context: LoginContext
  onSelectIdentity: (identity: UserIdentity, remember: boolean) => Promise<void>
}

export function RolePickerModal({ isOpen, context, onSelectIdentity }: RolePickerModalProps) {
  const [remember, setRemember] = useState(true)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  if (!isOpen) return null

  const getRoleBadge = (role: string) => {
    switch (role.toUpperCase()) {
      case 'SUPER_ADMIN':
        return { label: 'SUPER ADMIN', icon: ShieldCheck, color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' }
      case 'SCHOOL_ADMIN':
        return { label: 'ADMINISTRATOR', icon: Building2, color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' }
      case 'TEACHER':
        return { label: 'TEACHER', icon: BookOpen, color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' }
      case 'PARENT':
        return { label: 'PARENT', icon: Users, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' }
      case 'STUDENT':
        return { label: 'PUPIL / STUDENT', icon: GraduationCap, color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' }
      default:
        return { label: role, icon: School, color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' }
    }
  }

  const handleChoose = async (identity: UserIdentity) => {
    setLoadingId(identity.id)
    await onSelectIdentity(identity, remember)
    setLoadingId(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 text-white p-8 rounded-3xl shadow-2xl space-y-6">
        <div className="space-y-2 text-center sm:text-left">
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <span>Welcome back, {context.fullName} 👋</span>
          </h2>
          <p className="text-slate-400 text-sm font-medium">
            You have access to multiple dashboards. Choose where to continue:
          </p>
        </div>

        <div className="space-y-4 my-6 max-h-[420px] overflow-y-auto pr-2 custom-scrollbar">
          {context.identities.map((identity) => {
            const badge = getRoleBadge(identity.role)
            const Icon = badge.icon
            const isLoading = loadingId === identity.id

            return (
              <div
                key={identity.id}
                onClick={() => !loadingId && handleChoose(identity)}
                className={`group relative p-5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/50 transition-all duration-200 cursor-pointer flex items-center justify-between gap-4 ${
                  isLoading ? 'opacity-70 pointer-events-none' : ''
                }`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
                    {identity.schoolLogoUrl ? (
                      <img src={identity.schoolLogoUrl} alt={identity.schoolName || 'School'} className="w-full h-full object-cover" />
                    ) : (
                      <Icon className="w-6 h-6 text-blue-400" />
                    )}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-base tracking-tight text-white group-hover:text-blue-400 transition-colors">
                        {identity.role === 'SCHOOL_ADMIN'
                          ? identity.contextLine || 'School Admin'
                          : identity.role === 'TEACHER'
                          ? 'Teacher'
                          : identity.role === 'PARENT'
                          ? 'Parent'
                          : identity.role === 'STUDENT'
                          ? 'Student / Pupil'
                          : 'Super Admin'}
                      </span>
                      <Badge className={`text-[10px] font-black uppercase border px-2 py-0.5 rounded-full ${badge.color}`}>
                        {badge.label}
                      </Badge>
                    </div>

                    <p className="text-xs font-bold text-slate-400 truncate flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{identity.schoolName || 'Academy Portal'}</span>
                    </p>

                    {identity.contextLine && (
                      <p className="text-[11px] font-medium text-slate-500">
                        {identity.contextLine}
                      </p>
                    )}
                  </div>
                </div>

                <Button
                  size="sm"
                  disabled={isLoading}
                  className="bg-blue-600 group-hover:bg-blue-500 text-white rounded-xl font-bold text-xs px-4 h-10 shrink-0 flex items-center gap-1.5 shadow-lg shadow-blue-600/20"
                >
                  {isLoading ? (
                    <span>Connecting...</span>
                  ) : (
                    <>
                      <span>Continue</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </Button>
              </div>
            )
          })}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-slate-400">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="rounded border-slate-800 bg-slate-950 text-blue-600 focus:ring-blue-500 h-4 w-4"
            />
            <span>Remember my choice for this device</span>
          </label>
        </div>
      </div>
    </div>
  )
}
