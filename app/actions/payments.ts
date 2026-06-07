'use server'

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function submitPaymentReceipt(data: {
  studentId: string
  amount: number
  feeType: string
  bankName: string
  receiptImage: string
}) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const ref = `ELG-MANUAL-${Date.now()}`

  const payment = await prisma.payment.create({
    data: {
      studentId: data.studentId,
      amount: data.amount,
      feeType: data.feeType,
      bankName: data.bankName,
      receiptImage: data.receiptImage,
      transactionReference: ref,
      status: "PENDING"
    }
  })

  revalidatePath("/dashboard/parent/payments/history")
  return payment
}

export async function verifyPayment(paymentId: string, status: "SUCCESS" | "FAILED") {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized")

  const payment = await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status,
      paidAt: status === "SUCCESS" ? new Date() : null
    }
  })

  revalidatePath("/dashboard/admin/finance/fees/payments")
  return payment
}
