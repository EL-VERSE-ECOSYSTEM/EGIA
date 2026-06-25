import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export const auth = {
  getSession: async () => {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return null
    return {
      ...session,
      user: {
        ...session.user,
        id: session.user.id,
        email: session.user.email || '',
        name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || ''
      }
    }
  },
  getUser: async () => {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()
    return user
  }
}
