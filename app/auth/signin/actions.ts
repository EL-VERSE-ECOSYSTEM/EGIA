'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { user as userTable } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { resolveIdentities, LoginContext, UserIdentity } from '@/lib/auth/resolveIdentities'
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js'
import { getSupabaseSecretKey, getSupabaseUrl } from '@/utils/supabase/config'

function authAdminClient() {
  const secretKey = getSupabaseSecretKey()
  if (!secretKey) return null

  return createSupabaseAdminClient(getSupabaseUrl(), secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function signInAction(emailInput: string, passwordInput: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const email = emailInput.trim().toLowerCase()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: passwordInput,
  })

  if (error || !data.user) {
    return { success: false, error: error?.message || 'Invalid email or password.' }
  }

  try {
    const loginContext = await resolveIdentities(data.user.id)

    if (!loginContext.identities || loginContext.identities.length === 0) {
      await supabase.auth.signOut()
      return {
        success: false,
        error: 'No active roles found for this account. Please contact your school administrator.',
      }
    }

    return {
      success: true,
      context: loginContext,
    }
  } catch (err: any) {
    console.error('Login identity resolution failed:', err)
    return { success: false, error: err.message || 'Identity resolution error.' }
  }
}

export async function activateIdentityAction(identityId: string, remember: boolean = false) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { success: false, error: 'Unauthorized session.' }
  }

  const loginContext = await resolveIdentities(user.id)
  const matchedIdentity = loginContext.identities.find((i) => i.id === identityId)

  if (!matchedIdentity) {
    return { success: false, error: 'Invalid identity selection.' }
  }

  const newMetadata = {
    ...user.user_metadata,
    active_identity_id: matchedIdentity.id,
    role: matchedIdentity.role,
    school_id: matchedIdentity.schoolId,
    admin_level: matchedIdentity.adminLevel || null,
    department: matchedIdentity.department || null,
  }

  // 1. Update user metadata via Supabase client to trigger session cookie update
  try {
    await supabase.auth.updateUser({
      data: newMetadata,
    })
    await supabase.auth.refreshSession()
  } catch (updateErr) {
    console.warn('Failed to update user session metadata via user client:', updateErr)
  }

  // 2. Also update via Admin API to guarantee real-time persistence across devices
  const adminClient = authAdminClient()
  if (adminClient) {
    try {
      await adminClient.auth.admin.updateUserById(user.id, {
        user_metadata: newMetadata,
      })
    } catch (adminErr) {
      console.warn('Failed to update active identity in Supabase Auth Admin:', adminErr)
    }
  }

  // 3. Update public.user last_identity_id
  if (remember) {
    try {
      await db
        .update(userTable)
        .set({
          lastIdentityId: matchedIdentity.id,
          lastIdentityAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(userTable.id, user.id))
    } catch (dbErr) {
      console.warn('Failed to update last_identity_id on public.user:', dbErr)
    }
  }

  return {
    success: true,
    redirectTo: matchedIdentity.redirectUrl,
    identity: matchedIdentity,
  }
}

export async function switchIdentityAction(identityId: string) {
  const res = await activateIdentityAction(identityId, true)
  return res
}
