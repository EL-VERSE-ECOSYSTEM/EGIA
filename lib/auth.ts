import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { db } from './db'
import { userRole, user as userTable } from './db/schema'
import { eq } from 'drizzle-orm'

export const auth = {
  getSession: async () => {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return null
    }

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return null
    }

    const metadataRole = user.user_metadata?.role || null
    const roleRecord = metadataRole ? null : await db.select()
      .from(userRole)
      .where(eq(userRole.userId, user.id))
      .limit(1)

    const finalRole = (metadataRole || roleRecord?.[0]?.role || null)?.toUpperCase()

    return {
      ...session,
      user: {
        ...user,
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.full_name || user.user_metadata?.name || '',
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

    const metadataRole = user.user_metadata?.role || null
    const roleRecord = metadataRole ? null : await db.select()
      .from(userRole)
      .where(eq(userRole.userId, user.id))
      .limit(1)

    const finalRole = (metadataRole || roleRecord?.[0]?.role || null)?.toUpperCase()

    return {
      ...user,
      role: finalRole
    }
  }
}
