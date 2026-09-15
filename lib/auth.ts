import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { db } from './db'
import { userRole, user as userTable } from './db/schema'
import { eq, or } from 'drizzle-orm'

async function getSessionImpl() {
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

  const roleRecord = await db.select()
    .from(userRole)
    .where(eq(userRole.userId, user.id))
    .limit(1)

  const metadataRole = user.user_metadata?.role || null

  const dbUser = await db.select({ schoolId: userTable.schoolId })
    .from(userTable)
    .where(or(eq(userTable.id, user.id), eq(userTable.email, user.email || '')))
    .limit(1)

  const finalRole = (roleRecord?.[0]?.role || metadataRole || null)?.toUpperCase()
  const schoolId = dbUser?.[0]?.schoolId || user.user_metadata?.school_id || null

  return {
    ...session,
    user: {
      ...user,
      id: user.id,
      email: user.email || '',
      name: user.user_metadata?.full_name || user.user_metadata?.name || '',
      role: finalRole,
      schoolId,
    }
  }
}

async function getUserImpl() {
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

  const metadataRole = user.user_metadata?.role || null

  const dbUser = await db.select({ schoolId: userTable.schoolId })
    .from(userTable)
    .where(or(eq(userTable.id, user.id), eq(userTable.email, user.email || '')))
    .limit(1)

  const finalRole = (roleRecord?.[0]?.role || metadataRole || null)?.toUpperCase()
  const schoolId = dbUser?.[0]?.schoolId || user.user_metadata?.school_id || null

  return {
    ...user,
    role: finalRole,
    schoolId,
  }
}

export const auth = Object.assign(
  async () => getSessionImpl(),
  {
    getSession: getSessionImpl,
    getUser: getUserImpl
  }
)
