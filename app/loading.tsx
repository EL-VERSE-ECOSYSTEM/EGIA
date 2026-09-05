'use client'

import React from 'react'
import { SVGLoader } from '@/components/ui/svg-loader'
import { GraduationCap } from 'lucide-react'

export default function GlobalLoading() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]/50 backdrop-blur-md flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center gap-6 animate-pulse">
        <div className="bg-orange-600 p-3 rounded-2xl shadow-xl shadow-orange-200">
          <GraduationCap className="text-white w-10 h-10" />
        </div>
        <div className="text-center space-y-1">
          <span className="font-black text-2xl tracking-tight text-slate-900">EL LEARNERS <span className="text-orange-600">APP</span></span>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Empowering Educational Excellence</p>
        </div>
        <SVGLoader className="w-10 h-10 text-orange-600" />
      </div>
    </div>
  )
}
