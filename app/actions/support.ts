'use server'

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createSupportTicket(data: {
  title: string
  category: string
  priority: string
  description: string
}) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const ticketNumber = `SUP-${Math.floor(100000 + Math.random() * 900000)}`

  const ticket = await prisma.supportTicket.create({
    data: {
      ...data,
      ticketNumber,
      userId: session.user.id,
      status: "OPEN"
    }
  })

  revalidatePath("/dashboard/parent/communication/support/my-tickets")
  revalidatePath("/dashboard/student/communication/support/my-tickets")
  return ticket
}

export async function createDispute(data: {
  title: string
  category: string
  priority: string
  description: string
  studentId?: string
}) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const ticketNumber = `DIS-${Math.floor(100000 + Math.random() * 900000)}`

  const dispute = await prisma.dispute.create({
    data: {
      ...data,
      ticketNumber,
      raisedById: session.user.id,
      status: "OPEN"
    }
  })

  revalidatePath("/dashboard/parent/communication/disputes/open")
  return dispute
}

export async function resolveDispute(disputeId: string, resolution: string) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized")

  const dispute = await prisma.dispute.update({
    where: { id: disputeId },
    data: {
      status: "RESOLVED",
      resolution,
      updatedAt: new Date()
    }
  })

  revalidatePath("/dashboard/admin/communication/disputes/resolved")
  return dispute
}
