import { db } from '@/lib/db'
import { student, parent, payment, assessmentResult } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

export async function linkChildToParent(admissionNumber: string, parentId: string) {
  return await db.update(student)
    .set({ parentId })
    .where(eq(student.admissionNumber, admissionNumber))
}

export async function createPayment(data: {
  studentId: string,
  parentId: string,
  amount: string,
  feeType: string,
  method: string,
  reference: string
}) {
  return await db.insert(payment).values({
    id: uuidv4(),
    studentId: data.studentId,
    parentId: data.parentId,
    amount: data.amount,
    feeType: data.feeType,
    paymentMethod: data.method,
    transactionReference: data.reference,
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date()
  })
}

export async function submitAssessmentResult(data: any) {
  return await db.insert(assessmentResult).values({
    id: uuidv4(),
    ...data,
    createdAt: new Date(),
    updatedAt: new Date()
  })
}
