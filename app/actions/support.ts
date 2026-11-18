'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { dispute, disputeMessage, parent, payment, student, supportTicket, supportTicketReply, user } from '@/lib/db/schema'
import { and, desc, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { randomUUID } from 'crypto'
import { isSuperAdminEmail, isSuperAdminUser } from '@/lib/auth/super-admin'

function requireText(value: string, label: string, maxLength: number) {
  const normalized = value.trim()
  if (!normalized || normalized.length > maxLength) {
    throw new Error(`${label} is required and must be no more than ${maxLength} characters.`)
  }
  return normalized
}

function createTicketNumber(prefix: 'SUP' | 'DIS') {
  return `${prefix}-${Date.now()}-${randomUUID().slice(0, 6).toUpperCase()}`
}

async function notifyAdmins(roleTargets: string[], schoolId: string | null, notice: { title: string; body: string; type: string; data: Record<string, unknown>; eventKey: string }) {
  try {
    const roleRows = await db.query.userRole.findMany()
    const candidates = [...new Set(roleRows.filter(row => roleTargets.includes(row.role.toUpperCase())).map(row => row.userId))]
    const recipients = await Promise.all(candidates.map(async id => ({ id, account: await db.query.user.findFirst({ where: eq(user.id, id), columns: { schoolId: true } }) })))
    const matching = recipients.filter(({ account }) => roleTargets.includes('SUPER_ADMIN') ? roleTargets.length === 1 : account?.schoolId === schoolId)
    const { sendPushNotification } = await import('@/lib/services/notifications')
    await Promise.all(matching.map(({ id }) => sendPushNotification({
      userId: id, ...notice, link: '/dashboard', eventKey: `${notice.eventKey}:${id}`,
    }).catch(error => console.error('Admin notification delivery failed', { recipientId: id, eventKey: notice.eventKey, error }))))
  } catch (error) {
    console.error('Unable to notify support administrators', { eventKey: notice.eventKey, error })
  }
}

async function isDisputeInAdministratorSchool(disputeRecord: typeof dispute.$inferSelect, administratorId: string) {
  const [raiser, administrator, relatedStudent, relatedPayment] = await Promise.all([
    db.query.user.findFirst({ where: eq(user.id, disputeRecord.raisedById) }),
    db.query.user.findFirst({ where: eq(user.id, administratorId) }),
    disputeRecord.relatedStudentId
      ? db.query.student.findFirst({ where: eq(student.id, disputeRecord.relatedStudentId) })
      : Promise.resolve(null),
    disputeRecord.relatedPaymentId
      ? db.query.payment.findFirst({ where: eq(payment.id, disputeRecord.relatedPaymentId) })
      : Promise.resolve(null),
  ])
  const referencedSchoolIds = [raiser?.schoolId, relatedStudent?.schoolId, relatedPayment?.schoolId]
    .filter((schoolId): schoolId is string => Boolean(schoolId))
  return Boolean(
    administrator?.schoolId &&
    referencedSchoolIds.length > 0 &&
    referencedSchoolIds.every((schoolId) => schoolId === administrator.schoolId),
  )
}

export async function createDispute(data: {
  title: string
  category: string
  priority: string
  description: string
  relatedStudentId?: string
  relatedPaymentId?: string
}) {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Sign in before raising a dispute.')
  const title = requireText(data.title, 'Dispute title', 160)
  const description = requireText(data.description, 'Dispute description', 5000)
  const role = session.user.role.toUpperCase()
  let relatedStudentId: string | null = null
  let actorSchoolId = session.user.schoolId || null
  let parentProfile: Awaited<ReturnType<typeof db.query.parent.findFirst>> | null | undefined
  let ownStudent: Awaited<ReturnType<typeof db.query.student.findFirst>> | null | undefined

  if (data.relatedStudentId) {
    const relatedStudent = await db.query.student.findFirst({
      where: eq(student.id, data.relatedStudentId),
    })
    if (!relatedStudent) throw new Error('The selected student was not found.')
    if (['STUDENT', 'PUPIL'].includes(role)) {
      ownStudent = await db.query.student.findFirst({
        where: eq(student.userId, session.user.id),
      })
      if (!ownStudent || relatedStudent.id !== ownStudent.id) {
        throw new Error('You can only raise a dispute for your own student account.')
      }
      actorSchoolId = ownStudent.schoolId
    } else if (role === 'PARENT') {
      parentProfile = await db.query.parent.findFirst({ where: eq(parent.userId, session.user.id) })
      if (!parentProfile || relatedStudent.parentId !== parentProfile.id ||
        !parentProfile.schoolId || relatedStudent.schoolId !== parentProfile.schoolId) {
        throw new Error('You can only raise a dispute for a linked student in your school.')
      }
      actorSchoolId = parentProfile.schoolId
    } else if (role !== 'SUPER_ADMIN') {
      if (!['TEACHER', 'ADMIN', 'SCHOOL_ADMIN'].includes(role) ||
        !session.user.schoolId || relatedStudent.schoolId !== session.user.schoolId) {
        throw new Error('You can only raise a dispute for a student in your school.')
      }
    }
    relatedStudentId = relatedStudent.id
  }

  let relatedPaymentId: string | null = null
  if (data.relatedPaymentId) {
    const relatedPayment = await db.query.payment.findFirst({
      where: eq(payment.id, data.relatedPaymentId),
    })
    if (!relatedPayment || !relatedPayment.schoolId) throw new Error('The selected payment was not found in an active school.')
    if (role !== 'SUPER_ADMIN' && (!actorSchoolId || relatedPayment.schoolId !== actorSchoolId)) {
      throw new Error('You can only raise a dispute about a payment from your school.')
    }
    if (role === 'PARENT') {
      parentProfile ||= await db.query.parent.findFirst({ where: eq(parent.userId, session.user.id) })
      if (!parentProfile || relatedPayment.parentId !== parentProfile.id) {
        throw new Error('You can only raise a dispute about a payment linked to your parent account.')
      }
    } else if (['STUDENT', 'PUPIL'].includes(role)) {
      ownStudent ||= await db.query.student.findFirst({ where: eq(student.userId, session.user.id) })
      if (!ownStudent || relatedPayment.studentId !== ownStudent.id) {
        throw new Error('You can only raise a dispute about your own student payment.')
      }
    } else if (role !== 'SUPER_ADMIN' && !['TEACHER', 'ADMIN', 'SCHOOL_ADMIN'].includes(role)) {
      throw new Error('Your account cannot raise a dispute about this payment.')
    }
    if (relatedStudentId && relatedPayment.studentId && relatedPayment.studentId !== relatedStudentId) {
      throw new Error('The selected student and payment do not match.')
    }
    if (!relatedStudentId && relatedPayment.studentId) {
      const paymentStudent = await db.query.student.findFirst({
        where: and(
          eq(student.id, relatedPayment.studentId),
          eq(student.schoolId, relatedPayment.schoolId),
        ),
      })
      if (!paymentStudent) throw new Error('The payment’s student does not belong to its school.')
      relatedStudentId = paymentStudent.id
    }
    relatedPaymentId = relatedPayment.id
  }

  const [created] = await db.insert(dispute).values({
    id: randomUUID(),
    ticketNumber: createTicketNumber('DIS'),
    title,
    category: requireText(data.category, 'Category', 80),
    priority: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(data.priority.toUpperCase())
      ? data.priority.toUpperCase()
      : 'MEDIUM',
    description,
    raisedById: session.user.id,
    relatedStudentId,
    relatedPaymentId,
    status: 'OPEN',
  }).returning()

  await notifyAdmins(['ADMIN', 'SCHOOL_ADMIN'], actorSchoolId, {
    title: `New dispute: ${created.ticketNumber}`,
    body: `${created.title} — ${created.description.slice(0, 220)}`,
    type: 'DISPUTE_NEW', data: { disputeId: created.id, ticketNumber: created.ticketNumber, schoolId: actorSchoolId },
    eventKey: `dispute-created:${created.id}`,
  })

  revalidatePath('/dashboard/admin/communication/disputes')
  revalidatePath('/dashboard/parent/communication/disputes')
  return created
}

export async function addDisputeMessage(disputeId: string, messageContent: string, isInternal = false) {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Sign in before replying to a dispute.')
  const message = requireText(messageContent, 'Message', 5000)
  const currentDispute = await db.query.dispute.findFirst({
    where: eq(dispute.id, disputeId),
  })
  if (!currentDispute) throw new Error('Dispute not found.')

  const role = session.user.role.toUpperCase()
  const isOwner = currentDispute.raisedById === session.user.id
  const isSchoolAdmin = ['ADMIN', 'SCHOOL_ADMIN'].includes(role)
  const canManageSchoolDispute = isSchoolAdmin &&
    await isDisputeInAdministratorSchool(currentDispute, session.user.id)
  if ((!isOwner && role !== 'SUPER_ADMIN' && !canManageSchoolDispute) || (isInternal && role !== 'SUPER_ADMIN')) {
    throw new Error('You are not allowed to reply to this dispute.')
  }

  const [newMessage] = await db.insert(disputeMessage).values({
    id: randomUUID(),
    disputeId,
    senderId: session.user.id,
    message,
    isInternal,
  }).returning()

  await db.update(dispute)
    .set({ updatedAt: new Date(), status: isOwner ? currentDispute.status : 'IN_PROGRESS' })
    .where(eq(dispute.id, disputeId))

  revalidatePath(`/dashboard/communication/disputes/${disputeId}`)
  return newMessage
}

export async function getMySupportTickets() {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Sign in to view your support tickets.')
  const tickets = await db.query.supportTicket.findMany({
    where: eq(supportTicket.userId, session.user.id),
    orderBy: [desc(supportTicket.updatedAt)],
  })
  return Promise.all(tickets.map(async (ticket) => ({
    ...ticket,
    replies: await db.query.supportTicketReply.findMany({
      where: eq(supportTicketReply.ticketId, ticket.id),
      orderBy: [desc(supportTicketReply.createdAt)],
    }),
  })))
}

export async function getSupportTicketReplies(ticketId: string) {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Sign in to view support replies.')
  const ticket = await db.query.supportTicket.findFirst({
    where: and(eq(supportTicket.id, ticketId), eq(supportTicket.userId, session.user.id)),
    columns: { id: true },
  })
  if (!ticket) throw new Error('Support ticket not found.')
  return db.query.supportTicketReply.findMany({
    where: eq(supportTicketReply.ticketId, ticketId),
    orderBy: [desc(supportTicketReply.createdAt)],
  })
}

export async function reopenSupportTicket(ticketId: string, message: string) {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Sign in to reopen a support ticket.')
  const detail = requireText(message, 'Issue update', 5000)
  const ticket = await db.query.supportTicket.findFirst({ where: and(
    eq(supportTicket.id, ticketId), eq(supportTicket.userId, session.user.id), eq(supportTicket.status, 'RESOLVED'),
  ) })
  if (!ticket) throw new Error('Only your resolved support tickets can be reopened.')
  await db.insert(supportTicketReply).values({ id: randomUUID(), ticketId, senderId: session.user.id, message: detail })
  await db.update(supportTicket).set({ status: 'OPEN', resolution: null, resolvedAt: null, updatedAt: new Date() }).where(and(
    eq(supportTicket.id, ticketId), eq(supportTicket.userId, session.user.id), eq(supportTicket.status, 'RESOLVED'),
  ))
  revalidatePath('/dashboard/parent/communication/support/my-tickets')
  revalidatePath('/dashboard/student/communication/support/my-tickets')
  revalidatePath('/dashboard/super-admin/support')
  return { success: true }
}

export async function getMyDisputes() {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Sign in to view your disputes.')
  const disputes = await db.query.dispute.findMany({
    where: eq(dispute.raisedById, session.user.id),
    orderBy: [desc(dispute.updatedAt)],
  })
  return Promise.all(disputes.map(async (item) => ({
    ...item,
    messages: await db.query.disputeMessage.findMany({
      where: and(eq(disputeMessage.disputeId, item.id), eq(disputeMessage.isInternal, false)),
      orderBy: [desc(disputeMessage.createdAt)],
    }),
  })))
}

export async function getSuperAdminDisputes() {
  const session = await auth.getSession()
  if (!session?.user || (session.user.role.toUpperCase() !== 'SUPER_ADMIN' && !(await isSuperAdminUser(session.user.id)) && !(await isSuperAdminEmail(session.user.email)))) throw new Error('Only Super Admins can view all disputes.')
  const records = await db.query.dispute.findMany({ orderBy: [desc(dispute.createdAt)] })
  return Promise.all(records.map(async item => ({
    ...item,
    raisedBy: await db.query.user.findFirst({ where: eq(user.id, item.raisedById), columns: { name: true, email: true, schoolId: true } }),
    messages: await db.query.disputeMessage.findMany({ where: and(eq(disputeMessage.disputeId, item.id), eq(disputeMessage.isInternal, false)), orderBy: [desc(disputeMessage.createdAt)] }),
  })))
}

export async function createSupportTicket(data: {
  title: string
  category: string
  priority: string
  description: string
  contactName?: string
  contactEmail?: string
  supportType?: 'APP' | 'SCHOOL'
}) {
  const session = await auth.getSession()
  const title = requireText(data.title, 'Ticket title', 160)
  const description = requireText(data.description, 'Ticket description', 5000)
  const contactName = session?.user
    ? (await db.query.user.findFirst({ where: eq(user.id, session.user.id) }))?.name || 'Portal user'
    : requireText(data.contactName || '', 'Contact name', 120)
  const contactEmail = session?.user
    ? session.user.email
    : requireText(data.contactEmail || '', 'Contact email', 254).toLowerCase()

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    throw new Error('Enter a valid contact email address.')
  }

  const supportType = data.supportType === 'SCHOOL' ? 'SCHOOL' : 'APP'
  let schoolId = session?.user.schoolId || null
  if (session?.user && !schoolId) {
    const role = session.user.role.toUpperCase()
    if (role === 'PARENT') schoolId = (await db.query.parent.findFirst({ where: eq(parent.userId, session.user.id), columns: { schoolId: true } }))?.schoolId || null
    if (role === 'STUDENT' || role === 'PUPIL') schoolId = (await db.query.student.findFirst({ where: eq(student.userId, session.user.id), columns: { schoolId: true } }))?.schoolId || null
  }
  if (supportType === 'SCHOOL' && (!session?.user || !schoolId)) throw new Error('School Support is available only to signed-in members of a school.')

  const [created] = await db.insert(supportTicket).values({
    id: randomUUID(),
    ticketNumber: createTicketNumber('SUP'),
    title,
    category: requireText(data.category, 'Category', 80),
    priority: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(data.priority.toUpperCase())
      ? data.priority.toUpperCase()
      : 'MEDIUM',
    description,
    userId: session?.user.id || null,
    schoolId,
    supportType,
    escalatedToSuperAdmin: session?.user.role.toUpperCase() === 'ADMIN' || session?.user.role.toUpperCase() === 'SCHOOL_ADMIN',
    contactName,
    contactEmail,
    status: 'OPEN',
  }).returning()

  if (supportType === 'SCHOOL' && schoolId) {
    await notifyAdmins(['ADMIN', 'SCHOOL_ADMIN'], schoolId, {
      title: `New school support ticket: ${created.ticketNumber}`,
      body: `${created.title} — ${created.description.slice(0, 220)}`,
      type: 'SUPPORT_NEW', data: { ticketId: created.id, ticketNumber: created.ticketNumber, schoolId },
      eventKey: `support-created:${created.id}`,
    })
  } else {
    await notifyAdmins(['SUPER_ADMIN'], null, {
      title: `New App Support ticket: ${created.ticketNumber}`,
      body: `${created.title} — ${created.description.slice(0, 220)}`,
      type: 'SUPPORT_NEW', data: { ticketId: created.id, ticketNumber: created.ticketNumber, schoolId },
      eventKey: `support-created:${created.id}`,
    })
  }

  revalidatePath('/dashboard/super-admin/support')
  return created
}

export async function resolveDispute(disputeId: string, resolution: string) {
  const session = await auth.getSession()
  if (!session?.user || (session.user.role.toUpperCase() !== 'SUPER_ADMIN' && !(await isSuperAdminUser(session.user.id)) && !(await isSuperAdminEmail(session.user.email))) ) {
    throw new Error('Only a Super Admin can finally close a dispute.')
  }
  const currentDispute = await db.query.dispute.findFirst({
    where: eq(dispute.id, disputeId),
  })
  if (!currentDispute) throw new Error('Dispute not found.')

  await db.update(dispute)
    .set({
      status: 'RESOLVED',
      resolution: requireText(resolution, 'Resolution', 5000),
      resolvedBy: session.user.id,
      resolvedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(dispute.id, disputeId))

  try {
    const { sendPushNotification } = await import('@/lib/services/notifications')
    await sendPushNotification({
      userId: currentDispute.raisedById,
      title: `Dispute resolved: ${currentDispute.ticketNumber}`,
      body: requireText(resolution, 'Resolution', 5000),
      type: 'DISPUTE_RESOLVED',
      data: { disputeId, ticketNumber: currentDispute.ticketNumber },
      link: '/dashboard',
      eventKey: `dispute-resolved:${disputeId}:${Date.now()}`,
    })
  } catch (error) {
    console.error('Dispute resolution notification failed', error)
  }

  revalidatePath('/dashboard/admin/communication/disputes')
  revalidatePath('/dashboard/parent/communication/disputes')
}
