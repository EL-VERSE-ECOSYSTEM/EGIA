import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { db } from './db'
import { userRole, user as userTable } from './db/schema'
import { resolveIdentities } from './auth/resolveIdentities'

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

  const loginContext = await resolveIdentities(user.id)

  const activeIdentityId = user.user_metadata?.active_identity_id
  const matchedIdentity = activeIdentityId
    ? loginContext.identities.find((i) => i.id === activeIdentityId)
    : null

  const primaryIdentity = matchedIdentity || loginContext.identities[0]
  const finalRole = (primaryIdentity?.role || user.user_metadata?.role || 'STUDENT').toUpperCase()
  const schoolId = primaryIdentity?.schoolId || user.user_metadata?.school_id || null
  const adminLevel = primaryIdentity?.adminLevel || user.user_metadata?.admin_level || null

  try {
    await db.insert(userRole).values({
      id: crypto.randomUUID(),
      userId: user.id,
      role: finalRole as any,
      createdAt: new Date(),
    }).onConflictDoNothing()
  } catch {
    // ignore duplicate conflict
  }

  return {
    ...session,
    user: {
      ...user,
      id: user.id,
      email: user.email || '',
      name: user.user_metadata?.full_name || user.user_metadata?.name || loginContext.fullName || 'User',
      role: finalRole,
      adminLevel,
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

  const loginContext = await resolveIdentities(user.id)
  const activeIdentityId = user.user_metadata?.active_identity_id
  const matchedIdentity = activeIdentityId
    ? loginContext.identities.find((i) => i.id === activeIdentityId)
    : null

  const primaryIdentity = matchedIdentity || loginContext.identities[0]
  const finalRole = (primaryIdentity?.role || user.user_metadata?.role || 'STUDENT').toUpperCase()
  const schoolId = primaryIdentity?.schoolId || user.user_metadata?.school_id || null
  const adminLevel = primaryIdentity?.adminLevel || user.user_metadata?.admin_level || null

  return {
    ...user,
    role: finalRole,
    adminLevel,
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
