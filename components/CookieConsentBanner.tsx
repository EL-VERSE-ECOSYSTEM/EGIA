'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Cookie, Shield, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function CookieConsentBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('el_cookie_consent')
    if (!consent) {
      setShow(true)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('el_cookie_consent', 'accepted')
    setShow(false)
  }

  const handleDecline = () => {
    localStorage.setItem('el_cookie_consent', 'declined')
    setShow(false)
  }

  if (!show) return null

  return (
    <aside
      aria-label="Cookie Consent Banner"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-[9999] bg-slate-900/95 backdrop-blur-xl border border-slate-800 text-white p-5 rounded-3xl shadow-2xl animate-in slide-in-from-bottom-5 duration-300"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
            <Cookie className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              Cookie Consent & Privacy
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              We use essential cookies to secure authentication sessions, enable real-time updates, and improve your user experience. Learn more in our{' '}
              <Link href="/cookies" className="text-amber-400 font-semibold hover:underline">
                Cookie Policy
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-amber-400 font-semibold hover:underline">
                Privacy Policy
              </Link>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Button
            onClick={handleAccept}
            size="sm"
            className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs h-9 flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Accept All</span>
          </Button>
          <Button
            onClick={handleDecline}
            size="sm"
            variant="outline"
            className="flex-1 border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white font-bold rounded-xl text-xs h-9 flex items-center justify-center gap-1.5"
          >
            <X className="w-4 h-4" />
            <span>Essential Only</span>
          </Button>
        </div>
      </div>
    </aside>
  )
}
