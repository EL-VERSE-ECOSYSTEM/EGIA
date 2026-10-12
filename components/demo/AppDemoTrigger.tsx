'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { PlayCircle, Sparkles } from 'lucide-react'
import { AppDemoModal } from './AppDemoModal'

export interface AppDemoTriggerProps {
  variant?: 'header' | 'hero' | 'floating'
  className?: string
}

export function AppDemoTrigger({ variant = 'hero', className = '' }: AppDemoTriggerProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (variant === 'header') {
    return (
      <>
        <Button
          type="button"
          onClick={() => setIsOpen(true)}
          variant="outline"
          className={`border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 font-black rounded-xl text-xs flex items-center gap-1.5 ${className}`}
        >
          <PlayCircle className="w-3.5 h-3.5" />
          <span>APP DEMO</span>
        </Button>
        <AppDemoModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
      </>
    )
  }

  return (
    <>
      <Button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white h-12 sm:h-16 px-6 sm:px-10 rounded-2xl font-black text-base sm:text-lg shadow-xl flex items-center justify-center gap-2 group transition-all ${className}`}
      >
        <Sparkles className="w-5 h-5 text-amber-400 dark:text-slate-950 animate-pulse" />
        <span>EXPLORE APP DEMO</span>
        <PlayCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
      </Button>
      <AppDemoModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
