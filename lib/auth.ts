import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { db } from './db'
import { userRole, user as userTable, schoolAdminRoles } from './db/schema'
import { eq } from 'drizzle-orm'

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

  // Resolve user role exclusively from database records
  const roleRecord = await db.select()
    .from(userRole)
    .where(eq(userRole.userId, user.id))
    .limit(1)

  // Also check schoolAdminRoles
  const adminRoleRec = await db.query.schoolAdminRoles.findFirst({
    where: eq(schoolAdminRoles.userId, user.id)
  })

  let dbRole = roleRecord?.[0]?.role
  if (!dbRole && adminRoleRec) {
    dbRole = 'SCHOOL_ADMIN'
  }

  const dbUser = await db.select({ schoolId: userTable.schoolId })
    .from(userTable)
    .where(eq(userTable.id, user.id))
    .limit(1)

  const finalRole = dbRole ? dbRole.toUpperCase() : (adminRoleRec ? 'SCHOOL_ADMIN' : 'STUDENT')
  const schoolId = dbUser?.[0]?.schoolId || adminRoleRec?.schoolId || null

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

  const adminRoleRec = await db.query.schoolAdminRoles.findFirst({
    where: eq(schoolAdminRoles.userId, user.id)
  })

  let dbRole = roleRecord?.[0]?.role
  if (!dbRole && adminRoleRec) {
    dbRole = 'SCHOOL_ADMIN'
  }

  const dbUser = await db.select({ schoolId: userTable.schoolId })
    .from(userTable)
    .where(eq(userTable.id, user.id))
    .limit(1)

  const finalRole = dbRole ? dbRole.toUpperCase() : (adminRoleRec ? 'SCHOOL_ADMIN' : 'STUDENT')
  const schoolId = dbUser?.[0]?.schoolId || adminRoleRec?.schoolId || null

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
