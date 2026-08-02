import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { db } from './db'
import { userRole, user as userTable } from './db/schema'
import { eq } from 'drizzle-orm'

export const auth = {
  getSession: async () => {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error || !session) {
      return null
    }

    const roleRecord = await db.select()
      .from(userRole)
      .where(eq(userRole.userId, session.user.id))
      .limit(1)

    const finalRole = roleRecord[0]?.role || (session.user.user_metadata?.role || null)

    return {
      ...session,
      user: {
        ...session.user,
        id: session.user.id,
        email: session.user.email || '',
        name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
        role: finalRole
      }
    }
  },
  getUser: async () => {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return null
    }

    const roleRecord = await db.select()
      .from(userRole)
      .where(eq(userRole.userId, user.id))
      .limit(1)

    const finalRole = roleRecord[0]?.role || (user.user_metadata?.role || null)

    return {
      ...user,
      role: finalRole
    }
  }
}
