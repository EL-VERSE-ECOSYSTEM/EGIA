"use client"

import React, { useState, useEffect } from "react"
import { Sun, Moon, Clock } from "lucide-react"
import { applyTheme } from "@/components/TimeThemeProvider"

export function ThemeToggle() {
  const [mode, setMode] = useState<'auto' | 'light' | 'dark'>('auto')

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = (localStorage.getItem("app_theme_mode") as 'auto' | 'light' | 'dark') || 'auto'
      setMode(saved)
    }
  }, [])

  const cycleTheme = () => {
    const nextMode = mode === 'auto' ? 'dark' : mode === 'dark' ? 'light' : 'auto'
    setMode(nextMode)
    if (typeof window !== "undefined") {
      localStorage.setItem("app_theme_mode", nextMode)
      applyTheme(nextMode)
      window.dispatchEvent(new Event("app_theme_changed"))
    }
  }

  return (
    <button
      type="button"
      onClick={cycleTheme}
      title={`Theme: ${mode === 'auto' ? 'Auto (Schedule 7PM-7AM)' : mode === 'dark' ? 'Dark Mode' : 'Light Mode'}`}
      className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-amber-400 hover:scale-105 active:scale-95 transition-all shadow-md border border-slate-200/80 dark:border-slate-700 flex items-center gap-1.5 font-black text-xs uppercase"
    >
      {mode === 'dark' ? (
        <>
          <Moon className="w-4 h-4 text-amber-400 fill-amber-400/20" />
          <span className="hidden sm:inline">Dark</span>
        </>
      ) : mode === 'light' ? (
        <>
          <Sun className="w-4 h-4 text-amber-500" />
          <span className="hidden sm:inline">Light</span>
        </>
      ) : (
        <>
          <Clock className="w-4 h-4 text-blue-400" />
          <span className="hidden sm:inline">Auto</span>
        </>
      )}
    </button>
  )
}
