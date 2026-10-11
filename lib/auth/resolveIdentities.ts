import { db } from '@/lib/db'
import {
  user as userTable,
  userRole,
  schoolAdminRoles,
  teacher,
  parent,
  student,
  school,
} from '@/lib/db/schema'
import { eq, ilike, sql } from 'drizzle-orm'
import { getRedirectUrlForIdentity, RoleType } from './redirectMap'
import { isSuperAdminEmail, isSuperAdminUser } from './super-admin'

export interface UserIdentity {
  id: string
  role: RoleType
  schoolId: string | null
  schoolName?: string
  schoolLogoUrl?: string
  adminLevel?: string
  department?: string
  teacherId?: string
  parentId?: string
  studentId?: string
  wardCount?: number
  contextLine?: string
  redirectUrl: string
}

export interface LoginContext {
  userId: string
  email: string
  fullName: string
  lastIdentityId?: string | null
  identities: UserIdentity[]
}

export async function resolveIdentities(userId: string, emailHint?: string): Promise<LoginContext> {
  let targetUserId = userId
  let userRecord: any = null

  try {
    userRecord = await db.query.user.findFirst({
      where: eq(userTable.id, targetUserId),
    })
  } catch (err) {
    console.warn('User lookup by ID failed in resolveIdentities:', err)
  }

  if (!userRecord) {
    try {
      // Attempt lookup by Staff ID or Admission Number (case-insensitive)
      const cleanIdentifier = userId.trim().toUpperCase()
      const teacherRecord = await db.query.teacher.findFirst({
        where: ilike(teacher.staffCode, cleanIdentifier)
      })
      if (teacherRecord?.userId) {
        targetUserId = teacherRecord.userId
      } else {
        const studentRecord = await db.query.student.findFirst({
          where: ilike(student.admissionNumber, cleanIdentifier)
        })
        if (studentRecord?.userId) {
          targetUserId = studentRecord.userId
        }
      }

      userRecord = await db.query.user.findFirst({
        where: eq(userTable.id, targetUserId),
      })
    } catch (err) {
      console.warn('User lookup by Staff ID / Admission Number failed in resolveIdentities:', err)
    }
  }

  if (!userRecord) {
    try {
      const isSuperAdmin = await isSuperAdminEmail(emailHint) || await isSuperAdminUser(targetUserId)
      const userName = isSuperAdmin
        ? 'Super Admin'
        : targetUserId.includes('@')
        ? targetUserId.split('@')[0]
        : 'User'
      await db.insert(userTable).values({
        id: targetUserId,
        email: isSuperAdmin
          ? emailHint!.trim().toLowerCase()
          : targetUserId.includes('@')
          ? targetUserId
          : `${targetUserId}@el-learners.local`,
        name: userName,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).onConflictDoNothing()

      userRecord = await db.query.user.findFirst({
        where: eq(userTable.id, targetUserId),
      })
    } catch (err) {
      console.warn('Auto-provision public.user failed in resolveIdentities:', err)
    }
  }

  const activeUser = userRecord || ({
    id: targetUserId,
    email: targetUserId.includes('@') ? targetUserId : 'user@el-learners.local',
    name: 'User',
    schoolId: null,
    lastIdentityId: null,
    lastIdentityAt: null,
    gender: null,
    adminLevel: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as typeof userTable.$inferSelect)

  userId = activeUser.id
  const resolvedEmail = (emailHint || activeUser.email || '').trim().toLowerCase()
  const email = resolvedEmail || activeUser.email || ''
  const fullName = activeUser.name || 'User'
  const lastIdentityId = activeUser.lastIdentityId || null

  const identities: UserIdentity[] = []

  const userIsSuperAdmin = await isSuperAdminUser(userId) || await isSuperAdminEmail(resolvedEmail)

  // 1. Check Super Admin / Base User Roles from Supabase user_role Table
  try {
    if (userIsSuperAdmin) {
      const identityId = `super_admin_${userId}`
      identities.push({
        id: identityId,
        role: 'SUPER_ADMIN',
        schoolId: null,
        schoolName: 'System Core',
        contextLine: 'Global Platform Administrator',
        redirectUrl: getRedirectUrlForIdentity({ role: 'SUPER_ADMIN' }),
      })

      try {
        await db.insert(userRole).values({
          id: crypto.randomUUID(),
          userId: userId,
          role: 'SUPER_ADMIN',
          createdAt: new Date(),
        }).onConflictDoNothing()
      } catch (e) {
        // Ignore conflict
      }
    } else {
      const dbRole = await db.query.userRole.findFirst({
        where: eq(userRole.userId, userId),
      })
      if (dbRole?.role && dbRole.role !== 'SUPER_ADMIN') {
        const normalizedRole = dbRole.role.toUpperCase() as RoleType
        identities.push({
          id: `db_role_${dbRole.id}`,
          role: normalizedRole,
          schoolId: activeUser.schoolId || null,
          schoolName: 'EL LEARNERS Portal',
          contextLine: 'Database Assigned Role',
          redirectUrl: getRedirectUrlForIdentity({ role: normalizedRole }),
        })
      }
    }
  } catch (err) {
    console.warn('Base userRole query failed in resolveIdentities:', err)
  }

  // 2. Check School Admin Roles
  try {
    const adminRoleRecords = await db
      .select({
        adminRole: schoolAdminRoles,
        schoolRecord: school,
      })
      .from(schoolAdminRoles)
      .innerJoin(school, eq(schoolAdminRoles.schoolId, school.id))
      .where(eq(schoolAdminRoles.userId, userId))

    for (const { adminRole, schoolRecord } of adminRoleRecords) {
      if (adminRole.isActive) {
        const identityId = `admin_${adminRole.id}`
        const levelTitle = adminRole.level.replace(/_/g, ' ')
        identities.push({
          id: identityId,
          role: 'SCHOOL_ADMIN',
          schoolId: schoolRecord.id,
          schoolName: schoolRecord.name,
          schoolLogoUrl: schoolRecord.logoUrl || undefined,
          adminLevel: adminRole.level,
          department: adminRole.department || undefined,
          contextLine: levelTitle,
          redirectUrl: getRedirectUrlForIdentity({
            role: 'SCHOOL_ADMIN',
            adminLevel: adminRole.level,
            department: adminRole.department,
          }),
        })
      }
    }
  } catch (err) {
    console.warn('School admin roles query failed in resolveIdentities:', err)
  }

  // 3. Check Teacher Profiles
  try {
    const teacherRecords = await db
      .select({
        teacherRecord: teacher,
        schoolRecord: school,
      })
      .from(teacher)
      .leftJoin(school, eq(teacher.schoolId, school.id))
      .where(eq(teacher.userId, userId))

    for (const { teacherRecord, schoolRecord } of teacherRecords) {
      if (teacherRecord.isActive) {
        const identityId = `teacher_${teacherRecord.id}`
        const staffCode = teacherRecord.staffCode || 'N/A'
        identities.push({
          id: identityId,
          role: 'TEACHER',
          schoolId: teacherRecord.schoolId || null,
          schoolName: schoolRecord?.name || 'Academy Staff',
          schoolLogoUrl: schoolRecord?.logoUrl || undefined,
          teacherId: teacherRecord.id,
          contextLine: `Staff code: ${staffCode}`,
          redirectUrl: getRedirectUrlForIdentity({ role: 'TEACHER' }),
        })
      }
    }
  } catch (err) {
    console.warn('Teacher profiles query failed in resolveIdentities:', err)
  }

  // 4. Check Parent Profiles
  try {
    const parentRecords = await db
      .select({
        parentRecord: parent,
        schoolRecord: school,
      })
      .from(parent)
      .leftJoin(school, eq(parent.schoolId, school.id))
      .where(eq(parent.userId, userId))

    for (const { parentRecord, schoolRecord } of parentRecords) {
      const identityId = `parent_${parentRecord.id}`

      let wardCount = 0
      try {
        const wardCountRes = await db
          .select({ count: sql<number>`count(*)` })
          .from(student)
          .where(eq(student.parentId, parentRecord.id))
        wardCount = Number(wardCountRes[0]?.count || 0)
      } catch {
        // default to 0
      }

      identities.push({
        id: identityId,
        role: 'PARENT',
        schoolId: parentRecord.schoolId || null,
        schoolName: schoolRecord?.name || 'EL Learners Parent Portal',
        schoolLogoUrl: schoolRecord?.logoUrl || undefined,
        parentId: parentRecord.id,
        wardCount,
        contextLine: `${wardCount} ward${wardCount === 1 ? '' : 's'} linked`,
        redirectUrl: getRedirectUrlForIdentity({ role: 'PARENT' }),
      })
    }
  } catch (err) {
    console.warn('Parent profiles query failed in resolveIdentities:', err)
  }

  // 5. Check Student Profile
  try {
    const studentRecords = await db
      .select({
        studentRecord: student,
        schoolRecord: school,
      })
      .from(student)
      .leftJoin(school, eq(student.schoolId, school.id))
      .where(eq(student.userId, userId))

    for (const { studentRecord, schoolRecord } of studentRecords) {
      if (studentRecord.isActive) {
        const identityId = `student_${studentRecord.id}`
        identities.push({
          id: identityId,
          role: 'STUDENT',
          schoolId: studentRecord.schoolId || null,
          schoolName: schoolRecord?.name || 'Learners Student Portal',
          schoolLogoUrl: schoolRecord?.logoUrl || undefined,
          studentId: studentRecord.id,
          contextLine: `Class: ${studentRecord.class}${studentRecord.arm ? ' ' + studentRecord.arm : ''}`,
          redirectUrl: getRedirectUrlForIdentity({ role: 'STUDENT' }),
        })
      }
    }
  } catch (err) {
    console.warn('Student profiles query failed in resolveIdentities:', err)
  }

  // Ensure user always has at least one valid identity
  if (identities.length === 0) {
    const fallbackRole = userIsSuperAdmin ? 'SUPER_ADMIN' : 'STUDENT'
    identities.push({
      id: `default_${userId}`,
      role: fallbackRole as any,
      schoolId: activeUser.schoolId || null,
      schoolName: 'EL LEARNERS Portal',
      contextLine: 'Authenticated Account',
      redirectUrl: getRedirectUrlForIdentity({ role: fallbackRole as any }),
    })
  }

  return {
    userId,
    email,
    fullName,
    lastIdentityId,
    identities,
  }
}
