'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export function WaitingRoomRefresh({ email }: { email: string }) {
  const router = useRouter()
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`registration-status:${email.toLowerCase()}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'school_registration_application',
        filter: `applicant_email=eq.${email.toLowerCase()}`,
      }, () => router.refresh())
      .subscribe()
    const timer = window.setInterval(() => router.refresh(), 8000)
    return () => {
      window.clearInterval(timer)
      void supabase.removeChannel(channel)
    }
  }, [email, router])
  return null
}
