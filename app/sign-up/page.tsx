'use client'

import { NeonAuthUI } from '@neondatabase/neon-js/react'

export default function SignUpPage() {
  return (
    <main className="min-h-svh bg-background flex items-center justify-center px-4">
      <NeonAuthUI mode="signup" />
    </main>
  )
}
