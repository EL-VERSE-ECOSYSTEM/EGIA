'use client'

import React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GraduationCap, Users, Laptop, Briefcase, ArrowRight, ClipboardCheck, Building2 } from 'lucide-react'

export default function SignUpPage() {
  const options = [
    {
      role: 'STUDENT_SESSION',
      title: 'Student / Pupil Registration',
      desc: 'Register under your school using your School Registration Code (PRIMARY 3 TO SSS3).',
      icon: Laptop,
      color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-100', btnBg: 'bg-blue-600 hover:bg-blue-700',
      link: '/auth/signup/student-registration'
    },
    {
      role: 'PARENT',
      title: 'Parent Registration',
      desc: "Register using your School Registration Code, monitor wards, track attendance, and access Adult Education.",
      icon: Users,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-100',
      btnBg: 'bg-emerald-600 hover:bg-emerald-700',
      link: '/auth/signup/parent'
    },
    {
      role: 'TEACHER',
      title: 'Staff / Teacher Registration',
      desc: 'Register as an educator linked to your school using your School Registration Code.',
      icon: ClipboardCheck,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-100',
      btnBg: 'bg-purple-600 hover:bg-purple-700',
      link: '/auth/signup/teacher'
    },
    {
      role: 'SCHOOL',
      title: 'Institutional School Registration',
      desc: 'Register a new school, pay NGN 30,000 subscription, and obtain your School Registration Code.',
      icon: Building2,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-950/40',
      borderColor: 'border-emerald-800',
      btnBg: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:from-emerald-400 hover:to-teal-400',
      link: '/school-registration'
    }
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 py-16">
      <div className="mb-10 flex items-center gap-2">
        <div className="bg-gradient-to-tr from-emerald-500 to-teal-400 p-2.5 rounded-xl shadow-lg shadow-emerald-500/20">
          <GraduationCap className="text-slate-950 w-6 h-6" />
        </div>
        <span className="font-black text-2xl tracking-tight text-white uppercase">EL <span className="text-emerald-400">LEARN APP</span></span>
      </div>

      <div className="max-w-4xl w-full text-center mb-12">
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tighter">Create Your Account</h1>
        <p className="text-slate-400 text-base font-medium mt-2">
          Select your registration portal to get started on EL LEARNERS App
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 max-w-7xl w-full px-4">
        {options.map((opt) => {
          const Icon = opt.icon
          return (
            <Card key={opt.role} className="border border-slate-800 shadow-2xl rounded-[2.5rem] overflow-hidden bg-slate-900 text-white flex flex-col h-full group hover:border-emerald-500/50 hover:-translate-y-2 transition-all duration-500">
              <div className={`h-2 ${opt.btnBg.split(' ')[0]} w-full`} />
              <CardHeader className="text-center pt-8">
                <div className={`mx-auto ${opt.bgColor} p-4 rounded-2xl w-fit mb-4 group-hover:scale-110 transition-transform duration-500`}>
                  <Icon className={`w-8 h-8 ${opt.color}`} />
                </div>
                <CardTitle className="text-xl font-black text-white leading-tight">{opt.title}</CardTitle>
                <CardDescription className="text-slate-400 font-bold mt-2 leading-relaxed min-h-[5rem] text-xs">
                  {opt.desc}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-8 mt-auto">
                <Link href={opt.link} className="block w-full">
                  <Button className={`w-full ${opt.btnBg} h-11 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-lg`}>
                    Register <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="mt-12 text-center text-sm font-bold text-slate-400">
        Already have an account? <Link href="/auth/signin" className="text-emerald-400 font-black hover:underline ml-1">Sign In</Link>
      </div>

      <p className="mt-16 text-xs text-slate-500 font-bold uppercase tracking-[0.2em]">
        EL LEARNERS App • Premium Multi-Tenant School Ecosystem
      </p>
    </div>
  )
}
