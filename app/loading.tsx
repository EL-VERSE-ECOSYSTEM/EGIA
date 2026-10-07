'use client'

import React from 'react'
import Image from 'next/image'
import { SVGLoader } from '@/components/ui/svg-loader'

export default function GlobalLoading() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]/80 dark:bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center gap-6">
        <div className="relative p-2 rounded-3xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 shadow-2xl shadow-amber-500/20">
          <div className="absolute inset-0 rounded-3xl bg-amber-500/20 blur-xl animate-pulse" />
          <Image
            src="/logo.png"
            alt="EL LEARNERS APP Logo"
            width={80}
            height={80}
            className="relative w-20 h-20 object-contain rounded-2xl animate-pulse"
            priority
          />
        </div>
        <div className="text-center space-y-1">
          <span className="font-black text-2xl tracking-tight text-slate-900 dark:text-white uppercase">
            EL LEARNERS <span className="text-amber-600 dark:text-amber-500">APP</span>
          </span>
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Modern School Management & Portal
          </p>
        </div>
        <SVGLoader className="w-10 h-10 text-amber-600 dark:text-amber-500" />
      </div>
    </div>
  )
}
