"use client"

import { useEffect, useState } from "react"

export function applyTheme(mode: 'auto' | 'light' | 'dark') {
  if (typeof window === "undefined") return

  const root = window.document.documentElement
  let isDark = false

  if (mode === 'dark') {
    isDark = true
  } else if (mode === 'light') {
    isDark = false
  } else {
    // Auto mode based on schedule (7:00 PM to 7:00 AM)
    const currentHour = new Date().getHours()
    isDark = currentHour < 7 || currentHour >= 19
  }

  if (isDark) {
    root.classList.add("dark")
    root.style.colorScheme = "dark"
  } else {
    root.classList.remove("dark")
    root.style.colorScheme = "light"
  }
}

export function TimeThemeProvider() {
  useEffect(() => {
    const syncTheme = () => {
      const savedMode = (localStorage.getItem("app_theme_mode") as 'auto' | 'light' | 'dark') || "auto"
      applyTheme(savedMode)
    }

    syncTheme()

    const handleStorageChange = () => syncTheme()
    window.addEventListener("app_theme_changed", handleStorageChange)

    // Check every minute for auto-schedule time updates
    const interval = setInterval(() => {
      const savedMode = (localStorage.getItem("app_theme_mode") as 'auto' | 'light' | 'dark') || "auto"
      if (savedMode === "auto") {
        applyTheme("auto")
      }
    }, 60000)

    return () => {
      window.removeEventListener("app_theme_changed", handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  return null
}
