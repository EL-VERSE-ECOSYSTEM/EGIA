'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { schoolPaymentConfig } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function getSchoolPaymentConfigAction(schoolId?: string) {
  const session = await auth.getSession()
  const user = session?.user as any
  const targetSchoolId = schoolId || user?.schoolId || 'school-elgoodnews-001'

  const config = await db.query.schoolPaymentConfig.findFirst({
    where: eq(schoolPaymentConfig.schoolId, targetSchoolId)
  })

  return config || null
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
  const user = session?.user as any
  if (!user || user.role !== 'ADMIN') throw new Error('Unauthorized')

  const targetSchoolId = data.schoolId || user.schoolId || 'school-elgoodnews-001'

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
