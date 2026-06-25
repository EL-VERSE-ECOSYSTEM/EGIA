import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { db } from './db'
import { userRole } from './db/schema'
import { eq } from 'drizzle-orm'

export const auth = {
  getSession: async () => {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error || !session) return null

    // Get role from our DB
    const roleRecord = await db.select()
      .from(userRole)
      .where(eq(userRole.userId, session.user.id))
      .limit(1)

    return {
      ...session,
      user: {
        ...session.user,
        id: session.user.id,
        email: session.user.email || '',
        name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
        role: roleRecord[0]?.role || null
      }
    }
  },
  getUser: async () => {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const roleRecord = await db.select()
      .from(userRole)
      .where(eq(userRole.userId, user.id))
      .limit(1)

    return {
      ...user,
      role: roleRecord[0]?.role || null
    }
  }
}
