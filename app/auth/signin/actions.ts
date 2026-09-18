'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { user as userTable, teacher, student } from '@/lib/db/schema'
import { eq, ilike, sql } from 'drizzle-orm'
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

  let inputIdentifier = emailInput.trim()
  let resolvedEmail = inputIdentifier.toLowerCase()

  // Support real-time login via Staff ID or Admission Number in Supabase Database
  if (!resolvedEmail.includes('@')) {
    const cleanId = inputIdentifier.trim().toUpperCase()

    // 1. Check teacher staff code with inner join or case-insensitive ilike query
    const teacherMatch = await db
      .select({ email: userTable.email, userId: teacher.userId })
      .from(teacher)
      .innerJoin(userTable, eq(teacher.userId, userTable.id))
      .where(ilike(teacher.staffCode, cleanId))
      .limit(1)

    if (teacherMatch[0]?.email) {
      resolvedEmail = teacherMatch[0].email
    } else {
      // Check teacher staff code directly if inner join missed
      const directTeacher = await db
        .select({ userId: teacher.userId, staffCode: teacher.staffCode })
        .from(teacher)
        .where(ilike(teacher.staffCode, cleanId))
        .limit(1)

      if (directTeacher[0]?.userId) {
        const uRec = await db.select({ email: userTable.email }).from(userTable).where(eq(userTable.id, directTeacher[0].userId)).limit(1)
        if (uRec[0]?.email) resolvedEmail = uRec[0].email
      }
    }

    if (!resolvedEmail || !resolvedEmail.includes('@')) {
      // 2. Check student admission number with inner join or case-insensitive ilike query
      const studentMatch = await db
        .select({ email: userTable.email, userId: student.userId })
        .from(student)
        .innerJoin(userTable, eq(student.userId, userTable.id))
        .where(ilike(student.admissionNumber, cleanId))
        .limit(1)

      if (studentMatch[0]?.email) {
        resolvedEmail = studentMatch[0].email
      } else {
        // Direct student check if inner join missed
        const directStudent = await db
          .select({ userId: student.userId, admissionNumber: student.admissionNumber })
          .from(student)
          .where(ilike(student.admissionNumber, cleanId))
          .limit(1)

        if (directStudent[0]?.userId) {
          const uRec = await db.select({ email: userTable.email }).from(userTable).where(eq(userTable.id, directStudent[0].userId)).limit(1)
          if (uRec[0]?.email) resolvedEmail = uRec[0].email
        } else {
          // Fallback check for user table email pattern matching student identifier
          const fallbackUser = await db
            .select({ email: userTable.email })
            .from(userTable)
            .where(
              sql`LOWER(${userTable.email}) LIKE LOWER(${'%' + cleanId.toLowerCase() + '%'})`
            )
            .limit(1)

          if (fallbackUser[0]?.email) {
            resolvedEmail = fallbackUser[0].email
          } else {
            return {
              success: false,
              error: `No registered user account found for Staff ID or Admission Number '${cleanId}'. Please verify your credentials or email address.`
            }
          }
        }
      }
    }
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: resolvedEmail,
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
