'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { assessment, teacher, class_, student, teacherWallet, teacherRequest } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { getCachedData } from '@/lib/cache'

async function getUserId() {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function createAssessment(data: any) {
  const result = await db.insert(assessment).values({
    id: crypto.randomUUID(),
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning()
  revalidatePath('/dashboard/teacher/assessments')
  return result[0]
}

export async function getTeacherProfile() {
  const userId = await getUserId()

  // Optimize performance using our custom caching system (caches for 2 minutes)
  return getCachedData(`teacher-profile:${userId}`, async () => {
    return db.query.teacher.findFirst({
      where: eq(teacher.userId, userId),
      with: {
        classes: true,
        subjects: true
      }
    })
  }, 120)
}

export async function getStudentsInClass(classId: string) {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')

  const teacherProfile = await db.query.teacher.findFirst({
    where: eq(teacher.userId, session.user.id)
  })

  const classData = await db.query.class_.findFirst({
    where: eq(class_.id, classId)
  })
  if (!classData) throw new Error('Class not found')

  // Restrict visibility for part-time teachers according to handled classes
  if (teacherProfile && teacherProfile.isPartTime) {
    const allowedClasses = (teacherProfile.handlingClasses as string[]) || []
    if (!allowedClasses.includes(classData.name)) {
      return []
    }
  }

  // Return students sorted by class and then alphabetically by last name, first name
  return db.query.student.findMany({
    where: eq(student.class, classData.name),
    orderBy: (student, { asc }) => [asc(student.lastName), asc(student.firstName)],
    with: {
      parent: {
        with: {
          user: true
        }
      }
    }
  })
}

// ===== TEACHER WALLET & REQUEST ACTIONS =====

export async function getTeacherWallet() {
  const userId = await getUserId()
  const teacherProfile = await db.query.teacher.findFirst({
    where: eq(teacher.userId, userId)
  })
  if (!teacherProfile) throw new Error('Teacher not found')

  let wallet = await db.query.teacherWallet.findFirst({
    where: eq(teacherWallet.teacherId, teacherProfile.id)
  })

  if (!wallet) {
    const results = await db.insert(teacherWallet).values({
      id: randomUUID(),
      teacherId: teacherProfile.id,
      balance: '150000.00', // Initialize with 150k as default mock balance
      salaryAmount: '150000.00',
      salaryStatus: 'pending',
    }).returning()
    wallet = results[0]
  }

  return wallet
}

export async function getTeacherRequests() {
  const userId = await getUserId()
  const teacherProfile = await db.query.teacher.findFirst({
    where: eq(teacher.userId, userId)
  })
  if (!teacherProfile) throw new Error('Teacher not found')

  return await db.query.teacherRequest.findMany({
    where: eq(teacherRequest.teacherId, teacherProfile.id),
    orderBy: [desc(teacherRequest.createdAt)]
  })
}

export async function createDataAirtimeRequest(data: {
  type: string
  amount: number
  details: string
  phoneNumber: string
}) {
  const userId = await getUserId()
  const teacherProfile = await db.query.teacher.findFirst({
    where: eq(teacher.userId, userId)
  })
  if (!teacherProfile) throw new Error('Teacher not found')

  const wallet = await getTeacherWallet()
  if (parseFloat(wallet.balance || '0') < data.amount) {
    throw new Error('Insufficient wallet balance.')
  }

  const result = await db.insert(teacherRequest).values({
    id: randomUUID(),
    teacherId: teacherProfile.id,
    type: data.type,
    amount: data.amount.toString(),
    details: data.details,
    phoneNumber: data.phoneNumber,
    status: 'pending',
  }).returning()

  // Deduct from wallet balance immediately (pending deduction)
  const newBalance = (parseFloat(wallet.balance || '0') - data.amount).toFixed(2)
  await db.update(teacherWallet)
    .set({ balance: newBalance, updatedAt: new Date() })
    .where(eq(teacherWallet.id, wallet.id))

  revalidatePath('/dashboard/teacher/wallet')
  return result[0]
}

export async function getAdminTeacherRequests() {
  // Query requests with teacher profile names
  const list = await db.select().from(teacherRequest).orderBy(desc(teacherRequest.createdAt))
  const result: Array<any> = []
  for (const item of list) {
    const t = await db.query.teacher.findFirst({
      where: eq(teacher.id, item.teacherId)
    })
    result.push({
      ...item,
      teacherName: t ? `${t.firstName} ${t.lastName}` : 'Academy Staff'
    })
  }
  return result
}

export async function getAllTeachersWithWallets() {
  const list = await db.select().from(teacher)
  const result: Array<any> = []
  for (const t of list) {
    let wallet = await db.query.teacherWallet.findFirst({
      where: eq(teacherWallet.teacherId, t.id)
    })
    if (!wallet) {
      const wResults = await db.insert(teacherWallet).values({
        id: randomUUID(),
        teacherId: t.id,
        balance: '150000.00',
        salaryAmount: '150000.00',
        salaryStatus: 'pending',
      }).returning()
      wallet = wResults[0]
    }
    result.push({
      ...t,
      wallet
    })
  }
  return result
}

export async function approveTeacherRequest(requestId: string, status: 'approved' | 'rejected') {
  const requestRecord = await db.query.teacherRequest.findFirst({
    where: eq(teacherRequest.id, requestId)
  })
  if (!requestRecord) throw new Error('Request not found')

  const result = await db.update(teacherRequest)
    .set({ status, updatedAt: new Date() })
    .where(eq(teacherRequest.id, requestId))
    .returning()

  // If rejected, refund the deducted amount back to their wallet
  if (status === 'rejected') {
    const wallet = await db.query.teacherWallet.findFirst({
      where: eq(teacherWallet.teacherId, requestRecord.teacherId)
    })
    if (wallet) {
      const refundedBalance = (parseFloat(wallet.balance || '0') + parseFloat(requestRecord.amount)).toFixed(2)
      await db.update(teacherWallet)
        .set({ balance: refundedBalance, updatedAt: new Date() })
        .where(eq(teacherWallet.id, wallet.id))
    }
  }

  revalidatePath('/dashboard/teacher/wallet')
  revalidatePath('/dashboard/admin/finance/teacher-requests')
  return result[0]
}

export async function payTeacherSalary(teacherId: string) {
  const wallet = await db.query.teacherWallet.findFirst({
    where: eq(teacherWallet.teacherId, teacherId)
  })
  if (!wallet) throw new Error('Wallet not found')

  const result = await db.update(teacherWallet)
    .set({
      salaryStatus: 'paid',
      balance: (parseFloat(wallet.balance || '0') + parseFloat(wallet.salaryAmount || '150000.00')).toFixed(2),
      updatedAt: new Date()
    })
    .where(eq(teacherWallet.id, wallet.id))
    .returning()

  revalidatePath('/dashboard/teacher/wallet')
  revalidatePath('/dashboard/admin/finance/teacher-requests')
  return result[0]
}

export async function updateTeacherSubjects(subjects: string[]) {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')

  await db.update(teacher)
    .set({
      teachingSubjects: subjects,
      updatedAt: new Date()
    })
    .where(eq(teacher.userId, session.user.id))

  revalidatePath('/dashboard/teacher/overview')
  return { success: true }
}

export async function getStudentsBySubject(subjectName: string) {
  const studentsList = await db.query.student.findMany()
  // Filter students whose 'subjectsDone' list contains this subject name
  return studentsList.filter(s => {
    const subjects = (s.subjectsDone as string[]) || []
    return subjects.map(x => x.toLowerCase()).includes(subjectName.toLowerCase())
  })
}

export async function getStudentFullProfile(studentId: string) {
  return db.query.student.findFirst({
    where: eq(student.id, studentId),
    with: {
      parent: {
        with: {
          user: true
        }
      },
      results: {
        with: {
          assessment: true
        }
      },
      attendance: true,
      payments: true
    }
  })
}
