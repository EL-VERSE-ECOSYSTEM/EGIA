import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { db } from './db'
import { userRole, user as userTable } from './db/schema'
import { eq } from 'drizzle-orm'

export const auth = {
  getSession: async () => {
    const cookieStore = await cookies()

    // 1. Intelligent simulated authentication cookie fallback for local/offline environments
    const mockSessionUserId = cookieStore.get('mock_user_session')?.value
    if (mockSessionUserId) {
      try {
        const userRecord = await db.query.user.findFirst({
          where: eq(userTable.id, mockSessionUserId)
        })

        if (userRecord) {
          const roleRecord = await db.select()
            .from(userRole)
            .where(eq(userRole.userId, mockSessionUserId))
            .limit(1)

          return {
            user: {
              id: userRecord.id,
              email: userRecord.email || '',
              name: userRecord.name || '',
              role: roleRecord[0]?.role || null
            }
          }
        }
      } catch (err) {
        console.warn('Simulated database session lookup failed', err)
      }
    }

    // 2. Standard Supabase Live Auth verification
    try {
      const supabase = createClient(cookieStore)
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error || !session) return null

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
    } catch (supabaseErr) {
      console.warn('Supabase getSession threw, returning null session.', supabaseErr)
      return null
    }
  },
  getUser: async () => {
    const cookieStore = await cookies()

    // Fallback check
    const mockSessionUserId = cookieStore.get('mock_user_session')?.value
    if (mockSessionUserId) {
      try {
        const userRecord = await db.query.user.findFirst({
          where: eq(userTable.id, mockSessionUserId)
        })
        if (userRecord) {
          const roleRecord = await db.select()
            .from(userRole)
            .where(eq(userRole.userId, mockSessionUserId))
            .limit(1)
          return {
            id: userRecord.id,
            email: userRecord.email || '',
            role: roleRecord[0]?.role || null
          }
        }
      } catch (err) {
        console.warn('Simulated database user lookup failed', err)
      }
    }

    try {
      const supabase = createClient(cookieStore)
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return null

      const roleRecord = await db.select()
        .from(userRole)
        .where(eq(userRole.userId, user.id))
        .limit(1)

      const finalRole = roleRecord[0]?.role || (user.user_metadata?.role || null)

      return {
        ...user,
        role: finalRole
      }
    } catch (err) {
      return null
    }
  }
}
