'use client'

import React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GraduationCap, Users, Laptop, Briefcase, ArrowRight, ClipboardCheck } from 'lucide-react'

export default function SignUpPage() {
  const options = [
    {
      role: 'STUDENT_SESSION',
      title: 'Student/Pupil Session Registration',
      desc: 'Register for the academic session and continue to the ₦2,000 Korapay checkout.',
      icon: Laptop,
      color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-100', btnBg: 'bg-blue-600 hover:bg-blue-700',
      link: '/auth/signup/student-registration'
    },
    {
      role: 'PARENT',
      title: 'Parent Registration',
      desc: "Monitor your child's progress, track attendance, and pay fees.",
      icon: Users,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-100',
      btnBg: 'bg-emerald-600 hover:bg-emerald-700',
      link: '/auth/signup/parent'
    },
    {
      role: 'PARENT_TEACHER',
      title: 'Parent who is a Teacher Registration',
      desc: 'Onboard as a Parent who is also an educator/staff member of EL GOODNEWS ACADEMY.',
      icon: Briefcase,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-100',
      btnBg: 'bg-orange-600 hover:bg-orange-700',
      link: '/auth/signup/parent-teacher'
    },
    {
      role: 'TEACHER',
      title: 'Staff Registration',
      desc: 'Register as an instructor using your staff verification code.',
      icon: ClipboardCheck,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-100',
      btnBg: 'bg-purple-600 hover:bg-purple-700',
      link: '/auth/signup/teacher'
    }
  ]

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 py-16">
      <div className="mb-10 flex items-center gap-2">
        <div className="bg-amber-600 p-2 rounded-lg">
          <GraduationCap className="text-white w-6 h-6" />
        </div>
        <span className="font-black text-xl tracking-tight text-slate-900">EL GOODNEWS <span className="text-amber-600">ACADEMY</span></span>
      </div>

      <div className="max-w-4xl w-full text-center mb-12">
        <h1 className="text-5xl font-black text-slate-900 tracking-tighter">Create Your Account</h1>
        <p className="text-slate-500 text-lg font-medium mt-2">
          Select your registration path to get started with the academy portal
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-7xl w-full px-4">
        {options.map((opt) => {
          const Icon = opt.icon
          return (
            <Card key={opt.role} className="border-none shadow-xl shadow-slate-100 rounded-[2.5rem] overflow-hidden bg-white flex flex-col h-full group hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
              <div className={`h-2 ${opt.btnBg.split(' ')[0]} w-full`} />
              <CardHeader className="text-center pt-8">
                <div className={`mx-auto ${opt.bgColor} p-4 rounded-2xl w-fit mb-4 group-hover:scale-110 transition-transform duration-500`}>
                  <Icon className={`w-8 h-8 ${opt.color}`} />
                </div>
                <CardTitle className="text-xl font-black text-slate-900 leading-tight">{opt.title}</CardTitle>
                <CardDescription className="text-slate-500 font-bold mt-2 leading-relaxed min-h-[5rem] text-xs">
                  {opt.desc}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-8 mt-auto">
                <Link href={opt.link} className="block w-full">
                  <Button className={`w-full ${opt.btnBg} text-white h-11 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all`}>
                    Register <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="mt-12 text-center text-sm font-bold text-slate-400">
        Already have an account? <Link href="/auth/signin" className="text-amber-600 font-black hover:underline ml-1">Sign In</Link>
      </div>

      <p className="mt-16 text-xs text-slate-400 font-bold uppercase tracking-[0.2em]">
        built by ELCODERS by E.V.E
      </p>
    </div>
  )
}
