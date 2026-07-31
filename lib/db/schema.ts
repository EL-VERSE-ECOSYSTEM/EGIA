import { text, timestamp, boolean, integer, numeric, date, jsonb, pgTable, foreignKey, unique } from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'

// ===== CORE USER TABLES =====
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  image: text('image'),
  createdAt: timestamp('createdat', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updatedat', { withTimezone: true }).notNull().defaultNow(),
})

export const userRole = pgTable('user_role', {
  id: text('id').primaryKey(),
  userId: text('userid').notNull().unique(),
  role: text('role').notNull(), // ADMIN, TEACHER, PARENT, STUDENT
  createdAt: timestamp('createdat', { withTimezone: true }).notNull().defaultNow(),
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
  term: text('term'),
  session: text('session'),
  endorsedAt: timestamp('endorsedAt'),
  createdAt: timestamp('createdAt').defaultNow()
})

// ===== SCHOOL CORE TABLES =====
export const student = pgTable('student', {
  id: text('id').primaryKey(),
  userId: text('userid').unique(),
  firstName: text('firstname').notNull(),
  middleName: text('middlename'),
  lastName: text('lastname').notNull(),
  dateOfBirth: date('dateofbirth'),
  dateOfResumption: date('dateofresumption'),
  gender: text('gender'),
  class: text('class').notNull(),
  arm: text('arm'),
  department: text('department'),
  admissionNumber: text('admissionnumber').unique(),
  parentId: text('parentid'),
  termId: text('termid'),
  sessionId: text('sessionid'),
  profileImage: text('profileimage'),
  facialVerificationVideo: text('facialverificationvideo'),
  subjectsDone: jsonb('subjectsdone'),
  isActive: boolean('isactive').default(true),
  password: text('password').default('default'),
  createdAt: timestamp('createdat', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updatedat', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  foreignKey({ columns: [t.userId], foreignColumns: [user.id] }).onDelete('cascade'),
  foreignKey({ columns: [t.parentId], foreignColumns: [parent.id] }).onDelete('set null'),
])

export const teacher = pgTable('teacher', {
  id: text('id').primaryKey(),
  userId: text('userid').notNull().unique(),
  staffCode: text('staffcode').unique(),
  firstName: text('firstname').notNull(),
  lastName: text('lastname').notNull(),
  type: text('type').default('FULL_TIME'), // FULL_TIME, PART_TIME
  isClassTeacher: boolean('isclassteacher').default(false),
  isPartTime: boolean('isparttime').default(false),
  assignedClassId: text('assignedclassid'),
  daysPresent: jsonb('dayspresent'),
  handlingClasses: jsonb('handlingclasses'),
  teachingSubjects: jsonb('teachingsubjects'),
  presentDays: jsonb('presentdays'),
  resumptionTime: text('resumptiontime'),
  resumptionDate: date('resumptiondate'),
  bio: text('bio'),
  applicationLetterUrl: text('applicationletterurl'),
  cvUrl: text('cvurl'),
  qualification: text('qualification'),
  specialization: text('specialization'),
  profileImage: text('profileimage'),
  facialVerificationVideo: text('facialverificationvideo'),
  status: text('status').default('PENDING'),
  isActive: boolean('isactive').default(true),
  createdAt: timestamp('createdat', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updatedat', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  foreignKey({ columns: [t.userId], foreignColumns: [user.id] }).onDelete('cascade'),
])

export const parent = pgTable('parent', {
  id: text('id').primaryKey(),
  userId: text('userid').notNull().unique(),
  firstName: text('firstname').notNull(),
  lastName: text('lastname').notNull(),
  phoneNumber: text('phonenumber'),
  address: text('address'),
  profileImage: text('profileimage'),
  facialVerificationVideo: text('facialverificationvideo'),
  occupation: text('occupation'),
  createdAt: timestamp('createdat', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updatedat', { withTimezone: true }).notNull().defaultNow(),
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
  accessCode: text('accesscode'),
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
  assessmentVideo: text('assessmentVideo'),
  warningCount: integer('warningCount').default(0),
  proctorLogs: jsonb('proctorLogs'),
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
  studentId: text('studentid').notNull(),
  parentId: text('parentid'),
  termId: text('termid'),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  feeType: text('feetype'),
  paymentMethod: text('paymentmethod').notNull(),
  transactionReference: text('transactionreference').unique(),
  korapayReference: text('korapayreference').unique(),
  receiptUrl: text('receipturl'),
  status: text('status').default('pending'),
  paymentDate: timestamp('paymentdate', { withTimezone: true }),
  paidAt: timestamp('paidat', { withTimezone: true }),
  description: text('description'),
  createdAt: timestamp('createdat', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updatedat', { withTimezone: true }).notNull().defaultNow(),
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

export const paymentRelations = relations(payment, ({ one }) => ({
  student: one(student, { fields: [payment.studentId], references: [student.id] }),
  parent: one(parent, { fields: [payment.parentId], references: [parent.id] }),
}))

export const teacherWallet = pgTable('teacher_wallet', {
  id: text('id').primaryKey(),
  teacherId: text('teacherId').notNull().unique(),
  balance: numeric('balance', { precision: 12, scale: 2 }).default('0.00'),
  salaryAmount: numeric('salaryAmount', { precision: 12, scale: 2 }).default('150000.00'),
  salaryStatus: text('salaryStatus').default('pending'), // pending, paid
  updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
})

export const teacherRequest = pgTable('teacher_request', {
  id: text('id').primaryKey(),
  teacherId: text('teacherId').notNull(),
  type: text('type').notNull(), // DATA, AIRTIME
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  details: text('details'), // e.g. "10GB Airtel" or "MTN Airtime"
  phoneNumber: text('phoneNumber').notNull(),
  status: text('status').default('pending'), // pending, approved, rejected
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
})

export const teacherWalletRelations = relations(teacherWallet, ({ one }) => ({
  teacher: one(teacher, { fields: [teacherWallet.teacherId], references: [teacher.id] }),
}))

export const teacherRequestRelations = relations(teacherRequest, ({ one }) => ({
  teacher: one(teacher, { fields: [teacherRequest.teacherId], references: [teacher.id] }),
}))

export const libraryBooks = pgTable('library_books', {
  id: text('id').primaryKey(),
  isbn: text('isbn').unique(),
  title: text('title').notNull(),
  subtitle: text('subtitle'),
  authors: jsonb('authors'),
  author: text('author'),
  publisher: text('publisher'),
  publicationYear: integer('publication_year'),
  edition: text('edition'),
  volume: text('volume'),
  language: text('language').default('English'),
  pages: integer('pages'),
  category: text('category'),
  subCategory: text('sub_category'),
  description: text('description'),
  totalCopies: integer('total_copies').default(1),
  availableCopies: integer('available_copies').default(1),
  coverImageUrl: text('cover_image_url'),
  fileUrl: text('file_url'),
  location: text('location'),
  content: text('content'),
  subject: text('subject'),
  classLevel: text('class_level'),
  keywords: jsonb('keywords'),
  isDigital: boolean('is_digital').default(false),
  rating: numeric('rating'),
  ratingCount: integer('rating_count').default(0),
  borrowedCount: integer('borrowed_count').default(0),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow()
})

export const bookImportLogs = pgTable('book_import_logs', {
  id: text('id').primaryKey(),
  filename: text('filename').notNull(),
  totalRecords: integer('total_records').default(0),
  inserted: integer('inserted').default(0),
  updated: integer('updated').default(0),
  skipped: integer('skipped').default(0),
  failed: integer('failed').default(0),
  errors: jsonb('errors'),
  status: text('status').default('PENDING'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow()
})
