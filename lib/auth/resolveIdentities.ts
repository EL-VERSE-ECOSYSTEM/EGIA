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

export async function resolveIdentities(userId: string): Promise<LoginContext> {
  let targetUserId = userId

  let userRecord = await db.query.user.findFirst({
    where: eq(userTable.id, targetUserId),
  })

  if (!userRecord) {
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
  }

  if (!userRecord) {
    // Auto-provision public.user if lookup by ID didn't find record yet
    const userName = targetUserId.includes('@') ? targetUserId.split('@')[0] : 'User'
    await db.insert(userTable).values({
      id: targetUserId,
      email: targetUserId.includes('@') ? targetUserId : `${targetUserId}@el-learners.local`,
      name: userName,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).onConflictDoNothing()

    userRecord = await db.query.user.findFirst({
      where: eq(userTable.id, targetUserId),
    })
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
  const email = activeUser.email
  const fullName = activeUser.name || 'User'
  const lastIdentityId = activeUser.lastIdentityId || null

  const identities: UserIdentity[] = []

  // Check Super Admin email detection
  const lowerEmail = email.toLowerCase()
  const isSuperAdminEmail =
    lowerEmail.includes('superadmin') ||
    lowerEmail.includes('super_admin') ||
    lowerEmail === 'admin@goodnews.com' ||
    lowerEmail === 'superadmin@goodnews.com' ||
    lowerEmail === 'ixoralyon013@gmail.com'

  // 1. Check Super Admin / Base User Roles
  const roles = await db.select().from(userRole).where(eq(userRole.userId, userId))

  const hasSuperAdminRole = roles.some((r) => r.role.toUpperCase() === 'SUPER_ADMIN') || isSuperAdminEmail

  if (hasSuperAdminRole) {
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
  }

  // 2. Check School Admin Roles
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

  // 3. Check Teacher Profiles
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

  // 4. Check Parent Profiles
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

    // Count wards linked in student table
    const wardCountRes = await db
      .select({ count: sql<number>`count(*)` })
      .from(student)
      .where(eq(student.parentId, parentRecord.id))

    const wardCount = Number(wardCountRes[0]?.count || 0)

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

  // 5. Check Student Profile
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

  // Ensure user always has at least one valid identity
  if (identities.length === 0) {
    const fallbackRole = isSuperAdminEmail ? 'SUPER_ADMIN' : 'STUDENT'
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
