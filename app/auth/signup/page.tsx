'use client'

import React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { GraduationCap, Users, Laptop, ClipboardCheck, Building2, ArrowRight } from 'lucide-react'

export default function SignUpPage() {
  const options = [
    {
      role: 'STUDENT',
      title: 'Student / Pupil',
      desc: 'Register under your school using your School Registration Code (Primary 3 to SSS3).',
      icon: Laptop,
      themeColor: '#F97316',
      colorText: 'text-[#F97316]',
      bgBadge: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      btnBg: 'bg-[#F97316] hover:bg-orange-600 text-white',
      shadow: 'shadow-[0_20px_50px_rgba(249,115,22,0.2)]',
      link: '/auth/signup/student-registration'
    },
    {
      role: 'PARENT',
      title: 'Parent Portal',
      desc: 'Link children via School Registration Code, view report cards, attendance, and adult education.',
      icon: Users,
      themeColor: '#4F46E5',
      colorText: 'text-[#4F46E5]',
      bgBadge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      btnBg: 'bg-[#4F46E5] hover:bg-indigo-700 text-white',
      shadow: 'shadow-[0_20px_50px_rgba(79,70,229,0.2)]',
      link: '/auth/signup/parent'
    },
    {
      role: 'TEACHER',
      title: 'Educator / Teacher',
      desc: 'Register as an educator linked to your school using your School Registration Code.',
      icon: ClipboardCheck,
      themeColor: '#0D9488',
      colorText: 'text-[#0D9488]',
      bgBadge: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
      btnBg: 'bg-[#0D9488] hover:bg-teal-700 text-white',
      shadow: 'shadow-[0_20px_50px_rgba(13,148,136,0.2)]',
      link: '/auth/signup/teacher'
    },
    {
      role: 'SCHOOL',
      title: 'Institutional School',
      desc: 'Register a new school (NGN 30,000 fee) and generate your unique School Registration Code.',
      icon: Building2,
      themeColor: '#1E3A8A',
      colorText: 'text-blue-400',
      bgBadge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      btnBg: 'bg-[#1E3A8A] hover:bg-blue-800 text-white',
      shadow: 'shadow-[0_20px_50px_rgba(30,58,138,0.2)]',
      link: '/school-registration'
    }
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 sm:p-8 py-16 relative overflow-hidden">
      {/* Dynamic Background Lights */}
      <div className="absolute top-10 left-1/4 w-96 h-96 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="mb-8 flex items-center gap-3 relative z-10">
        <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-xl border border-white/20 shadow-xl">
          <GraduationCap className="text-white w-7 h-7" />
        </div>
        <div>
          <span className="font-black text-2xl tracking-tight text-white uppercase">
            EL <span className="text-orange-400">LEARNERS APP</span>
          </span>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registration Portal</p>
        </div>
      </div>

      <div className="max-w-3xl w-full text-center mb-10 space-y-3 relative z-10">
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">Select Account Type</h1>
        <p className="text-slate-400 text-sm sm:text-base font-bold max-w-xl mx-auto">
          Choose your role below to start setting up your EL LEARNERS account.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-8 max-w-7xl w-full px-4 relative z-10">
        {options.map((opt) => {
          const Icon = opt.icon
          return (
            <Card
              key={opt.role}
              className={`border border-white/10 ${opt.shadow} rounded-[2.5rem] overflow-hidden bg-slate-900/90 backdrop-blur-2xl text-white flex flex-col h-full transform transition-all duration-500 hover:-translate-y-3 hover:scale-[1.02] border-t border-l border-white/20 group`}
            >
              <div style={{ backgroundColor: opt.themeColor }} className="h-2 w-full" />
              <CardHeader className="text-center pt-8 space-y-3">
                <div className={`mx-auto p-4 rounded-2xl w-fit ${opt.bgBadge} border shadow-lg group-hover:rotate-6 transition-transform duration-500`}>
                  <Icon className="w-8 h-8" />
                </div>
                <CardTitle className="text-xl font-black text-white leading-tight">{opt.title}</CardTitle>
                <CardDescription className="text-slate-400 font-bold leading-relaxed min-h-[4.5rem] text-xs">
                  {opt.desc}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-8 mt-auto">
                <Link
                  href={opt.link}
                  className={`block w-full ${opt.btnBg} h-12 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-xl active:scale-95 text-center`}
                >
                  GET STARTED <ArrowRight className="w-4 h-4" />
                </Link>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="mt-12 text-center text-xs font-bold text-slate-400 relative z-10 space-y-3">
        <p>
          Already registered? <Link href="/auth/signin" className="text-orange-400 font-black hover:underline ml-1">Sign In Now</Link>
        </p>
        <div className="flex flex-wrap justify-center gap-4 text-[11px] font-semibold text-slate-400">
          <Link href="/terms" className="hover:text-white transition-colors">
            Terms & Conditions
          </Link>
          <span>•</span>
          <Link href="/privacy" className="hover:text-white transition-colors">
            Privacy Policy
          </Link>
          <span>•</span>
          <Link href="/refund-policy" className="hover:text-white transition-colors">
            Refund Policy
          </Link>
          <span>•</span>
          <Link href="/cookies" className="hover:text-white transition-colors">
            Cookie Policy
          </Link>
          <span>•</span>
          <Link href="/data-deletion" className="hover:text-white transition-colors">
            Data Deletion
          </Link>
        </div>
      </div>

      <p className="mt-12 text-[10px] text-slate-500 font-black uppercase tracking-[0.25em] relative z-10">
        EL LEARNERS APP • Multi-Tenant Educational Platform
      </p>
    </div>
  )
}
