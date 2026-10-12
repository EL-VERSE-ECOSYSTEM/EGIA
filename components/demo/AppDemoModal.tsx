'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DEMO_ROLES_DATA, DemoRole } from '@/lib/demo-data'
import {
  Crown,
  Building2,
  GraduationCap,
  Users,
  ShieldCheck,
  PlayCircle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  X
} from 'lucide-react'

export interface AppDemoModalProps {
  isOpen: boolean
  onClose: () => void
}

const ROLE_ICONS: Record<string, any> = {
  Crown,
  Building2,
  GraduationCap,
  Users,
  ShieldCheck,
}

export function AppDemoModal({ isOpen, onClose }: AppDemoModalProps) {
  const [activeRole, setActiveRole] = useState<DemoRole>('superadmin')

  if (!isOpen) return null

  const activeData = DEMO_ROLES_DATA[activeRole]
  const IconComponent = ROLE_ICONS[activeData.iconName] || Crown

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-950 text-white border border-slate-800 rounded-3xl shadow-2xl p-0 font-sans">
        {/* Header */}
        <div className="p-6 sm:p-8 border-b border-slate-800/80 bg-slate-900/80 sticky top-0 z-20 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-400">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  EL LEARNERS APP Interactive Demo
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 font-bold mt-0.5">
                  Explore how the complete digital education platform works for every user role.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              type="button"
              className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Role Switcher Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 mt-6 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800/80">
            {(Object.keys(DEMO_ROLES_DATA) as DemoRole[]).map((role) => {
              const roleInfo = DEMO_ROLES_DATA[role]
              const RoleIcon = ROLE_ICONS[roleInfo.iconName] || Crown
              const isActive = activeRole === role

              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => setActiveRole(role)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-lg shadow-amber-600/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                  }`}
                >
                  <RoleIcon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{roleInfo.title.split(' ')[0]}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-8">
          {/* Banner Spotlight */}
          <div className="relative rounded-3xl overflow-hidden border border-slate-800 h-48 sm:h-64 shadow-2xl group">
            <img
              src={activeData.bannerImage}
              alt={activeData.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent p-6 sm:p-8 flex flex-col justify-end">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-700 text-slate-200 text-xs font-black uppercase tracking-widest w-fit mb-2">
                <IconComponent className="w-3.5 h-3.5 text-amber-400" />
                <span>{activeData.badge}</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{activeData.title}</h3>
              <p className="text-xs sm:text-sm text-slate-300 font-bold max-w-2xl">{activeData.subtitle}</p>
            </div>
          </div>

          {/* Overview Summary */}
          <div className="p-5 bg-slate-900/80 border border-slate-800/80 rounded-2xl">
            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
              {activeData.summary}
            </p>
          </div>

          {/* Key Role Metrics */}
          {activeData.stats && (
            <div className="grid grid-cols-3 gap-3">
              {activeData.stats.map((stat, idx) => (
                <div key={idx} className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl text-center space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                  <p className="text-base sm:text-lg font-black text-amber-400">{stat.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Key Capabilities Grid */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Key Role Capabilities
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeData.keyFeatures.map((feature, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/60 flex items-start gap-3 text-xs font-bold text-slate-200"
                >
                  <div className="p-1 bg-amber-500/10 text-amber-400 rounded-lg shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sample Interactive Workflows */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-blue-400 flex items-center gap-2">
              <PlayCircle className="w-4 h-4" /> Step-by-Step Interactive Workflows
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {activeData.workflows.map((flow, idx) => (
                <Card key={idx} className="bg-slate-900/80 border-slate-800 rounded-2xl overflow-hidden hover:border-amber-500/30 transition">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 inline-block">
                        {flow.tag}
                      </span>
                    </div>
                    <h5 className="text-xs font-black text-white">{flow.name}</h5>
                    <p className="text-[11px] text-slate-400 font-medium leading-relaxed">{flow.description}</p>
                    {flow.step && (
                      <p className="text-[10px] text-amber-400 font-bold bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
                        {flow.step}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Call to Action Footer */}
          <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <p className="text-xs font-bold text-white">Ready to experience {activeData.title} live?</p>
              <p className="text-[11px] text-slate-400 font-medium">Sign in to test this portal or register a new school/user account.</p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                type="button"
                onClick={onClose}
                variant="ghost"
                className="text-slate-400 hover:text-white font-bold text-xs"
              >
                Close Tour
              </Button>
              <Link href={activeData.loginLink} onClick={onClose} className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto bg-amber-600 hover:bg-amber-500 text-white font-black text-xs h-11 rounded-xl px-6 shadow-lg shadow-amber-600/20 flex items-center gap-2">
                  <span>ACCESS PORTAL LOGIN</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
