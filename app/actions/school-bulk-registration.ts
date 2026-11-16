'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import {
  parent,
  school,
  schoolAdminRoles,
  schoolRegistrationBatches,
  student,
  teacher,
  transactions,
  academicSession,
  term,
  user as userTable,
  userRole,
} from '@/lib/db/schema'
import { generateSequentialAdmissionNumber, generateSequentialStaffCode } from '@/lib/admission'
import { calculateSchoolRegistrationTotal, SCHOOL_REGISTRATION_PROCESSING_FEE_NGN } from '@/lib/school-registration'
import { generateTemporaryPassword } from '@/lib/onboarding-credentials'
import { sendSchoolAccountEmail } from '@/lib/mailer'
import { initializePaystackPayment } from '@/lib/payments/service'
import { getSupabaseSecretKey, getSupabaseUrl } from '@/utils/supabase/config'
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js'
import { and, eq, inArray, isNull } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const MAX_BULK_RECORDS = 100
const imageField = z.string().trim().max(2048).optional().default('')
const optionalImageField = z.string().trim().max(2048).optional().nullable()
const emailField = z.string().trim().email().max(254).transform((value) => value.toLowerCase())
const genderField = z.enum(['Male', 'Female', 'MALE', 'FEMALE'])
  .transform((value) => value.toLowerCase() === 'male' ? 'Male' : 'Female')
const dateField = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a YYYY-MM-DD date.')
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00.000Z`)
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
  }, 'Enter a valid calendar date.')

const studentInput = z.object({
  firstName: z.string().trim().min(2).max(50),
  middleName: z.string().trim().max(50).optional().default(''),
  lastName: z.string().trim().min(2).max(50),
  gender: genderField,
  email: emailField,
  class: z.enum(['Primary 3', 'Primary 4', 'Primary 5', 'Primary 6', 'Basic 5', 'Basic 6', 'JSS1', 'JSS2', 'JSS3', 'SSS1', 'SSS2', 'SSS3']),
  department: z.string().trim().max(80).optional().default(''),
  dateOfBirth: dateField,
  dateOfResumption: dateField,
  academicSession: z.string().trim().min(1).max(40),
  term: z.enum(['First Term', 'Second Term', 'Third Term']),
  subjectsDone: z.array(z.string().trim().min(1).max(100)).min(1).max(100),
  profileImage: imageField,
  facialVerificationVideo: optionalImageField,
  parentEmail: z.string().trim().email().max(254).transform((value) => value.toLowerCase()).optional(),
})

const teacherInput = z.object({
  firstName: z.string().trim().min(2).max(50),
  lastName: z.string().trim().min(2).max(50),
  gender: genderField,
  email: emailField,
  phoneNumber: z.string().trim().min(10).max(20),
  type: z.enum(['FULL_TIME', 'PART_TIME']).default('FULL_TIME'),
  resumptionDate: dateField.optional(),
  resumptionTime: z.string().trim().max(40).optional().default(''),
  bio: z.string().trim().max(2000).optional().default(''),
  department: z.string().trim().max(80).optional().default(''),
  qualification: z.string().trim().max(150).optional().default(''),
  specialization: z.string().trim().max(150).optional().default(''),
  handlingClasses: z.array(z.string().trim().min(1).max(80)).max(30).default([]),
  teachingSubjects: z.array(z.string().trim().min(1).max(100)).max(100).default([]),
  presentDays: z.array(z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])).max(7).default([]),
  profileImage: imageField,
  facialVerificationVideo: optionalImageField,
  applicationLetterUrl: z.string().url().max(2048).optional().or(z.literal('')),
  cvUrl: z.string().url().max(2048).optional().or(z.literal('')),
  isAlsoParent: z.boolean().default(false),
  wardAdmissionNumber: z.string().trim().max(40).optional().default(''),
})

const parentInput = z.object({
  firstName: z.string().trim().min(2).max(50),
  lastName: z.string().trim().min(2).max(50),
  gender: genderField,
  email: emailField,
  phoneNumber: z.string().trim().min(10).max(20),
  occupation: z.string().trim().min(1).max(100),
  address: z.string().trim().max(250).optional().default(''),
  profileImage: imageField,
  facialVerificationVideo: optionalImageField,
  wardAdmissionNumbers: z.array(z.string().trim().min(1).max(40)).max(5).default([]),
})

const adminInput = z.object({
  firstName: z.string().trim().min(2).max(50),
  lastName: z.string().trim().min(2).max(50),
  email: emailField,
  adminLevel: z.enum(['VICE_PRINCIPAL_ACADEMICS', 'VICE_PRINCIPAL_ADMIN', 'HOD_SCIENCE', 'HOD_ARTS', 'HOD_COMMERCIAL']),
})

const bulkInput = z.object({
  students: z.array(studentInput).max(MAX_BULK_RECORDS).default([]),
  teachers: z.array(teacherInput).max(MAX_BULK_RECORDS).default([]),
  parents: z.array(parentInput).max(MAX_BULK_RECORDS).default([]),
  admins: z.array(adminInput).max(MAX_BULK_RECORDS).default([]),
}).superRefine((value, context) => {
  const total = value.students.length + value.teachers.length + value.parents.length + value.admins.length
  if (!total || total > MAX_BULK_RECORDS) {
    context.addIssue({ code: 'custom', message: `Add between 1 and ${MAX_BULK_RECORDS} total records.` })
  }
  const emails = [
    ...value.students.map((record) => record.email),
    ...value.teachers.map((record) => record.email),
    ...value.parents.map((record) => record.email),
    ...value.admins.map((record) => record.email),
  ]
  if (new Set(emails).size !== emails.length) {
    context.addIssue({ code: 'custom', message: 'Each record must use a unique email address.' })
  }
})

type BulkInput = z.infer<typeof bulkInput>
type ProvisionedUser = {
  id: string
  email: string
  password: string
  name: string
  role: string
  schoolId: string
  accountIdentifier?: string
  adminLevel?: string
}

async function getSchoolAdminContext() {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Sign in before registering school members.')
  const role = session.user.role.toUpperCase()
  if (role !== 'SCHOOL_ADMIN' && role !== 'ADMIN') throw new Error('Only school administrators can bulk register school members.')

  const [userRecord, adminRole] = await Promise.all([
    db.query.user.findFirst({ where: eq(userTable.id, session.user.id) }),
    db.query.schoolAdminRoles.findFirst({
      where: and(eq(schoolAdminRoles.userId, session.user.id), eq(schoolAdminRoles.isActive, true)),
    }),
  ])
  const schoolId = adminRole?.schoolId || userRecord?.schoolId || null
  if (!schoolId || (userRecord?.schoolId && userRecord.schoolId !== schoolId)) {
    throw new Error('Your active school assignment could not be verified.')
  }
  const schoolRecord = await db.query.school.findFirst({ where: eq(school.id, schoolId) })
  if (!schoolRecord) throw new Error('Your assigned school could not be found.')
  return { user: session.user, school: schoolRecord }
}

function assertDepartmentAccess(actor: { role: string; adminLevel?: string | null; department?: string | null }, department: string) {
  if (actor.role.toUpperCase() === 'SCHOOL_ADMIN' && actor.adminLevel?.startsWith('HOD_')) {
    const assigned = actor.department?.trim().toLowerCase()
    if (!assigned || department.trim().toLowerCase() !== assigned) {
      throw new Error('HODs can only register members in their assigned department.')
    }
  }
}

async function createAuthUsers(records: ProvisionedUser[]) {
  const secretKey = getSupabaseSecretKey()
  if (!secretKey) throw new Error('Account provisioning is unavailable because Supabase authentication is not configured.')
  const admin = createSupabaseAdminClient(getSupabaseUrl(), secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const created: string[] = []
  try {
    for (const record of records) {
      const { data, error } = await admin.auth.admin.createUser({
        id: record.id,
        email: record.email,
        password: record.password,
        email_confirm: true,
        user_metadata: {
          full_name: record.name,
          role: record.role,
          school_id: record.schoolId,
          must_change_password: true,
        },
        app_metadata: { must_change_password: true },
      })
      if (error || !data.user?.id) {
        throw new Error(error?.message || `Could not create an account for ${record.email}.`)
      }
      created.push(data.user.id)
    }
  } catch (error) {
    for (const userId of created) {
      const { error: deleteError } = await admin.auth.admin.deleteUser(userId)
      if (deleteError) console.error('Could not roll back a partially provisioned school account.', deleteError)
    }
    throw error
  }
  return { admin, created }
}

async function startBatchCheckout(batchId: string, reference: string, customerEmail: string, customerName: string, schoolName: string, schoolId: string, amount: number) {
  try {
    await db.insert(transactions).values({
      id: randomUUID(),
      reference,
      amount: amount.toFixed(2),
      currency: 'NGN',
      customerEmail,
      customerName,
      description: `Registration fees for ${schoolName} students`,
      metadata: { paymentType: 'SCHOOL_BULK_REGISTRATION', batchId, schoolId },
      status: 'pending',
    })
    const checkout = await initializePaystackPayment({
      reference,
      amount,
      currency: 'NGN',
      feeType: 'SCHOOL_BULK_REGISTRATION',
      description: `Registration fee: ${amount / (2_000 + SCHOOL_REGISTRATION_PROCESSING_FEE_NGN)} students at ${schoolName}`,
      customerEmail,
      customerName,
      schoolId,
      metadata: { paymentType: 'SCHOOL_BULK_REGISTRATION', batchId, schoolId },
    })
    await db.update(transactions)
      .set({ checkoutUrl: checkout.checkoutUrl, updatedAt: new Date() })
      .where(eq(transactions.reference, reference))
    return checkout.checkoutUrl
  } catch (error) {
    await db.update(transactions)
      .set({ status: 'failed', updatedAt: new Date() })
      .where(and(eq(transactions.reference, reference), eq(transactions.status, 'pending')))
    await db.update(schoolRegistrationBatches)
      .set({ status: 'FAILED', updatedAt: new Date() })
      .where(and(eq(schoolRegistrationBatches.id, batchId), eq(schoolRegistrationBatches.paymentReference, reference), eq(schoolRegistrationBatches.status, 'PENDING')))
    console.error('Bulk school registration payment initialization failed.', error)
    return null
  }
}

export async function registerSchoolMembersInBulk(input: unknown) {
  const parsed = bulkInput.safeParse(input)
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || 'Invalid bulk registration data.')
  const records: BulkInput = parsed.data
  const { user: actor, school: schoolRecord } = await getSchoolAdminContext()
  const schoolId = schoolRecord.id
  if (records.admins.length && actor.role.toUpperCase() === 'SCHOOL_ADMIN' && actor.adminLevel !== 'PRIMARY_ADMIN') {
    throw new Error('Only the Primary Administrator can register additional school administrators.')
  }

  if (actor.role.toUpperCase() === 'SCHOOL_ADMIN' && actor.adminLevel?.startsWith('HOD_')) {
    for (const item of records.students) assertDepartmentAccess(actor, item.department)
    for (const item of records.teachers) assertDepartmentAccess(actor, item.department)
  }

  const emails = [
    ...records.students.map((item) => item.email),
    ...records.teachers.map((item) => item.email),
    ...records.parents.map((item) => item.email),
    ...records.admins.map((item) => item.email),
  ]
  const existingUsers = await db.select({ email: userTable.email }).from(userTable).where(inArray(userTable.email, emails))
  if (existingUsers.length) throw new Error(`An account already exists for ${existingUsers[0].email}.`)

  const parentIdByEmail = new Map(records.parents.map((item) => [item.email, randomUUID()]))
  const parentUserIdByEmail = new Map(records.parents.map((item) => [item.email, randomUUID()]))
  const teacherParentIdByEmail = new Map(
    records.teachers.filter((item) => item.isAlsoParent).map((item) => [item.email, randomUUID()]),
  )
  const teacherByEmail = new Map(records.teachers.map((item) => [item.email, { id: randomUUID(), userId: randomUUID() }]))
  const studentRows = await Promise.all(records.students.map(async (item) => ({
    item,
    id: randomUUID(),
    userId: randomUUID(),
    admissionNumber: await generateSequentialAdmissionNumber(schoolId, item.class),
  })))
  const studentEnrollmentRows = await Promise.all(studentRows.map(async (row) => {
    const sessionRecord = await db.query.academicSession.findFirst({
      where: eq(academicSession.name, row.item.academicSession),
    })
    if (!sessionRecord) throw new Error(`Academic session "${row.item.academicSession}" was not found.`)
    const termRecord = await db.query.term.findFirst({
      where: and(eq(term.name, row.item.term), eq(term.sessionId, sessionRecord.id)),
    })
    if (!termRecord) throw new Error(`${row.item.term} was not found for academic session "${row.item.academicSession}".`)
    return { ...row, sessionId: sessionRecord.id, termId: termRecord.id }
  }))
  const teacherRows = await Promise.all(records.teachers.map(async (item) => ({
    item,
    id: teacherByEmail.get(item.email)!.id,
    userId: teacherByEmail.get(item.email)!.userId,
    staffCode: await generateSequentialStaffCode(schoolId),
  })))
  const parentRows = records.parents.map((item) => ({
    item,
    id: parentIdByEmail.get(item.email)!,
    userId: parentUserIdByEmail.get(item.email)!,
  }))

  const wardOwner = new Map<string, string>()
  for (const parentRow of parentRows) {
    for (const admissionNumber of parentRow.item.wardAdmissionNumbers) {
      const normalized = admissionNumber.toUpperCase()
      if (wardOwner.has(normalized)) throw new Error('A student admission number cannot be linked to multiple parents in one batch.')
      wardOwner.set(normalized, parentRow.item.email)
    }
  }
  for (const teacherRow of teacherRows) {
    if (teacherRow.item.isAlsoParent && teacherRow.item.wardAdmissionNumber) {
      const normalized = teacherRow.item.wardAdmissionNumber.toUpperCase()
      if (wardOwner.has(normalized)) throw new Error('A student admission number cannot be linked to multiple parents in one batch.')
      wardOwner.set(normalized, teacherRow.item.email)
    }
  }
  for (const studentRow of studentRows) {
    const admission = studentRow.admissionNumber.toUpperCase()
    const parentEmail = studentRow.item.parentEmail
    const ownerEmail = wardOwner.get(admission)
    if (!parentEmail) throw new Error(`Choose a parent account for student admission number ${studentRow.admissionNumber}.`)
    if (parentEmail && !parentIdByEmail.has(parentEmail) && !teacherParentIdByEmail.has(parentEmail)) {
      throw new Error(`No bulk parent record was provided for ${parentEmail}.`)
    }
    if (parentEmail && ownerEmail && parentEmail !== ownerEmail) throw new Error('Student and parent records have conflicting links.')
    if (parentEmail) wardOwner.set(admission, parentEmail)
  }

  const linkedParentEmails = new Set(wardOwner.values())
  for (const parentRow of parentRows) {
    if (!linkedParentEmails.has(parentRow.item.email)) {
      throw new Error(`Link at least one ward to parent account ${parentRow.item.email}.`)
    }
  }
  for (const teacherRow of teacherRows.filter(({ item }) => item.isAlsoParent)) {
    if (teacherRow.item.wardAdmissionNumber && !linkedParentEmails.has(teacherRow.item.email)) {
      throw new Error(`Ward ${teacherRow.item.wardAdmissionNumber} could not be linked to ${teacherRow.item.email}.`)
    }
  }

  const adminRows = records.admins.map((item) => ({ item, id: randomUUID(), userId: randomUUID() }))
  const usedPasswordCodes = new Set<string>()
  const provisioned: ProvisionedUser[] = [
    ...studentRows.map(({ item, userId, admissionNumber }) => ({
      id: userId, email: item.email, password: generateTemporaryPassword(usedPasswordCodes),
      name: `${item.firstName} ${item.lastName}`, role: 'STUDENT', schoolId, accountIdentifier: admissionNumber,
    })),
    ...teacherRows.map(({ item, userId, staffCode }) => ({
      id: userId, email: item.email, password: generateTemporaryPassword(usedPasswordCodes),
      name: `${item.firstName} ${item.lastName}`, role: 'TEACHER', schoolId, accountIdentifier: staffCode,
    })),
    ...parentRows.map(({ item, userId }) => ({
      id: userId, email: item.email, password: generateTemporaryPassword(usedPasswordCodes),
      name: `${item.firstName} ${item.lastName}`, role: 'PARENT', schoolId,
    })),
    ...adminRows.map(({ item, userId }) => ({
      id: userId, email: item.email, password: generateTemporaryPassword(usedPasswordCodes),
      name: `${item.firstName} ${item.lastName}`, role: 'SCHOOL_ADMIN', schoolId,
      adminLevel: item.adminLevel, accountIdentifier: item.adminLevel.replaceAll('_', ' '),
    })),
  ]
  const { admin: supabaseAdmin, created: authUserIds } = await createAuthUsers(provisioned)
  const now = new Date()
  const batchId = randomUUID()
  const paymentReference = `EL-BULK-REG-${randomUUID().replaceAll('-', '').toUpperCase()}`
  const totalAmount = studentRows.length ? calculateSchoolRegistrationTotal(studentRows.length) : 0

  try {
    await db.transaction(async (tx) => {
      const dbUsers = provisioned.map((account) => ({
        id: account.id,
        email: account.email,
        name: account.name,
        schoolId,
        adminLevel: account.adminLevel || null,
        mustChangePassword: true,
        lastIdentityAt: now,
      }))
      await tx.insert(userTable).values(dbUsers)
      const roleRecords = [
        ...studentRows.map(({ userId }) => ({ id: randomUUID(), userId, role: 'STUDENT' })),
        ...teacherRows.map(({ userId }) => ({ id: randomUUID(), userId, role: 'TEACHER' })),
        ...parentRows.map(({ userId }) => ({ id: randomUUID(), userId, role: 'PARENT' })),
        ...teacherRows.filter(({ item }) => item.isAlsoParent).map(({ userId }) => ({ id: randomUUID(), userId, role: 'PARENT' })),
        ...adminRows.map(({ userId }) => ({ id: randomUUID(), userId, role: 'SCHOOL_ADMIN' })),
      ]
      await tx.insert(userRole).values(roleRecords)
      if (adminRows.length) {
        await tx.insert(schoolAdminRoles).values(adminRows.map(({ item, userId }) => ({
          id: randomUUID(),
          schoolId,
          userId,
          level: item.adminLevel,
          department: item.adminLevel.startsWith('HOD_') ? item.adminLevel.slice(4) : null,
          isActive: true,
          approvedBy: actor.id,
          approvedAt: now,
          createdAt: now,
        })))
      }

      const parentsToInsert = [
        ...parentRows.map(({ item, id, userId }) => ({
          id, userId, schoolId, firstName: item.firstName, lastName: item.lastName, gender: item.gender,
          phoneNumber: item.phoneNumber, address: item.address || null, occupation: item.occupation,
          profileImage: item.profileImage, facialVerificationVideo: item.facialVerificationVideo || null, createdAt: now, updatedAt: now,
        })),
        ...teacherRows.filter(({ item }) => item.isAlsoParent).map(({ item, userId }) => ({
          id: teacherParentIdByEmail.get(item.email)!, userId, schoolId, firstName: item.firstName, lastName: item.lastName,
          gender: item.gender, phoneNumber: item.phoneNumber, address: null, occupation: 'Teacher',
          profileImage: item.profileImage || null, facialVerificationVideo: item.facialVerificationVideo || null, createdAt: now, updatedAt: now,
        })),
      ]
      await tx.insert(parent).values(parentsToInsert)

      const studentInserts = studentEnrollmentRows.map(({ item, id, userId, admissionNumber, sessionId, termId }) => {
        const parentEmail = item.parentEmail || wardOwner.get(admissionNumber.toUpperCase())
        const parentId = parentEmail
          ? parentIdByEmail.get(parentEmail) || teacherParentIdByEmail.get(parentEmail) || null
          : null
        return {
          id, userId, schoolId, firstName: item.firstName, middleName: item.middleName || null,
          lastName: item.lastName, gender: item.gender, class: item.class, department: item.department || null,
          admissionNumber, parentId, dateOfBirth: item.dateOfBirth, dateOfResumption: item.dateOfResumption,
          sessionId, termId, subjectsDone: item.subjectsDone, profileImage: item.profileImage, facialVerificationVideo: item.facialVerificationVideo || null, isActive: true,
          registrationPaid: false, registrationReference: paymentReference, enrollmentType: 'ADMIN',
          registrationStatus: 'PENDING_PAYMENT', createdAt: now, updatedAt: now,
        }
      })
      await tx.insert(student).values(studentInserts)

      const teacherInserts = teacherRows.map(({ item, id, userId, staffCode }) => ({
        id, userId, schoolId, firstName: item.firstName, lastName: item.lastName,
        department: item.department || null, staffCode, phoneNumber: item.phoneNumber,
        gender: item.gender, type: item.type, isPartTime: item.type === 'PART_TIME',
        handlingClasses: item.handlingClasses, teachingSubjects: item.teachingSubjects,
        presentDays: item.presentDays, resumptionDate: item.resumptionDate,
        resumptionTime: item.resumptionTime || null, bio: item.bio || null, qualification: item.qualification || null,
        specialization: item.specialization || null, profileImage: item.profileImage || null,
        facialVerificationVideo: item.facialVerificationVideo || null,
        applicationLetterUrl: item.applicationLetterUrl || null, cvUrl: item.cvUrl || null,
        status: 'APPROVED', isActive: true, createdAt: now, updatedAt: now,
      }))
      await tx.insert(teacher).values(teacherInserts)

      const createdAdmissions = new Set(studentRows.map(({ admissionNumber }) => admissionNumber.toUpperCase()))
      for (const [admissionNumber, email] of wardOwner) {
        if (createdAdmissions.has(admissionNumber)) continue
        const parentId = parentIdByEmail.get(email) || teacherParentIdByEmail.get(email)
        if (!parentId) throw new Error(`No parent record was provided for admission number ${admissionNumber}.`)
        const ward = await tx.query.student.findFirst({
          where: and(eq(student.admissionNumber, admissionNumber), eq(student.schoolId, schoolId)),
        })
        if (!ward || ward.parentId) throw new Error(`Admission number ${admissionNumber} is unavailable in this school.`)
        const linked = await tx.update(student)
          .set({ parentId, updatedAt: now })
          .where(and(eq(student.id, ward.id), eq(student.schoolId, schoolId), isNull(student.parentId)))
          .returning({ id: student.id })
        if (!linked.length) throw new Error(`Admission number ${admissionNumber} could not be linked to its parent.`)
      }

      if (studentRows.length) {
        await tx.insert(schoolRegistrationBatches).values({
          id: batchId,
          schoolId,
          createdBy: actor.id,
          paymentReference,
          studentIds: studentRows.map(({ id }) => id),
          studentCount: studentRows.length,
          amount: totalAmount.toFixed(2),
          status: 'PENDING',
          createdAt: now,
          updatedAt: now,
        })
      }
    })
  } catch (error) {
    for (const userId of authUserIds) {
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
      if (deleteError) console.error('Could not roll back a school account after database registration failed.', deleteError)
    }
    throw error
  }

  const emailResults = await Promise.allSettled(provisioned.map((account) => sendSchoolAccountEmail({
    to: account.email,
    name: account.name,
    role: account.role === 'SCHOOL_ADMIN' ? account.adminLevel?.replaceAll('_', ' ') || 'School Administrator' : account.role,
    schoolName: schoolRecord.name,
    schoolLogoUrl: schoolRecord.logoUrl,
    accountIdentifier: account.accountIdentifier,
    temporaryPassword: account.password,
  })))
  const emailDeliveryFailures = emailResults.flatMap((result, index) => {
    if (result.status === 'fulfilled') return []
    console.error('School member onboarding email could not be delivered.', {
      recipient: provisioned[index].email,
      error: result.reason,
    })
    return [provisioned[index].email]
  })

  const checkoutUrl = studentRows.length
    ? await startBatchCheckout(
      batchId, paymentReference, actor.email || '', actor.name || schoolRecord.adminName,
      schoolRecord.name, schoolId, totalAmount,
    )
    : null

  revalidatePath('/dashboard/admin/users/students/list')
  revalidatePath('/dashboard/admin/users/teachers/list')
  revalidatePath('/dashboard/admin/users/parents/list')
  revalidatePath('/dashboard/admin/users/admins/list')

  return {
    success: true,
    batchId: studentRows.length ? batchId : null,
    checkoutUrl,
    paymentInitializationFailed: studentRows.length > 0 && !checkoutUrl,
    studentCount: studentRows.length,
    teacherCount: teacherRows.length,
    parentCount: parentRows.length + teacherRows.filter(({ item }) => item.isAlsoParent).length,
    adminCount: adminRows.length,
    emailDeliveryFailures,
    admissionNumbers: studentRows.map(({ admissionNumber }) => admissionNumber),
    staffCodes: teacherRows.map(({ staffCode }) => staffCode),
    totalAmount,
  }
}

export async function retrySchoolRegistrationBatchPaymentAction(batchId: string) {
  const { user: actor, school: schoolRecord } = await getSchoolAdminContext()
  const batch = await db.query.schoolRegistrationBatches.findFirst({
    where: and(eq(schoolRegistrationBatches.id, batchId), eq(schoolRegistrationBatches.schoolId, schoolRecord.id)),
  })
  if (!batch || batch.status !== 'FAILED') throw new Error('This registration batch is not eligible for payment retry.')

  const paymentReference = `EL-BULK-REG-${randomUUID().replaceAll('-', '').toUpperCase()}`
  const claimed = await db.update(schoolRegistrationBatches)
    .set({ paymentReference, status: 'PENDING', updatedAt: new Date() })
    .where(and(
      eq(schoolRegistrationBatches.id, batch.id),
      eq(schoolRegistrationBatches.schoolId, schoolRecord.id),
      eq(schoolRegistrationBatches.status, 'FAILED'),
    ))
    .returning({ id: schoolRegistrationBatches.id })
  if (!claimed.length) throw new Error('This registration batch has already been retried.')

  await db.update(student)
    .set({ registrationReference: paymentReference, updatedAt: new Date() })
    .where(and(eq(student.schoolId, schoolRecord.id), inArray(student.id, batch.studentIds as string[])))

  const checkoutUrl = await startBatchCheckout(
    batch.id, paymentReference, actor.email || '', actor.name || schoolRecord.adminName,
    schoolRecord.name, schoolRecord.id, Number(batch.amount),
  )
  if (!checkoutUrl) throw new Error('Payment could not be started. The registration batch remains eligible for retry.')
  return { success: true, checkoutUrl, paymentReference }
}
