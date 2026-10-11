'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { user as userTable, userRole as userRoleTable, teacher, student, school as schoolTable, schoolRegistrationApplication as schoolAppTable } from '@/lib/db/schema'
import { eq, and, ilike } from 'drizzle-orm'
import { resolveIdentities, LoginContext, UserIdentity } from '@/lib/auth/resolveIdentities'
import { createClient as createSupabaseAdminClient, type User as SupabaseUser } from '@supabase/supabase-js'
import { getSupabaseSecretKey, getSupabaseUrl } from '@/utils/supabase/config'
import { sendPushNotification } from '@/lib/services/notifications'
import { isSuperAdminEmail, isSuperAdminUser } from '@/lib/auth/super-admin'

function authAdminClient() {
  const secretKey = getSupabaseSecretKey()
  if (!secretKey) return null

  return createSupabaseAdminClient(getSupabaseUrl(), secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

async function findAuthUserByEmail(adminClient: NonNullable<ReturnType<typeof authAdminClient>>, email: string) {
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw error

    const found = data.users.find((candidate) => candidate.email?.toLowerCase() === email)
    if (found) return found
    if (data.users.length < 1000) return null
  }
  return null
}

export async function signInAction(emailInput: string, passwordInput: string, loginMode: 'standard' | 'superadmin' = 'standard') {
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
      // 3. Check School Registration Code / School Code in school table
      const schoolMatch = await db
        .select({ id: schoolTable.id, code: schoolTable.code })
        .from(schoolTable)
        .where(eq(schoolTable.code, cleanId))
        .limit(1)

      if (schoolMatch[0]?.id) {
        // Find school admin user corresponding to this school
        const adminUserMatch = await db
          .select({ email: userTable.email })
          .from(userTable)
          .where(eq(userTable.schoolId, schoolMatch[0].id))
          .limit(1)

        if (adminUserMatch[0]?.email) {
          resolvedEmail = adminUserMatch[0].email
        }
      }
    }

    if (!resolvedEmail || !resolvedEmail.includes('@')) {
      // 4. Check school registration application code
      const appMatch = await db
        .select({ email: schoolAppTable.applicantEmail })
        .from(schoolAppTable)
        .where(eq(schoolAppTable.id, inputIdentifier.trim()))
        .limit(1)

      if (appMatch[0]?.email) {
        resolvedEmail = appMatch[0].email.toLowerCase()
      }
    }

    if (!resolvedEmail || !resolvedEmail.includes('@')) {
      return {
        success: false,
        error: 'Invalid credentials or account not found.',
      }
    }
  }

  const isSuperAdmin = await isSuperAdminEmail(resolvedEmail)

  if (loginMode === 'standard' && isSuperAdmin) {
    return {
      success: false,
      error: 'Super Admin account must authenticate via the Super Admin login tab. Please switch tabs to sign in.',
    }
  }

  if (loginMode === 'superadmin' && !isSuperAdmin) {
    return {
      success: false,
      error: 'Super Admin portal access is strictly restricted to authorized Super Admin accounts.',
    }
  }

  // Authenticate user via Supabase Auth
  let { data, error } = await supabase.auth.signInWithPassword({
    email: resolvedEmail,
    password: passwordInput,
  })

  // Self-healing synchronization for Super Admin accounts if initial Supabase Auth login fails
  if ((error || !data?.user) && isSuperAdmin) {
    const adminClient = authAdminClient()
    if (adminClient) {
      try {
        let authUser = await findAuthUserByEmail(adminClient, resolvedEmail)
        if (authUser) {
          await adminClient.auth.admin.updateUserById(authUser.id, {
            password: passwordInput,
            email_confirm: true,
            user_metadata: { ...authUser.user_metadata, role: 'SUPER_ADMIN' },
          })
        } else {
          // Look up user ID from database user record
          const dbUser = await db
            .select({ id: userTable.id, name: userTable.name })
            .from(userTable)
            .where(ilike(userTable.email, resolvedEmail))
            .limit(1)

          const targetAuthUserId: string | undefined = dbUser[0]?.id || undefined

          try {
            await adminClient.auth.admin.createUser({
              id: targetAuthUserId,
              email: resolvedEmail,
              password: passwordInput,
              email_confirm: true,
              user_metadata: { name: dbUser[0]?.name || 'Super Admin', role: 'SUPER_ADMIN' },
            })
          } catch (createErr: any) {
            // User likely exists in auth.users under a slightly different lookup; find and update password
            const retryUser = await findAuthUserByEmail(adminClient, resolvedEmail)
            if (retryUser) {
              await adminClient.auth.admin.updateUserById(retryUser.id, {
                password: passwordInput,
                email_confirm: true,
                user_metadata: { ...retryUser.user_metadata, role: 'SUPER_ADMIN' },
              })
            }
          }
        }

        const retryRes = await supabase.auth.signInWithPassword({
          email: resolvedEmail,
          password: passwordInput,
        })
        if (!retryRes.error && retryRes.data?.user) {
          data = retryRes.data
          error = null
        }
      } catch (syncErr) {
        console.warn('Super Admin Auth synchronization warning:', syncErr)
      }
    }
  }

  if (error || !data?.user) {
    return { success: false, error: 'Invalid credentials or account not found.' }
  }

  try {
    const userEmail = (data.user.email || resolvedEmail).toLowerCase()
    const userIsSuperAdmin = await isSuperAdminUser(data.user.id) || await isSuperAdminEmail(userEmail)

    // Ensure public.user record exists for authenticated Supabase user
    let existingUser = await db.query.user.findFirst({
      where: eq(userTable.id, data.user.id),
    })

    if (!existingUser) {
      const userRoleMeta = userIsSuperAdmin ? 'SUPER_ADMIN' : 'STUDENT'
      const userName = data.user.user_metadata?.name || userEmail.split('@')[0] || 'User'

      await db.insert(userTable).values({
        id: data.user.id,
        email: userEmail,
        name: userName,
        schoolId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).onConflictDoNothing()

      await db.insert(userRoleTable).values({
        id: crypto.randomUUID(),
        userId: data.user.id,
        role: userRoleMeta as any,
        createdAt: new Date(),
      }).onConflictDoNothing()

      existingUser = await db.query.user.findFirst({
        where: eq(userTable.id, data.user.id),
      })
    }

    if (userIsSuperAdmin) {
      await db.insert(userRoleTable).values({
        id: crypto.randomUUID(),
        userId: data.user.id,
        role: 'SUPER_ADMIN',
        createdAt: new Date(),
      }).onConflictDoNothing()

      try {
        await supabase.auth.updateUser({
          data: {
            ...data.user.user_metadata,
            role: 'SUPER_ADMIN',
            active_identity_id: `super_admin_${data.user.id}`,
            school_id: null,
          }
        })
      } catch (e) {
        console.warn('Failed to sync super admin metadata:', e)
      }

      const superAdminIdentity: UserIdentity = {
        id: `super_admin_${data.user.id}`,
        role: 'SUPER_ADMIN',
        schoolId: null,
        schoolName: 'System Core',
        contextLine: 'Global Platform Administrator',
        redirectUrl: '/dashboard/super-admin/overview',
      }

      return {
        success: true,
        redirectTo: '/dashboard/super-admin/overview',
        context: {
          userId: data.user.id,
          email: userEmail,
          fullName: data.user.user_metadata?.name || existingUser?.name || 'Super Admin',
          lastIdentityId: superAdminIdentity.id,
          identities: [superAdminIdentity],
        },
      }
    }

    const loginContext = await resolveIdentities(data.user.id, userEmail)

    // Filter identities to prevent unauthorized users from acquiring SUPER_ADMIN identity
    loginContext.identities = loginContext.identities.filter(identity => {
      if (identity.role === 'SUPER_ADMIN' && !userIsSuperAdmin) {
        return false
      }
      return true
    })

    if (!loginContext.identities || loginContext.identities.length === 0) {
      const requestedDefaultRole = (data.user.user_metadata?.role || 'STUDENT').toUpperCase()
      const defaultRole = requestedDefaultRole === 'SUPER_ADMIN' && !userIsSuperAdmin
        ? 'STUDENT'
        : userIsSuperAdmin ? 'SUPER_ADMIN' : requestedDefaultRole
      const defaultIdentity: UserIdentity = {
        id: `default_${data.user.id}`,
        role: defaultRole as any,
        schoolId: data.user.user_metadata?.school_id || existingUser?.schoolId || null,
        schoolName: 'EL LEARNERS Portal',
        contextLine: 'Authenticated Account',
        redirectUrl: defaultRole === 'SUPER_ADMIN'
          ? '/dashboard/super-admin/overview'
          : defaultRole === 'SCHOOL_ADMIN' || defaultRole === 'ADMIN'
          ? '/dashboard/admin'
          : defaultRole === 'TEACHER'
          ? '/dashboard/teacher'
          : defaultRole === 'PARENT'
          ? '/dashboard/parent'
          : '/dashboard/student',
      }

      return {
        success: true,
        context: {
          userId: data.user.id,
          email: data.user.email || resolvedEmail,
          fullName: data.user.user_metadata?.name || existingUser?.name || 'User',
          lastIdentityId: null,
          identities: [defaultIdentity],
        },
      }
    }

    // Transmit FCM push notification alert informing registered device of login event
    try {
      await sendPushNotification({
        userId: data.user.id,
        title: 'Login Security Alert',
        body: 'Your account was just logged into from a browser device.',
        type: 'LOGIN_ALERT',
        eventKey: `login_${data.user.id}_${Date.now()}`,
      })
    } catch (pushErr) {
      console.warn('FCM login notification dispatch error:', pushErr)
    }

    return {
      success: true,
      context: loginContext,
    }
  } catch (err: any) {
    console.error('Login identity resolution failed:', err)
    const userIsSuperAdmin = await isSuperAdminEmail(resolvedEmail)
    const requestedFallbackRole = (data.user.user_metadata?.role || 'STUDENT').toUpperCase()
    const fallbackRole = requestedFallbackRole === 'SUPER_ADMIN' && !userIsSuperAdmin
      ? 'STUDENT'
      : userIsSuperAdmin ? 'SUPER_ADMIN' : requestedFallbackRole
    const fallbackIdentity: UserIdentity = {
      id: `fallback_${data.user.id}`,
      role: fallbackRole as any,
      schoolId: data.user.user_metadata?.school_id || null,
      schoolName: 'EL LEARNERS Portal',
      contextLine: 'Authenticated Account',
      redirectUrl: fallbackRole === 'SUPER_ADMIN'
        ? '/dashboard/super-admin/overview'
        : fallbackRole === 'SCHOOL_ADMIN' || fallbackRole === 'ADMIN'
        ? '/dashboard/admin'
        : fallbackRole === 'TEACHER'
        ? '/dashboard/teacher'
        : fallbackRole === 'PARENT'
        ? '/dashboard/parent'
        : '/dashboard/student',
    }

    return {
      success: true,
      context: {
        userId: data.user.id,
        email: data.user.email || resolvedEmail,
        fullName: data.user.user_metadata?.name || 'User',
        lastIdentityId: null,
        identities: [fallbackIdentity],
      },
    }
  }
}

export async function activateIdentityAction(identityId: string, remember: boolean = false) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return { success: false, error: 'Unauthorized session.' }
  }

  const userEmail = (user.email || '').trim().toLowerCase()
  const userIsSuperAdmin = await isSuperAdminUser(user.id) || await isSuperAdminEmail(userEmail)

  const loginContext = await resolveIdentities(user.id, userEmail)
  let matchedIdentity = loginContext.identities.find((i) => i.id === identityId)

  if (!matchedIdentity && userIsSuperAdmin) {
    matchedIdentity = {
      id: `super_admin_${user.id}`,
      role: 'SUPER_ADMIN',
      schoolId: null,
      schoolName: 'System Core',
      contextLine: 'Global Platform Administrator',
      redirectUrl: '/dashboard/super-admin/overview',
    }
  }

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
