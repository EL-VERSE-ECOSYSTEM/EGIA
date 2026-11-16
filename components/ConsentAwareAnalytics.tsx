'use client'

import { useEffect, useState } from 'react'
import { Analytics } from '@vercel/analytics/next'

export function ConsentAwareAnalytics() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const readConsent = () => {
      try {
        setEnabled(localStorage.getItem('el_cookie_consent') === 'accepted')
      } catch {
        setEnabled(false)
      }
    }
    const handleConsentChange = (event: Event) => {
      setEnabled((event as CustomEvent<string>).detail === 'accepted')
    }
    readConsent()
    window.addEventListener('el-cookie-consent-change', handleConsentChange)
    window.addEventListener('storage', readConsent)
    return () => {
      window.removeEventListener('el-cookie-consent-change', handleConsentChange)
      window.removeEventListener('storage', readConsent)
    }
  }, [])

  return enabled ? <Analytics /> : null
}
