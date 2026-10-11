'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { user as userTable, userRole as userRoleTable, teacher, student, school as schoolTable, schoolRegistrationApplication as schoolAppTable } from '@/lib/db/schema'
import { eq, ilike, sql } from 'drizzle-orm'
import { resolveIdentities, LoginContext, UserIdentity } from '@/lib/auth/resolveIdentities'
import { createClient as createSupabaseAdminClient, type User as SupabaseUser } from '@supabase/supabase-js'
import { getSupabaseSecretKey, getSupabaseUrl, isSupabaseConfigured } from '@/utils/supabase/config'
import { sendPushNotification } from '@/lib/services/notifications'
import { isConfiguredSuperAdminEmail, isValidSuperAdminPassword, SUPER_ADMIN_USER_ID } from '@/lib/auth/super-admin'

function authAdminClient() {
  const secretKey = getSupabaseSecretKey()
  if (!secretKey) return null

  return createSupabaseAdminClient(getSupabaseUrl(), secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

async function findSuperAdminAuthUser(adminClient: NonNullable<ReturnType<typeof authAdminClient>>) {
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw error

    const user = data.users.find((candidate) => candidate.email?.toLowerCase() === 'ixoralyon013@gmail.com')
    if (user) return user
    if (data.users.length < 1000) return null
  }

  throw new Error('Super Admin Auth account was not found within the supported user listing range.')
}

function isSupabaseAuthDatabaseError(error: unknown) {
  const message = error instanceof Error
    ? error.message
    : typeof error === 'object' && error !== null && 'message' in error
    ? String(error.message)
    : String(error || '')

  return /database error (?:querying schema|finding users)/i.test(message)
}

const SUPER_ADMIN_AUTH_DATABASE_ERROR =
  'Supabase Auth cannot query its user database. The Super Admin public.user and user_role records are intact; repair the Supabase Auth database permissions/schema, then retry login.'

async function ensureSuperAdminDatabaseUser() {
  return db.transaction(async (tx) => {
    const [existingDbUser] = await tx
      .select()
      .from(userTable)
      .where(ilike(userTable.email, 'ixoralyon013@gmail.com'))
      .for('update')
      .limit(1)
    const [canonicalDbUser] = await tx
      .select()
      .from(userTable)
      .where(eq(userTable.id, SUPER_ADMIN_USER_ID))
      .limit(1)

    if (canonicalDbUser && canonicalDbUser.email.toLowerCase() !== 'ixoralyon013@gmail.com') {
      return { error: 'The Super Admin user ID is already assigned to a different account.' }
    }

    if (existingDbUser?.id === SUPER_ADMIN_USER_ID) {
      return { user: existingDbUser }
    }

    if (!existingDbUser && canonicalDbUser) {
      return { user: canonicalDbUser }
    }

    const canonicalUser = {
      ...(existingDbUser || {
        name: 'Super Admin',
        image: null,
        schoolId: null,
        lastIdentityId: null,
        lastIdentityAt: null,
        gender: null,
        adminLevel: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      id: SUPER_ADMIN_USER_ID,
      email: 'ixoralyon013@gmail.com',
      name: existingDbUser?.name || 'Super Admin',
      lastIdentityId: `super_admin_${SUPER_ADMIN_USER_ID}`,
      updatedAt: new Date(),
    }

    if (existingDbUser) {
      await tx.update(userTable)
        .set({ email: `super-admin-migration-${crypto.randomUUID()}@invalid.local` })
        .where(eq(userTable.id, existingDbUser.id))
    }

    await tx.insert(userTable).values(canonicalUser)

    if (existingDbUser) {
      const foreignKeys = await tx.execute(sql`
        SELECT
          child_namespace.nspname AS schema_name,
          child_table.relname AS table_name,
          child_column.attname AS column_name
        FROM pg_constraint AS foreign_key
        JOIN pg_class AS parent_table ON parent_table.oid = foreign_key.confrelid
        JOIN pg_namespace AS parent_namespace ON parent_namespace.oid = parent_table.relnamespace
        JOIN pg_class AS child_table ON child_table.oid = foreign_key.conrelid
        JOIN pg_namespace AS child_namespace ON child_namespace.oid = child_table.relnamespace
        CROSS JOIN LATERAL unnest(foreign_key.conkey) WITH ORDINALITY AS child_key(attnum, position)
        CROSS JOIN LATERAL unnest(foreign_key.confkey) WITH ORDINALITY AS parent_key(attnum, position)
        JOIN pg_attribute AS child_column
          ON child_column.attrelid = child_table.oid AND child_column.attnum = child_key.attnum
        JOIN pg_attribute AS parent_column
          ON parent_column.attrelid = parent_table.oid AND parent_column.attnum = parent_key.attnum
        WHERE foreign_key.contype = 'f'
          AND parent_namespace.nspname = 'public'
          AND parent_table.relname = 'user'
          AND parent_column.attname = 'id'
          AND child_key.position = parent_key.position
      `) as unknown as Array<{ schema_name: string; table_name: string; column_name: string }>

      for (const foreignKey of foreignKeys) {
        await tx.execute(sql`
          UPDATE ${sql.identifier(foreignKey.schema_name)}.${sql.identifier(foreignKey.table_name)}
          SET ${sql.identifier(foreignKey.column_name)} = ${SUPER_ADMIN_USER_ID}
          WHERE ${sql.identifier(foreignKey.column_name)} = ${existingDbUser.id}
        `)
      }

      await tx.delete(userTable).where(eq(userTable.id, existingDbUser.id))
    }

    return { user: canonicalUser }
  })
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

  const isSuperAdminEmail = isConfiguredSuperAdminEmail(resolvedEmail)

  if (loginMode === 'standard' && isSuperAdminEmail) {
    return {
      success: false,
      error: 'Super Admin account must authenticate via the Super Admin login tab. Please switch tabs to sign in.',
    }
  }

  if (loginMode === 'superadmin' && !isSuperAdminEmail) {
    return {
      success: false,
      error: 'Super Admin portal access is strictly restricted to the designated Super Admin account.',
    }
  }
  // Dedicated direct authentication handling for Super Admin account
  if (isSuperAdminEmail) {
    const cleanPassword = passwordInput.trim()
    if (!isValidSuperAdminPassword(cleanPassword)) {
      return { success: false, error: 'Invalid Super Admin password provided.' }
    }

    if (!isSupabaseConfigured()) {
      return {
        success: false,
        error: 'Supabase Auth is not configured on the server. Set the Supabase URL and publishable key before signing in.',
      }
    }

    // Attempt Supabase Auth login/sync if available
    let authenticatedUser: SupabaseUser | null = null
    let hasAuthenticatedSession = false
    let initialSignInError: unknown = null
    try {
      const { data: superAuthData, error: signInError } = await supabase.auth.signInWithPassword({
        email: resolvedEmail,
        password: cleanPassword,
      })
      initialSignInError = signInError
      if (!signInError && superAuthData?.user && superAuthData.session) {
        authenticatedUser = superAuthData.user
        hasAuthenticatedSession = true
      }
    } catch (authError) {
      initialSignInError = authError
      console.error('Initial Super Admin Supabase Auth sign-in failed:', authError)
    }

    if (!authenticatedUser) {
      if (isSupabaseAuthDatabaseError(initialSignInError)) {
        return { success: false, error: SUPER_ADMIN_AUTH_DATABASE_ERROR }
      }

      const adminClient = authAdminClient()
      if (!adminClient) {
        return {
          success: false,
          error: 'Supabase Auth rejected the Super Admin password. Configure SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY so the server can synchronize the designated account.',
        }
      }

      try {
        const existingAuthUser = await findSuperAdminAuthUser(adminClient)
        if (existingAuthUser) {
          const { error } = await adminClient.auth.admin.updateUserById(existingAuthUser.id, {
            password: cleanPassword,
            email_confirm: true,
            user_metadata: { ...existingAuthUser.user_metadata, name: 'Super Admin', role: 'SUPER_ADMIN' },
          })
          if (error) throw error
        } else {
          const { error } = await adminClient.auth.admin.createUser({
            email: 'ixoralyon013@gmail.com',
            password: cleanPassword,
            email_confirm: true,
            user_metadata: { name: 'Super Admin', role: 'SUPER_ADMIN' },
          })
          if (error) throw error
        }

        const retryRes = await supabase.auth.signInWithPassword({
          email: resolvedEmail,
          password: cleanPassword,
        })
        if (retryRes.error) throw retryRes.error
        if (!retryRes.data?.user || !retryRes.data.session) {
          throw new Error('Supabase Auth did not return a session after account synchronization.')
        }
        authenticatedUser = retryRes.data.user
        hasAuthenticatedSession = true
      } catch (adminErr) {
        console.error('Super Admin Supabase Auth synchronization failed:', adminErr)
        if (isSupabaseAuthDatabaseError(adminErr)) {
          return { success: false, error: SUPER_ADMIN_AUTH_DATABASE_ERROR }
        }
        return {
          success: false,
          error: 'Supabase Auth could not synchronize the Super Admin account. Verify the server service-role key and Supabase Auth configuration, then try again.',
        }
      }
    }

    if (!authenticatedUser || !hasAuthenticatedSession) {
      return {
        success: false,
        error: 'Supabase Auth did not establish a Super Admin session. Check the Supabase Auth configuration and try again.',
      }
    }

    const provisionResult = await ensureSuperAdminDatabaseUser()
    if ('error' in provisionResult) {
      return {
        success: false,
        error: provisionResult.error,
      }
    }

    const finalSuperAdminUserId = SUPER_ADMIN_USER_ID

    await db.insert(userRoleTable).values({
      id: crypto.randomUUID(),
      userId: finalSuperAdminUserId,
      role: 'SUPER_ADMIN',
      createdAt: new Date(),
    }).onConflictDoNothing()
    await db.update(userRoleTable)
      .set({ role: 'SUPER_ADMIN' })
      .where(eq(userRoleTable.userId, finalSuperAdminUserId))

    try {
      await supabase.auth.updateUser({
        data: {
          role: 'SUPER_ADMIN',
          active_identity_id: `super_admin_${finalSuperAdminUserId}`,
          school_id: null,
        }
      })
    } catch {
      // non-critical if session user context differs
    }

    const superAdminIdentity: UserIdentity = {
      id: `super_admin_${finalSuperAdminUserId}`,
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
        userId: finalSuperAdminUserId,
        email: 'ixoralyon013@gmail.com',
        fullName: provisionResult.user.name || 'Super Admin',
        lastIdentityId: superAdminIdentity.id,
        identities: [superAdminIdentity],
      },
    }
  }

  let { data, error } = await supabase.auth.signInWithPassword({
    email: resolvedEmail,
    password: passwordInput,
  })

  if (error || !data?.user) {
    return { success: false, error: 'Invalid credentials or account not found.' }
  }

  try {
    const userEmail = (data.user.email || resolvedEmail).toLowerCase()
    const isSuperAdminEmail = isConfiguredSuperAdminEmail(userEmail)

    // Ensure public.user record exists for authenticated Supabase user
    let existingUser = await db.query.user.findFirst({
      where: eq(userTable.id, data.user.id),
    })

    if (!existingUser) {
      const userRoleMeta = isSuperAdminEmail ? 'SUPER_ADMIN' : 'STUDENT'
      const userSchoolId = null
      const userName = data.user.user_metadata?.name || userEmail.split('@')[0] || 'User'

      await db.insert(userTable).values({
        id: data.user.id,
        email: userEmail,
        name: userName,
        schoolId: userSchoolId,
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

    if (isSuperAdminEmail) {
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
      if (identity.role === 'SUPER_ADMIN' && !isSuperAdminEmail) {
        return false
      }
      return true
    })

    if (!loginContext.identities || loginContext.identities.length === 0) {
      // Fallback: If no specialized identity profiles (teacher/student/parent/admin) exist,
      // construct default identity from base user role so user logs in without a hitch.
      const requestedDefaultRole = (data.user.user_metadata?.role || 'STUDENT').toUpperCase()
      const defaultRole = requestedDefaultRole === 'SUPER_ADMIN' && !isSuperAdminEmail
        ? 'STUDENT'
        : isSuperAdminEmail ? 'SUPER_ADMIN' : requestedDefaultRole
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
    // Fallback gracefully so authenticated Supabase users log in without a hitch
    const requestedFallbackRole = (data.user.user_metadata?.role || 'STUDENT').toUpperCase()
    const fallbackRole = requestedFallbackRole === 'SUPER_ADMIN' && !isConfiguredSuperAdminEmail(data.user.email)
      ? 'STUDENT'
      : isConfiguredSuperAdminEmail(data.user.email) ? 'SUPER_ADMIN' : requestedFallbackRole
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
  const isSuperAdminEmail = isConfiguredSuperAdminEmail(userEmail)

  const loginContext = await resolveIdentities(user.id, userEmail)
  let matchedIdentity = loginContext.identities.find((i) => i.id === identityId)

  if (!matchedIdentity && isSuperAdminEmail) {
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
      const targetDbUserId = isSuperAdminEmail ? SUPER_ADMIN_USER_ID : user.id
      await db
        .update(userTable)
        .set({
          lastIdentityId: matchedIdentity.id,
          lastIdentityAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(userTable.id, targetDbUserId))
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
