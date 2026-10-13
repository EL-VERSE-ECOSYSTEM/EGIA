'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { schoolPaymentConfig, school as schoolTable } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function getSchoolPaymentConfigAction(schoolId?: string) {
  const session = await auth.getSession()
  const user = session?.user
  if (!user) return null

  const isSuperAdmin = user.role === 'SUPER_ADMIN'
  const targetSchoolId = isSuperAdmin ? schoolId || user.schoolId : user.schoolId
  if (!targetSchoolId || (schoolId && !isSuperAdmin && schoolId !== targetSchoolId)) return null

  const schoolRec = await db.query.school.findFirst({
    where: eq(schoolTable.id, targetSchoolId)
  })

  const config = await db.query.schoolPaymentConfig.findFirst({
    where: eq(schoolPaymentConfig.schoolId, targetSchoolId)
  })

  return {
    ...config,
    schoolName: schoolRec?.name || 'School Bank Account',
    useKorapay: config ? config.useKorapay : true,
    bankName: config?.bankName || '',
    accountNumber: config?.accountNumber || '',
    accountName: config?.accountName || (schoolRec?.name ? `${schoolRec.name} Official Account` : ''),
    customPaymentLink: config?.customPaymentLink || '',
    instructions: config?.instructions || ''
  }
}

export async function saveSchoolPaymentConfigAction(data: {
  schoolId?: string
  useKorapay: boolean
  bankName?: string
  accountNumber?: string
  accountName?: string
  customPaymentLink?: string
  instructions?: string
}) {
  const session = await auth.getSession()
  const user = session?.user
  if (!user || !['ADMIN', 'SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
    throw new Error('Unauthorized')
  }

  const isSuperAdmin = user.role === 'SUPER_ADMIN'
  const targetSchoolId = isSuperAdmin ? data.schoolId || user.schoolId : user.schoolId
  if (!targetSchoolId || (data.schoolId && !isSuperAdmin && data.schoolId !== targetSchoolId)) {
    throw new Error('Forbidden: You can only manage payment settings for your own school.')
  }

  if (!data.useKorapay) {
    if (!data.bankName || !data.accountNumber || !data.accountName) {
      throw new Error('Bank Name, Account Number, and Account Name are required when Korapay is disabled.')
    }
  }

  const existing = await db.query.schoolPaymentConfig.findFirst({
    where: eq(schoolPaymentConfig.schoolId, targetSchoolId)
  })

  if (existing) {
    await db.update(schoolPaymentConfig)
      .set({
        useKorapay: data.useKorapay,
        bankName: data.bankName || null,
        accountNumber: data.accountNumber || null,
        accountName: data.accountName || null,
        customPaymentLink: data.customPaymentLink || null,
        instructions: data.instructions || null,
        updatedAt: new Date()
      })
      .where(eq(schoolPaymentConfig.schoolId, targetSchoolId))
  } else {
    await db.insert(schoolPaymentConfig).values({
      schoolId: targetSchoolId,
      useKorapay: data.useKorapay,
      bankName: data.bankName || null,
      accountNumber: data.accountNumber || null,
      accountName: data.accountName || null,
      customPaymentLink: data.customPaymentLink || null,
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
