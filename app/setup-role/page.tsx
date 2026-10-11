'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Users, School, UserCheck, Sparkles, GraduationCap, ArrowRight } from 'lucide-react'

export default function SetupRolePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const roles = [
    {
      id: 'student',
      name: 'Student / Pupil',
      description: 'Access your classes, CBT assessments, report cards, and digital library.',
      icon: BookOpen,
      themeColor: '#F97316',
      btnBg: 'bg-[#F97316] hover:bg-orange-600',
      shadow: 'shadow-[0_20px_50px_rgba(249,115,22,0.2)]',
      badge: 'bg-orange-500/20 text-orange-300 border-orange-500/30'
    },
    {
      id: 'teacher',
      name: 'Educator / Teacher',
      description: 'Manage classes, record attendance, upload lesson notes, and conduct CBT exams.',
      icon: Users,
      themeColor: '#0D9488',
      btnBg: 'bg-[#0D9488] hover:bg-teal-700',
      shadow: 'shadow-[0_20px_50px_rgba(13,148,136,0.2)]',
      badge: 'bg-teal-500/20 text-teal-300 border-teal-500/30'
    },
    {
      id: 'parent',
      name: 'Parent / Guardian',
      description: 'Monitor child progress, review term results, make payments, and access Adult Education.',
      icon: UserCheck,
      themeColor: '#4F46E5',
      btnBg: 'bg-[#4F46E5] hover:bg-indigo-700',
      shadow: 'shadow-[0_20px_50px_rgba(79,70,229,0.2)]',
      badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
    },
  ]

  const handleSelectRole = (roleId: string) => {
    setLoading(true)
    router.push(`/setup-role/${roleId}`)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 relative overflow-hidden perspective-[1200px]">
      {/* Glow Lights */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-5xl relative z-10">
        <div className="mb-12 text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-black uppercase tracking-widest text-orange-400">
            <GraduationCap className="w-4 h-4 text-orange-400" /> EL LEARNERS APP
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">Select Your Account Profile</h1>
          <p className="text-slate-400 font-bold text-sm max-w-md mx-auto">
            Choose your role to configure customized 3D dashboard environments
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {roles.map((role) => {
            const Icon = role.icon
            return (
              <Card
                key={role.id}
                className={`border border-white/10 ${role.shadow} rounded-[2.5rem] bg-slate-900/90 backdrop-blur-2xl text-white transform transition-all duration-500 hover:-translate-y-2 hover:scale-[1.01] border-t border-l border-white/20 overflow-hidden flex flex-col justify-between`}
              >
                <div style={{ backgroundColor: role.themeColor }} className="h-2 w-full" />
                <CardHeader className="p-8 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <CardTitle className="text-2xl font-black text-white">{role.name}</CardTitle>
                      <CardDescription className="text-slate-400 font-bold text-xs leading-relaxed pt-1">
                        {role.description}
                      </CardDescription>
                    </div>
                    <div className={`p-3.5 rounded-2xl border ${role.badge} shrink-0`}>
                      <Icon size={28} />
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-8 pt-4">
                  <Button
                    onClick={() => handleSelectRole(role.id)}
                    disabled={loading}
                    className={`w-full ${role.btnBg} text-white font-black h-12 rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95`}
                  >
                    Select {role.name} <ArrowRight className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <p className="mt-12 text-center text-xs font-bold text-slate-500 uppercase tracking-widest">
          EL LEARNERS APP • Standardized Role Portal
        </p>
      </div>
    </main>
  )
}
