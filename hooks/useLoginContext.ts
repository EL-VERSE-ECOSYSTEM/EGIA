'use client'

import { useState } from 'react'
import { UserIdentity, LoginContext } from '@/lib/auth/resolveIdentities'
import { switchIdentityAction } from '@/app/auth/signin/actions'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export function useLoginContext() {
  const router = useRouter()
  const [context, setContext] = useState<LoginContext | null>(null)
  const [activeIdentity, setActiveIdentity] = useState<UserIdentity | null>(null)
  const [loading, setLoading] = useState(false)

  const switchIdentity = async (identityId: string) => {
    setLoading(true)
    try {
      const res = await switchIdentityAction(identityId)
      if (res.success && res.redirectTo) {
        if (res.identity) {
          setActiveIdentity(res.identity)
        }
        router.push(res.redirectTo)
      } else {
        toast.error(res.error || 'Unable to switch identity context. Please try again.')
      }
    } catch (err: any) {
      console.error('Identity switch error:', err)
      toast.error('Failed to switch accounts. Please check your network connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return {
    context,
    activeIdentity,
    switchIdentity,
    loading,
  }
}
