"use client"

import { useEffect } from "react"

export function TimeThemeProvider() {
  useEffect(() => {
    const updateThemeByTime = () => {
      const currentHour = new Date().getHours()
      // Night is from 7:00 PM (19:00) to 7:00 AM
      const isNight = currentHour < 7 || currentHour >= 19

      const root = window.document.documentElement
      if (isNight) {
        root.classList.add("dark")
        root.style.colorScheme = "dark"
      } else {
        root.classList.remove("dark")
        root.style.colorScheme = "light"
      }
    }

    updateThemeByTime()
    const interval = setInterval(updateThemeByTime, 60000)
    return () => clearInterval(interval)
  }, [])

  return null
}
