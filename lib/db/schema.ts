import { text, timestamp, boolean, integer, numeric, date, jsonb, pgTable, foreignKey, unique } from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'

// ===== CORE USER TABLES =====
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  image: text('image'),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
})

export const userRole = pgTable('user_role', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull().unique(),
  role: text('role').notNull(), // ADMIN, TEACHER, PARENT, STUDENT
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  foreignKey({ columns: [t.userId], foreignColumns: [user.id] }).onDelete('cascade'),
])

export const reportCardTable = pgTable('report_card', {
  id: text('id').primaryKey(),
  studentId: text('studentId').notNull(),
  studentName: text('studentName').notNull(),
  className: text('className').notNull(),
  marks: jsonb('marks').notNull(),
  teacherRemarks: text('teacherRemarks'),
  status: text('status').default('PENDING'), // PENDING, ENDORSED, REJECTED
  adminFeedback: text('adminFeedback'),
  endorsedAt: timestamp('endorsedAt'),
  createdAt: timestamp('createdAt').defaultNow()
})

// ===== SCHOOL CORE TABLES =====
export const student = pgTable('student', {
  id: text('id').primaryKey(),
  userId: text('userId').unique(),
  firstName: text('firstName').notNull(),
  middleName: text('middleName'),
  lastName: text('lastName').notNull(),
  dateOfBirth: date('dateOfBirth'),
  dateOfResumption: date('dateOfResumption'),
  gender: text('gender'),
  class: text('class').notNull(),
  arm: text('arm'),
  department: text('department'),
  admissionNumber: text('admissionNumber').unique(),
  parentId: text('parentId'),
  termId: text('termId'),
  sessionId: text('sessionId'),
  profileImage: text('profileImage'),
  subjectsDone: jsonb('subjectsDone'),
  isActive: boolean('isActive').default(true),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  foreignKey({ columns: [t.userId], foreignColumns: [user.id] }).onDelete('cascade'),
  foreignKey({ columns: [t.parentId], foreignColumns: [parent.id] }).onDelete('set null'),
])

export const teacher = pgTable('teacher', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull().unique(),
  staffCode: text('staffCode').unique(),
  firstName: text('firstName').notNull(),
  lastName: text('lastName').notNull(),
  type: text('type').default('FULL_TIME'), // FULL_TIME, PART_TIME
  isClassTeacher: boolean('isClassTeacher').default(false),
  isPartTime: boolean('isPartTime').default(false),
  assignedClassId: text('assignedClassId'),
  daysPresent: jsonb('daysPresent'),
  handlingClasses: jsonb('handlingClasses'),
  teachingSubjects: jsonb('teachingSubjects'),
  presentDays: jsonb('presentDays'),
  resumptionTime: text('resumptionTime'),
  resumptionDate: date('resumptionDate'),
  bio: text('bio'),
  applicationLetterUrl: text('applicationLetterUrl'),
  cvUrl: text('cvUrl'),
  qualification: text('qualification'),
  specialization: text('specialization'),
  profileImage: text('profileImage'),
  status: text('status').default('PENDING'),
  isActive: boolean('isActive').default(true),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  foreignKey({ columns: [t.userId], foreignColumns: [user.id] }).onDelete('cascade'),
])

export const parent = pgTable('parent', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull().unique(),
  firstName: text('firstName').notNull(),
  lastName: text('lastName').notNull(),
  phoneNumber: text('phoneNumber'),
  address: text('address'),
  profileImage: text('profileImage'),
  occupation: text('occupation'),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  foreignKey({ columns: [t.userId], foreignColumns: [user.id] }).onDelete('cascade'),
])

// ===== ACADEMIC STRUCTURE =====
export const academicSession = pgTable('academic_session', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  startDate: date('startDate').notNull(),
  endDate: date('endDate').notNull(),
  isCurrent: boolean('isCurrent').default(false),
})

export const term = pgTable('term', {
  id: text('id').primaryKey(),
  sessionId: text('sessionId').notNull(),
  name: text('name').notNull(),
  startDate: date('startDate').notNull(),
  endDate: date('endDate').notNull(),
  isCurrent: boolean('isCurrent').default(false),
}, (t) => [
  foreignKey({ columns: [t.sessionId], foreignColumns: [academicSession.id] }),
])

export const class_ = pgTable('class', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  teacherId: text('teacherId'),
}, (t) => [
  foreignKey({ columns: [t.teacherId], foreignColumns: [teacher.id] }),
])

export const subject = pgTable('subject', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code').unique(),
})

export const teacherOnSubject = pgTable('teacher_on_subject', {
  id: text('id').primaryKey(),
  teacherId: text('teacherId').notNull(),
  subjectId: text('subjectId').notNull(),
  classId: text('classId').notNull(),
}, (t) => [
  foreignKey({ columns: [t.teacherId], foreignColumns: [teacher.id] }),
  foreignKey({ columns: [t.subjectId], foreignColumns: [subject.id] }),
  foreignKey({ columns: [t.classId], foreignColumns: [class_.id] }),
])

// ===== PROMOTION & DEMOTION HISTORY =====
export const promotionHistory = pgTable('promotion_history', {
  id: text('id').primaryKey(),
  studentId: text('studentId').notNull(),
  fromClass: text('fromClass').notNull(),
  toClass: text('toClass').notNull(),
  type: text('type').notNull(), // PROMOTION, DEMOTION
  reason: text('reason'),
  adminComment: text('adminComment'),
  performedBy: text('performedBy').notNull(),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  foreignKey({ columns: [t.studentId], foreignColumns: [student.id] }),
  foreignKey({ columns: [t.performedBy], foreignColumns: [user.id] }),
])

// ===== CBT & ASSESSMENT =====
export const assessment = pgTable('assessment', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  subjectId: text('subjectId').notNull(),
  termId: text('termId').notNull(),
  createdBy: text('createdBy').notNull(),
  duration: integer('duration').notNull(),
  type: text('type').notNull(),
  status: text('status').default('draft'),
  passingScore: integer('passingScore').default(40),
  totalPoints: integer('totalPoints').default(100),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  foreignKey({ columns: [t.subjectId], foreignColumns: [subject.id] }),
  foreignKey({ columns: [t.termId], foreignColumns: [term.id] }),
  foreignKey({ columns: [t.createdBy], foreignColumns: [teacher.id] }),
])

export const assessmentQuestion = pgTable('assessment_question', {
  id: text('id').primaryKey(),
  assessmentId: text('assessmentId').notNull(),
  questionText: text('questionText').notNull(),
  questionType: text('questionType').notNull(),
  options: jsonb('options'),
  correctAnswer: text('correctAnswer'),
  points: integer('points').default(1),
  explanation: text('explanation'),
  order: integer('order').notNull(),
}, (t) => [
  foreignKey({ columns: [t.assessmentId], foreignColumns: [assessment.id] }).onDelete('cascade'),
])

export const assessmentResult = pgTable('assessment_result', {
  id: text('id').primaryKey(),
  assessmentId: text('assessmentId').notNull(),
  studentId: text('studentId').notNull(),
  score: numeric('score', { precision: 5, scale: 2 }).notNull(),
  totalQuestions: integer('totalQuestions').notNull(),
  correctAnswers: integer('correctAnswers').notNull(),
  timeSpent: integer('timeSpent').notNull(),
  status: text('status').notNull(),
  gradedBy: text('gradedBy'),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  foreignKey({ columns: [t.assessmentId], foreignColumns: [assessment.id] }),
  foreignKey({ columns: [t.studentId], foreignColumns: [student.id] }),
])

export const studentAnswer = pgTable('student_answer', {
  id: text('id').primaryKey(),
  assessmentResultId: text('assessmentResultId').notNull(),
  questionId: text('questionId').notNull(),
  answerText: text('answerText'),
  isCorrect: boolean('isCorrect'),
  pointsEarned: integer('pointsEarned'),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  foreignKey({ columns: [t.assessmentResultId], foreignColumns: [assessmentResult.id] }).onDelete('cascade'),
])

// ===== ATTENDANCE =====
export const attendance = pgTable('attendance', {
  id: text('id').primaryKey(),
  studentId: text('studentId').notNull(),
  classId: text('classId').notNull(),
  date: date('date').notNull(),
  status: text('status').notNull(),
  remarks: text('remarks'),
  recordedBy: text('recordedBy'),
  recordedAt: timestamp('recordedAt', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  foreignKey({ columns: [t.studentId], foreignColumns: [student.id] }),
  foreignKey({ columns: [t.classId], foreignColumns: [class_.id] }),
])

// ===== FEES & PAYMENTS =====
export const feeStructure = pgTable('fee_structure', {
  id: text('id').primaryKey(),
  class: text('class').notNull(),
  department: text('department'),
  feeType: text('feeType').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  dueDate: date('dueDate'),
  description: text('description'),
  isActive: boolean('isActive').default(true),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique().on(t.class, t.department, t.feeType),
])

export const payment = pgTable('payment', {
  id: text('id').primaryKey(),
  studentId: text('studentId').notNull(),
  parentId: text('parentId'),
  termId: text('termId'),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  feeType: text('feeType'),
  paymentMethod: text('paymentMethod').notNull(),
  transactionReference: text('transactionReference').unique(),
  korapayReference: text('korapayReference').unique(),
  receiptUrl: text('receiptUrl'),
  status: text('status').default('pending'),
  paymentDate: timestamp('paymentDate', { withTimezone: true }),
  paidAt: timestamp('paidAt', { withTimezone: true }),
  description: text('description'),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  foreignKey({ columns: [t.studentId], foreignColumns: [student.id] }),
])

export const paymentInstallment = pgTable('payment_installment', {
  id: text('id').primaryKey(),
  paymentId: text('paymentId').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  dueDate: date('dueDate').notNull(),
  paidAt: timestamp('paidAt', { withTimezone: true }),
  status: text('status').default('pending'),
  installmentNumber: integer('installmentNumber').notNull(),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  foreignKey({ columns: [t.paymentId], foreignColumns: [payment.id] }),
])

// ===== MESSAGING SYSTEM =====
export const conversation = pgTable('conversation', {
  id: text('id').primaryKey(),
  type: text('type').notNull(),
  name: text('name'),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
})

export const conversationParticipant = pgTable('conversation_participant', {
  id: text('id').primaryKey(),
  conversationId: text('conversationId').notNull(),
  userId: text('userId').notNull(),
  lastReadAt: timestamp('lastReadAt'),
  joinedAt: timestamp('joinedAt').defaultNow(),
}, (t) => [
  foreignKey({ columns: [t.conversationId], foreignColumns: [conversation.id] }),
  foreignKey({ columns: [t.userId], foreignColumns: [user.id] }),
])

export const message = pgTable('message', {
  id: text('id').primaryKey(),
  content: text('content').notNull(),
  senderId: text('senderId').notNull(),
  conversationId: text('conversationId').notNull(),
  attachments: jsonb('attachments'),
  isRead: boolean('isRead').default(false),
  isDeleted: boolean('isDeleted').default(false),
  replyToId: text('replyToId'),
  reactions: jsonb('reactions'),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  foreignKey({ columns: [t.senderId], foreignColumns: [user.id] }).onDelete('cascade'),
  foreignKey({ columns: [t.conversationId], foreignColumns: [conversation.id] }).onDelete('cascade'),
])

export const notification = pgTable('notification', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').notNull(),
  metadata: jsonb('metadata'),
  isRead: boolean('isRead').default(false),
  actionUrl: text('actionUrl'),
  readAt: timestamp('readAt', { withTimezone: true }),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  foreignKey({ columns: [t.userId], foreignColumns: [user.id] }).onDelete('cascade'),
])

// ===== DISPUTE & SUPPORT =====
export const dispute = pgTable('dispute', {
  id: text('id').primaryKey(),
  ticketNumber: text('ticketNumber').notNull().unique(),
  title: text('title').notNull(),
  category: text('category').notNull(),
  priority: text('priority').notNull(),
  status: text('status').default('OPEN'),
  description: text('description').notNull(),
  evidence: jsonb('evidence'),
  raisedById: text('raisedById').notNull(),
  assignedToId: text('assignedToId'),
  relatedStudentId: text('relatedStudentId'),
  relatedPaymentId: text('relatedPaymentId'),
  relatedAssessmentId: text('relatedAssessmentId'),
  resolution: text('resolution'),
  resolvedBy: text('resolvedBy'),
  resolvedAt: timestamp('resolvedAt', { withTimezone: true }),
  escalatedAt: timestamp('escalatedAt', { withTimezone: true }),
  escalatedTo: text('escalatedTo'),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  foreignKey({ columns: [t.raisedById], foreignColumns: [user.id] }).onDelete('cascade'),
])

export const disputeMessage = pgTable('dispute_message', {
  id: text('id').primaryKey(),
  disputeId: text('disputeId').notNull(),
  senderId: text('senderId').notNull(),
  message: text('message').notNull(),
  attachments: jsonb('attachments'),
  isInternal: boolean('isInternal').default(false),
  createdAt: timestamp('createdAt').defaultNow(),
}, (t) => [
  foreignKey({ columns: [t.disputeId], foreignColumns: [dispute.id] }),
  foreignKey({ columns: [t.senderId], foreignColumns: [user.id] }),
])

export const supportTicket = pgTable('support_ticket', {
  id: text('id').primaryKey(),
  ticketNumber: text('ticketNumber').notNull().unique(),
  title: text('title').notNull(),
  category: text('category').notNull(),
  priority: text('priority').notNull(),
  status: text('status').default('OPEN'),
  description: text('description').notNull(),
  screenshots: jsonb('screenshots'),
  userId: text('userId').notNull(),
  assignedAgentId: text('assignedAgentId'),
  resolution: text('resolution'),
  satisfaction: text('satisfaction'),
  resolvedAt: timestamp('resolvedAt', { withTimezone: true }),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  foreignKey({ columns: [t.userId], foreignColumns: [user.id] }),
])

export const abacPolicy = pgTable('abac_policy', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  role: text('role').notNull(),
  resource: text('resource').notNull(),
  action: text('action').notNull(),
  conditions: jsonb('conditions').notNull(),
  priority: integer('priority').default(0),
  effect: text('effect').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
})

export const auditLog = pgTable('audit_log', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  action: text('action').notNull(),
  resource: text('resource').notNull(),
  resourceId: text('resourceId'),
  details: jsonb('details'),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  foreignKey({ columns: [t.userId], foreignColumns: [user.id] }).onDelete('cascade'),
])

// ===== RELATIONS =====
export const userRelations = relations(user, ({ many, one }) => ({
  userRole: one(userRole, { fields: [user.id], references: [userRole.userId] }),
  student: one(student, { fields: [user.id], references: [student.userId] }),
  teacher: one(teacher, { fields: [user.id], references: [teacher.userId] }),
  parent: one(parent, { fields: [user.id], references: [parent.userId] }),
}))

export const studentRelations = relations(student, ({ one, many }) => ({
  user: one(user, { fields: [student.userId], references: [user.id] }),
  parent: one(parent, { fields: [student.parentId], references: [parent.id] }),
  results: many(assessmentResult),
  attendance: many(attendance),
  payments: many(payment),
}))

export const teacherRelations = relations(teacher, ({ one, many }) => ({
  user: one(user, { fields: [teacher.userId], references: [user.id] }),
  classes: many(class_),
  subjects: many(teacherOnSubject),
  assessments: many(assessment),
}))

export const parentRelations = relations(parent, ({ one, many }) => ({
  user: one(user, { fields: [parent.userId], references: [user.id] }),
  students: many(student),
}))

export const conversationRelations = relations(conversation, ({ many }) => ({
  participants: many(conversationParticipant),
  messages: many(message),
}))

export const messageRelations = relations(message, ({ one }) => ({
  sender: one(user, { fields: [message.senderId], references: [user.id] }),
  conversation: one(conversation, { fields: [message.conversationId], references: [conversation.id] }),
}))

export const assessmentRelations = relations(assessment, ({ one, many }) => ({
  subject: one(subject, { fields: [assessment.subjectId], references: [subject.id] }),
  questions: many(assessmentQuestion),
  results: many(assessmentResult),
  term: one(term, { fields: [assessment.termId], references: [term.id] }),
}))

export const assessmentResultRelations = relations(assessmentResult, ({ one, many }) => ({
  assessment: one(assessment, { fields: [assessmentResult.assessmentId], references: [assessment.id] }),
  student: one(student, { fields: [assessmentResult.studentId], references: [student.id] }),
  answers: many(studentAnswer),
}))

export const conversationParticipantRelations = relations(conversationParticipant, ({ one }) => ({
  conversation: one(conversation, { fields: [conversationParticipant.conversationId], references: [conversation.id] }),
  user: one(user, { fields: [conversationParticipant.userId], references: [user.id] }),
}))
