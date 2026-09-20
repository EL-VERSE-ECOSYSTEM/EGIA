'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { user as userTable, teacher, student } from '@/lib/db/schema'
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

  let inputIdentifier = emailInput.trim()
  let resolvedEmail = inputIdentifier.toLowerCase()

  // Support real-time login via exact Staff ID or Admission Number using eq
  if (!resolvedEmail.includes('@')) {
    const cleanId = inputIdentifier.trim().toUpperCase()

    // 1. Check teacher staff code with exact match eq
    const teacherMatch = await db
      .select({ email: userTable.email, userId: teacher.userId })
      .from(teacher)
      .innerJoin(userTable, eq(teacher.userId, userTable.id))
      .where(eq(teacher.staffCode, cleanId))
      .limit(1)

    if (teacherMatch[0]?.email) {
      resolvedEmail = teacherMatch[0].email
    } else {
      // Direct teacher check
      const directTeacher = await db
        .select({ userId: teacher.userId, staffCode: teacher.staffCode })
        .from(teacher)
        .where(eq(teacher.staffCode, cleanId))
        .limit(1)

      if (directTeacher[0]?.userId) {
        const uRec = await db.select({ email: userTable.email }).from(userTable).where(eq(userTable.id, directTeacher[0].userId)).limit(1)
        if (uRec[0]?.email) resolvedEmail = uRec[0].email
      }
    }

    if (!resolvedEmail || !resolvedEmail.includes('@')) {
      // 2. Check student admission number with exact match eq
      const studentMatch = await db
        .select({ email: userTable.email, userId: student.userId })
        .from(student)
        .innerJoin(userTable, eq(student.userId, userTable.id))
        .where(eq(student.admissionNumber, cleanId))
        .limit(1)

      if (studentMatch[0]?.email) {
        resolvedEmail = studentMatch[0].email
      } else {
        // Direct student check
        const directStudent = await db
          .select({ userId: student.userId, admissionNumber: student.admissionNumber })
          .from(student)
          .where(eq(student.admissionNumber, cleanId))
          .limit(1)

        if (directStudent[0]?.userId) {
          const uRec = await db.select({ email: userTable.email }).from(userTable).where(eq(userTable.id, directStudent[0].userId)).limit(1)
          if (uRec[0]?.email) resolvedEmail = uRec[0].email
        }
      }
    }

    if (!resolvedEmail || !resolvedEmail.includes('@')) {
      return {
        success: false,
        error: 'Invalid credentials or account not found.',
      }
    }
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: resolvedEmail,
    password: passwordInput,
  })

  if (error || !data.user) {
    return { success: false, error: 'Invalid credentials or account not found.' }
  }

  try {
    const loginContext = await resolveIdentities(data.user.id)

    if (!loginContext.identities || loginContext.identities.length === 0) {
      await supabase.auth.signOut()
      return {
        success: false,
        error: 'Invalid credentials or account not found.',
      }
    }

    return {
      success: true,
      context: loginContext,
    }
  } catch (err: any) {
    console.error('Login identity resolution failed:', err)
    await supabase.auth.signOut()
    return { success: false, error: 'An unexpected error occurred during sign in.' }
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

  try {
    await supabase.auth.updateUser({
      data: newMetadata,
    })
    await supabase.auth.refreshSession()
  } catch (updateErr) {
    console.warn('Failed to update user session metadata via user client:', updateErr)
  }

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
