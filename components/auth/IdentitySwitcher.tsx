'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { UserIdentity } from '@/lib/auth/resolveIdentities'
import { switchIdentityAction } from '@/app/auth/signin/actions'
import {
  User,
  Check,
  Building2,
  BookOpen,
  Users,
  GraduationCap,
  ShieldCheck,
  Settings,
  Lock,
  LogOut,
  RefreshCw,
  ChevronDown,
} from 'lucide-react'

interface IdentitySwitcherProps {
  userEmail?: string
  userName?: string
  identities: UserIdentity[]
  activeIdentityId?: string
  onSignOut?: () => void
}

export function IdentitySwitcher({
  userEmail = 'user@academy.edu',
  userName = 'User',
  identities = [],
  activeIdentityId,
  onSignOut,
}: IdentitySwitcherProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'R' || e.key === 'r')) {
        e.preventDefault()
        if (identities.length > 1) {
          const currentIndex = identities.findIndex((i) => i.id === activeIdentityId)
          const nextIndex = (currentIndex + 1) % identities.length
          const nextIdentity = identities[nextIndex]
          if (nextIdentity) {
            handleSwitch(nextIdentity.id)
          }
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [identities, activeIdentityId])

  const handleSwitch = async (identityId: string) => {
    if (identityId === activeIdentityId) return
    setLoadingId(identityId)
    try {
      const res = await switchIdentityAction(identityId)
      if (res.success && res.redirectTo) {
        setIsOpen(false)
        router.push(res.redirectTo)
      }
    } catch (err) {
      console.error('Failed to switch identity:', err)
    } finally {
      setLoadingId(null)
    }
  }

  const currentIdentity = identities.find((i) => i.id === activeIdentityId) || identities[0]

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative h-10 w-10 rounded-full bg-slate-800 border border-slate-700 p-0 hover:bg-slate-700 transition-colors flex items-center justify-center focus:outline-none"
      >
        <div className="w-full h-full rounded-full flex items-center justify-center font-black text-sm text-blue-400 uppercase">
          {userName?.[0] || 'U'}
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-800 text-white rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="p-3 pb-2 border-b border-slate-800">
            <p className="text-sm font-black text-white leading-none">{userName}</p>
            <p className="text-xs font-medium text-slate-400 truncate mt-1">{userEmail}</p>
          </div>

          {identities.length > 0 && (
            <div className="py-1 space-y-1">
              <p className="text-[10px] font-black uppercase text-slate-500 px-2.5 py-1 tracking-wider">
                Switch Role / School Identity
              </p>
              {identities.map((identity) => {
                const isActive = identity.id === (activeIdentityId || currentIdentity?.id)
                const isLoading = loadingId === identity.id

                return (
                  <button
                    key={identity.id}
                    onClick={() => handleSwitch(identity.id)}
                    className={`w-full text-left flex items-center justify-between p-2.5 rounded-xl font-medium text-xs transition-colors ${
                      isActive ? 'bg-blue-600/20 text-blue-400 font-bold' : 'hover:bg-slate-800/80 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                        {identity.role === 'SUPER_ADMIN' ? (
                          <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                        ) : identity.role === 'SCHOOL_ADMIN' ? (
                          <Building2 className="w-3.5 h-3.5 text-amber-400" />
                        ) : identity.role === 'TEACHER' ? (
                          <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                        ) : identity.role === 'PARENT' ? (
                          <Users className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <GraduationCap className="w-3.5 h-3.5 text-orange-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-bold leading-none">{identity.role.replace('_', ' ')}</p>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">{identity.schoolName || 'Academy'}</p>
                      </div>
                    </div>

                    {isActive && <Check className="w-4 h-4 text-blue-400 shrink-0" />}
                    {isLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400 shrink-0" />}
                  </button>
                )
              })}
            </div>
          )}

          <div className="border-t border-slate-800 pt-1">
            <button
              onClick={() => router.push('/dashboard/parent/settings/profile')}
              className="w-full text-left p-2.5 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800/80 flex items-center gap-2"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Account Settings</span>
            </button>

            <button
              onClick={() => router.push('/auth/forgot-password')}
              className="w-full text-left p-2.5 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800/80 flex items-center gap-2"
            >
              <Lock className="w-4 h-4 text-slate-400" />
              <span>Change Password</span>
            </button>

            <button
              onClick={async () => {
                if (onSignOut) {
                  onSignOut()
                } else {
                  const { createClient } = await import('@/utils/supabase/client')
                  const supabase = createClient()
                  await supabase.auth.signOut()
                  window.location.href = '/auth/signin'
                }
              }}
              className="w-full text-left p-2.5 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 mt-1"
            >
              <LogOut className="w-4 h-4 text-rose-400" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
