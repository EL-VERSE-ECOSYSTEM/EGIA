'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { schoolPaymentConfig, school as schoolTable, student, parent } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { canSchoolAdminAccess } from '@/lib/auth/school-admin-permissions'

export async function getSchoolPaymentConfigAction(schoolId?: string) {
  const session = await auth.getSession()
  const user = session?.user
  if (!user) return null

  const role = user.role.toUpperCase()
  if (!['PARENT', 'STUDENT', 'PUPIL', 'ADMIN', 'SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(role)) return null
  if (role === 'SCHOOL_ADMIN' && !canSchoolAdminAccess(user.adminLevel, 'read', 'payment')) return null
  const isSuperAdmin = role === 'SUPER_ADMIN'
  let targetSchoolId = isSuperAdmin ? schoolId || user.schoolId : user.schoolId
  if (role === 'PARENT') {
    const profile = await db.query.parent.findFirst({ where: eq(parent.userId, user.id) })
    if (schoolId) {
      const linkedChild = profile && await db.query.student.findFirst({
        where: and(eq(student.parentId, profile.id), eq(student.schoolId, schoolId)),
      })
      if (!linkedChild) return null
      targetSchoolId = schoolId
    } else {
      targetSchoolId = profile?.schoolId || targetSchoolId
    }
  } else if (role === 'STUDENT' || role === 'PUPIL') {
    const profile = await db.query.student.findFirst({ where: eq(student.userId, user.id) })
    targetSchoolId = profile?.schoolId || targetSchoolId
  }
  if (!targetSchoolId || (schoolId && !isSuperAdmin && schoolId !== targetSchoolId)) return null

  const schoolRec = await db.query.school.findFirst({
    where: eq(schoolTable.id, targetSchoolId)
  })

  const config = await db.query.schoolPaymentConfig.findFirst({
    where: eq(schoolPaymentConfig.schoolId, targetSchoolId)
  })
  if (config?.isActive === false) return null

  return {
    ...config,
    schoolName: schoolRec?.name || 'School Bank Account',
    usePaystack: config ? ((config as any).usePaystack ?? (config as any).useKorapay ?? true) : true,
    bankName: config?.bankName || '',
    accountNumber: config?.accountNumber || '',
    accountName: config?.accountName || (schoolRec?.name ? `${schoolRec.name} Official Account` : ''),
    customPaymentLink: config?.customPaymentLink || '',
    instructions: config?.instructions || ''
  }
}

export async function saveSchoolPaymentConfigAction(data: {
  schoolId?: string
  usePaystack: boolean
  bankName?: string
  accountNumber?: string
  accountName?: string
  customPaymentLink?: string
  instructions?: string
}) {
  if (!data || typeof data.usePaystack !== 'boolean' ||
    (data.bankName && data.bankName.length > 120) ||
    (data.accountNumber && data.accountNumber.length > 40) ||
    (data.accountName && data.accountName.length > 120) ||
    (data.instructions && data.instructions.length > 2000) ||
    (data.customPaymentLink && data.customPaymentLink.length > 2048)) {
    throw new Error('Invalid school payment settings.')
  }
  let customPaymentLink: string | null = null
  if (data.customPaymentLink?.trim()) {
    let parsedLink: URL
    try {
      parsedLink = new URL(data.customPaymentLink.trim())
    } catch {
      throw new Error('Custom payment link must be a valid HTTPS URL.')
    }
    if (parsedLink.protocol !== 'https:' || parsedLink.username || parsedLink.password) {
      throw new Error('Custom payment link must be a valid HTTPS URL.')
    }
    customPaymentLink = parsedLink.toString()
  }

  const session = await auth.getSession()
  const user = session?.user
  const role = user?.role.toUpperCase()
  if (!user || !role || !['ADMIN', 'SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(role)) {
    throw new Error('Unauthorized')
  }
  if (role === 'SCHOOL_ADMIN' && !canSchoolAdminAccess(user.adminLevel, 'update', 'payment')) {
    throw new Error('Only a primary school administrator can update payment settings.')
  }

  const isSuperAdmin = role === 'SUPER_ADMIN'
  const targetSchoolId = isSuperAdmin ? data.schoolId || user.schoolId : user.schoolId
  if (!targetSchoolId || (data.schoolId && !isSuperAdmin && data.schoolId !== targetSchoolId)) {
    throw new Error('Forbidden: You can only manage payment settings for your own school.')
  }

  if (!data.usePaystack) {
    if (!data.bankName || !data.accountNumber || !data.accountName) {
      throw new Error('Bank Name, Account Number, and Account Name are required when Paystack is disabled.')
    }
  }

  const existing = await db.query.schoolPaymentConfig.findFirst({
    where: eq(schoolPaymentConfig.schoolId, targetSchoolId)
  })

  if (existing) {
    await db.update(schoolPaymentConfig)
      .set({
        useKorapay: data.usePaystack,
        bankName: data.bankName || null,
        accountNumber: data.accountNumber || null,
        accountName: data.accountName || null,
        customPaymentLink,
        instructions: data.instructions || null,
        updatedAt: new Date()
      })
      .where(eq(schoolPaymentConfig.schoolId, targetSchoolId))
  } else {
    await db.insert(schoolPaymentConfig).values({
      schoolId: targetSchoolId,
      useKorapay: data.usePaystack,
      bankName: data.bankName || null,
      accountNumber: data.accountNumber || null,
      accountName: data.accountName || null,
      customPaymentLink,
      instructions: data.instructions || null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    })
  }

  revalidatePath('/dashboard/admin/settings/payment')
  revalidatePath('/dashboard/parent/payments/make-payment')
  return { success: true }
}
