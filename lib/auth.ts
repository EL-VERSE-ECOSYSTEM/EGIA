import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { db } from './db'
import { userRole, user as userTable } from './db/schema'
import { resolveIdentities } from './auth/resolveIdentities'

async function getSessionImpl() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user || !user.id) {
    return null
  }

  const { data: { session } } = await supabase.auth.getSession()

  if (!user || !user.id) {
    return null
  }

  const userEmail = (user.email || '').trim().toLowerCase()
  const isSuperAdminEmail = userEmail === 'ixoralyon013@gmail.com'

  let loginContext
  try {
    loginContext = await resolveIdentities(user.id, userEmail)
  } catch (err) {
    console.warn('resolveIdentities failed in getSessionImpl:', err)
    loginContext = {
      userId: user.id,
      email: userEmail,
      fullName: user.user_metadata?.full_name || user.user_metadata?.name || 'User',
      identities: [],
    }
  }

  const activeIdentityId = user.user_metadata?.active_identity_id
  const matchedIdentity = activeIdentityId
    ? loginContext.identities?.find((i) => i.id === activeIdentityId)
    : null

  const primaryIdentity = matchedIdentity || loginContext.identities?.[0]
  let rawRole = (primaryIdentity?.role || user.user_metadata?.role || 'STUDENT').toUpperCase()
  if (isSuperAdminEmail) {
    rawRole = 'SUPER_ADMIN'
  } else if (rawRole === 'SUPER_ADMIN') {
    rawRole = 'STUDENT'
  }
  const finalRole = rawRole
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

  // Sync user_metadata if role or school_id in Supabase auth metadata is missing or out of sync
  if (
    user.user_metadata?.role?.toUpperCase() !== finalRole ||
    (schoolId && user.user_metadata?.school_id !== schoolId)
  ) {
    try {
      await supabase.auth.updateUser({
        data: {
          ...user.user_metadata,
          role: finalRole,
          school_id: schoolId,
          admin_level: adminLevel,
        },
      })
    } catch {
      // ignore user metadata sync error
    }
  }

  return {
    ...(session || {}),
    access_token: session?.access_token || '',
    token_type: session?.token_type || 'bearer',
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

  const userEmail = (user.email || '').trim().toLowerCase()
  const isSuperAdminEmail = userEmail === 'ixoralyon013@gmail.com'

  let loginContext
  try {
    loginContext = await resolveIdentities(user.id, userEmail)
  } catch (err) {
    console.warn('resolveIdentities failed in getUserImpl:', err)
    loginContext = {
      userId: user.id,
      email: userEmail,
      fullName: user.user_metadata?.full_name || user.user_metadata?.name || 'User',
      identities: [],
    }
  }

  const activeIdentityId = user.user_metadata?.active_identity_id
  const matchedIdentity = activeIdentityId
    ? loginContext.identities?.find((i) => i.id === activeIdentityId)
    : null

  const primaryIdentity = matchedIdentity || loginContext.identities?.[0]
  let rawRole = (primaryIdentity?.role || user.user_metadata?.role || 'STUDENT').toUpperCase()
  if (isSuperAdminEmail) {
    rawRole = 'SUPER_ADMIN'
  } else if (rawRole === 'SUPER_ADMIN') {
    rawRole = 'STUDENT'
  }
  const finalRole = rawRole
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
