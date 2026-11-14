'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/utils/supabase/client'

const IDLE_TIMEOUT_MS = 150_000
const activityKey = (userId: string) => `el-learners:last-activity:${userId}`

export function SessionInactivityGuard() {
  useEffect(() => {
    const supabase = createClient()
    let activeUserId: string | null = null
    let logoutTimer: ReturnType<typeof setTimeout> | undefined
    let logoutInProgress = false
    let lastActivityAt = Date.now()

    const readLastActivity = (userId: string) => {
      try {
        const storedTimestamp = Number(window.localStorage.getItem(activityKey(userId)))
        return Number.isFinite(storedTimestamp) && storedTimestamp > 0
          ? Math.min(storedTimestamp, Date.now())
          : lastActivityAt
      } catch {
        return lastActivityAt
      }
    }

    const expireSession = () => {
      if (logoutInProgress) return
      logoutInProgress = true
      void supabase.auth.signOut().then(({ error }) => {
        if (error) console.error('Automatic sign-out failed:', error.message)
      }).catch((error: unknown) => {
        console.error('Automatic sign-out failed:', error)
      }).finally(() => {
        toast.warning('You have been signed out', {
          description: 'Your EL LEARNERS session ended after 150 seconds of inactivity.',
        })
        window.location.assign('/auth/signin?reason=idle')
      })
    }

    const scheduleLogout = () => {
      if (logoutTimer) clearTimeout(logoutTimer)
      if (!activeUserId || logoutInProgress) return

      const remaining = IDLE_TIMEOUT_MS - (Date.now() - readLastActivity(activeUserId))
      if (remaining <= 0) {
        expireSession()
        return
      }
      logoutTimer = setTimeout(scheduleLogout, remaining)
    }

    const initializeActivity = () => {
      if (!activeUserId) return
      lastActivityAt = Date.now()
      try {
        window.localStorage.setItem(activityKey(activeUserId), String(lastActivityAt))
      } catch {
        // The in-memory timeout remains active when browser storage is unavailable.
      }
      scheduleLogout()
    }

    const resumeActivity = () => {
      if (!activeUserId) return
      lastActivityAt = readLastActivity(activeUserId)
      scheduleLogout()
    }

    const recordActivity = () => {
      if (!activeUserId || logoutInProgress) return
      const now = Date.now()
      if (now - lastActivityAt < 1_000) return
      lastActivityAt = now
      try {
        window.localStorage.setItem(activityKey(activeUserId), String(now))
      } catch {
        // The in-memory timeout remains active when browser storage is unavailable.
      }
      scheduleLogout()
    }

    const onStorage = (event: StorageEvent) => {
      if (activeUserId && event.key === activityKey(activeUserId)) {
        lastActivityAt = Number(event.newValue) || lastActivityAt
        scheduleLogout()
      }
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') scheduleLogout()
    }

    const activityEvents: Array<keyof WindowEventMap> = [
      'pointerdown',
      'keydown',
      'mousemove',
      'scroll',
      'touchstart',
    ]
    for (const eventName of activityEvents) {
      window.addEventListener(eventName, recordActivity, { passive: true })
    }
    window.addEventListener('storage', onStorage)
    document.addEventListener('visibilitychange', onVisibilityChange)

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      const previousUserId = activeUserId
      activeUserId = session?.user.id || null
      if (!activeUserId) {
        logoutInProgress = false
        if (logoutTimer) clearTimeout(logoutTimer)
        return
      }
      if (event === 'SIGNED_IN' || previousUserId !== activeUserId) {
        logoutInProgress = false
        initializeActivity()
      } else if (event === 'INITIAL_SESSION') {
        resumeActivity()
      } else {
        scheduleLogout()
      }
    })

    void supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error('Could not check the current session for inactivity timeout:', error.message)
        return
      }
      if (data.session && !activeUserId) {
        activeUserId = data.session.user.id
        resumeActivity()
      }
    })

    return () => {
      if (logoutTimer) clearTimeout(logoutTimer)
      authListener.subscription.unsubscribe()
      for (const eventName of activityEvents) {
        window.removeEventListener(eventName, recordActivity)
      }
      window.removeEventListener('storage', onStorage)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])

  return null
}
