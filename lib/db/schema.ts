import { text, timestamp, boolean, integer, numeric, date, jsonb, serial, pgTable, foreignKey, unique, check } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ===== BETTER AUTH TABLES (Auto-managed by Better Auth) =====
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  name: text('name'),
  image: text('image'),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt', { withTimezone: true }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId').notNull(),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('providerAccountId').notNull(),
  refreshToken: text('refreshToken'),
  accessToken: text('accessToken'),
  expiresAt: timestamp('expiresAt', { withTimezone: true }),
  password: text('password'),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique().on(t.provider, t.providerAccountId),
])

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt', { withTimezone: true }).notNull(),
  createdAt: timestamp('createdAt', { withTimezone: true }),
  updatedAt: timestamp('updatedAt', { withTimezone: true }),
})

// ===== SCHOOL CORE TABLES =====
export const userRole = pgTable('user_role', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull().unique(),
  role: text('role').notNull().check(check('role_check', "role IN ('admin', 'teacher', 'parent', 'student')")),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  foreignKey({ columns: [t.userId], foreignColumns: [user.id] }).onDelete('cascade'),
])

export const student = pgTable('student', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull().unique(),
  studentId: text('studentId').notNull().unique(),
  firstName: text('firstName').notNull(),
  lastName: text('lastName').notNull(),
  dateOfBirth: date('dateOfBirth'),
  gender: text('gender').check(check('gender_check', "gender IN ('male', 'female', 'other')")),
  class: text('class').notNull().check(check('class_check', "class IN ('JSS1', 'JSS2', 'JSS3', 'SSS1', 'SSS2', 'SSS3')")),
  admissionNumber: text('admissionNumber').unique(),
  parentId: text('parentId'),
  profileImage: text('profileImage'),
  isActive: boolean('isActive').default(true),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  foreignKey({ columns: [t.userId], foreignColumns: [user.id] }).onDelete('cascade'),
])

export const teacher = pgTable('teacher', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull().unique(),
  teacherId: text('teacherId').notNull().unique(),
  firstName: text('firstName').notNull(),
  lastName: text('lastName').notNull(),
  qualification: text('qualification'),
  specialization: text('specialization'),
  dateOfBirth: date('dateOfBirth'),
  gender: text('gender').check(check('gender_check_teacher', "gender IN ('male', 'female', 'other')")),
  joinDate: date('joinDate'),
  profileImage: text('profileImage'),
  isActive: boolean('isActive').default(true),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  foreignKey({ columns: [t.userId], foreignColumns: [user.id] }).onDelete('cascade'),
])

export const parent = pgTable('parent', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull().unique(),
  parentId: text('parentId').notNull().unique(),
  firstName: text('firstName').notNull(),
  lastName: text('lastName').notNull(),
  phoneNumber: text('phoneNumber'),
  relationship: text('relationship').check(check('relationship_check', "relationship IN ('father', 'mother', 'guardian', 'other')")),
  occupation: text('occupation'),
  address: text('address'),
  profileImage: text('profileImage'),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  foreignKey({ columns: [t.userId], foreignColumns: [user.id] }).onDelete('cascade'),
])

// ===== ACADEMIC STRUCTURE =====
export const class_ = pgTable('class', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  teacherId: integer('teacherId'),
  capacity: integer('capacity').default(50),
  isActive: boolean('isActive').default(true),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  foreignKey({ columns: [t.teacherId], foreignColumns: [teacher.id] }),
])

export const subject = pgTable('subject', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
  description: text('description'),
  classId: integer('classId').notNull(),
  teacherId: integer('teacherId'),
  creditUnits: integer('creditUnits').default(3),
  isActive: boolean('isActive').default(true),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  foreignKey({ columns: [t.classId], foreignColumns: [class_.id] }),
  foreignKey({ columns: [t.teacherId], foreignColumns: [teacher.id] }),
])

// ===== ASSESSMENT & GRADING =====
export const assessment = pgTable('assessment', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  subjectId: integer('subjectId').notNull(),
  assessmentType: text('assessmentType').notNull().check(check('assessment_type_check', "assessmentType IN ('quiz', 'test', 'exam', 'assignment')")),
  totalMarks: integer('totalMarks').notNull(),
  passingMarks: integer('passingMarks'),
  duration: integer('duration'),
  scheduleDate: timestamp('scheduleDate', { withTimezone: true }).notNull(),
  status: text('status').default('draft').check(check('assessment_status_check', "status IN ('draft', 'published', 'active', 'completed')")),
  createdBy: integer('createdBy'),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  foreignKey({ columns: [t.subjectId], foreignColumns: [subject.id] }),
  foreignKey({ columns: [t.createdBy], foreignColumns: [teacher.id] }),
])

export const assessmentQuestion = pgTable('assessment_question', {
  id: serial('id').primaryKey(),
  assessmentId: integer('assessmentId').notNull(),
  questionText: text('questionText').notNull(),
  questionType: text('questionType').notNull().check(check('question_type_check', "questionType IN ('multiple_choice', 'short_answer', 'essay')")),
  marks: integer('marks').notNull(),
  options: jsonb('options'),
  correctAnswer: text('correctAnswer'),
  explanation: text('explanation'),
  sequenceNumber: integer('sequenceNumber'),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  foreignKey({ columns: [t.assessmentId], foreignColumns: [assessment.id] }).onDelete('cascade'),
])

export const assessmentResult = pgTable('assessment_result', {
  id: serial('id').primaryKey(),
  assessmentId: integer('assessmentId').notNull(),
  studentId: integer('studentId').notNull(),
  totalScore: integer('totalScore'),
  percentage: numeric('percentage', { precision: 5, scale: 2 }),
  grade: text('grade'),
  status: text('status').default('pending').check(check('result_status_check', "status IN ('pending', 'submitted', 'graded')")),
  gradedAt: timestamp('gradedAt', { withTimezone: true }),
  gradedBy: integer('gradedBy'),
  feedback: text('feedback'),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  foreignKey({ columns: [t.assessmentId], foreignColumns: [assessment.id] }),
  foreignKey({ columns: [t.studentId], foreignColumns: [student.id] }),
  foreignKey({ columns: [t.gradedBy], foreignColumns: [teacher.id] }),
])

export const studentAnswer = pgTable('student_answer', {
  id: serial('id').primaryKey(),
  assessmentResultId: integer('assessmentResultId').notNull(),
  questionId: integer('questionId').notNull(),
  studentAnswer: text('studentAnswer'),
  score: integer('score'),
  isCorrect: boolean('isCorrect'),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  foreignKey({ columns: [t.assessmentResultId], foreignColumns: [assessmentResult.id] }).onDelete('cascade'),
  foreignKey({ columns: [t.questionId], foreignColumns: [assessmentQuestion.id] }),
])

// ===== ATTENDANCE =====
export const attendance = pgTable('attendance', {
  id: serial('id').primaryKey(),
  studentId: integer('studentId').notNull(),
  classId: integer('classId').notNull(),
  date: date('date').notNull(),
  status: text('status').notNull().check(check('attendance_status_check', "status IN ('present', 'absent', 'late', 'excused')")),
  remarks: text('remarks'),
  recordedBy: integer('recordedBy'),
  recordedAt: timestamp('recordedAt', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  foreignKey({ columns: [t.studentId], foreignColumns: [student.id] }),
  foreignKey({ columns: [t.classId], foreignColumns: [class_.id] }),
  foreignKey({ columns: [t.recordedBy], foreignColumns: [teacher.id] }),
  unique().on(t.studentId, t.classId, t.date),
])

// ===== FEES & PAYMENTS =====
export const feeStructure = pgTable('fee_structure', {
  id: serial('id').primaryKey(),
  class: text('class').notNull(),
  feeType: text('feeType').notNull().check(check('fee_type_check', "feeType IN ('tuition', 'development', 'activity', 'exam', 'other')")),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  dueDate: date('dueDate'),
  description: text('description'),
  isActive: boolean('isActive').default(true),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique().on(t.class, t.feeType),
])

export const payment = pgTable('payment', {
  id: serial('id').primaryKey(),
  studentId: integer('studentId').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  paymentMethod: text('paymentMethod').notNull().check(check('payment_method_check', "paymentMethod IN ('korapay', 'bank_transfer', 'cash')")),
  transactionReference: text('transactionReference').unique(),
  status: text('status').default('pending').check(check('payment_status_check', "status IN ('pending', 'completed', 'failed', 'refunded')")),
  paymentDate: timestamp('paymentDate', { withTimezone: true }),
  description: text('description'),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  foreignKey({ columns: [t.studentId], foreignColumns: [student.id] }),
])

// ===== MESSAGES & NOTIFICATIONS =====
export const message = pgTable('message', {
  id: serial('id').primaryKey(),
  senderId: text('senderId').notNull(),
  recipientId: text('recipientId').notNull(),
  subject: text('subject'),
  body: text('body').notNull(),
  isRead: boolean('isRead').default(false),
  readAt: timestamp('readAt', { withTimezone: true }),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  foreignKey({ columns: [t.senderId], foreignColumns: [user.id] }).onDelete('cascade'),
  foreignKey({ columns: [t.recipientId], foreignColumns: [user.id] }).onDelete('cascade'),
])

export const notification = pgTable('notification', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').notNull().check(check('notification_type_check', "type IN ('assessment', 'attendance', 'grade', 'payment', 'general')")),
  isRead: boolean('isRead').default(false),
  actionUrl: text('actionUrl'),
  readAt: timestamp('readAt', { withTimezone: true }),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  foreignKey({ columns: [t.userId], foreignColumns: [user.id] }).onDelete('cascade'),
])

// ===== DISPUTE & ISSUE TRACKING =====
export const dispute = pgTable('dispute', {
  id: serial('id').primaryKey(),
  initiatedBy: text('initiatedBy').notNull(),
  disputeType: text('disputeType').notNull().check(check('dispute_type_check', "disputeType IN ('grade', 'assessment', 'attendance', 'fee', 'other')")),
  description: text('description').notNull(),
  relatedId: text('relatedId'),
  status: text('status').default('open').check(check('dispute_status_check', "status IN ('open', 'in_review', 'resolved', 'closed')")),
  resolution: text('resolution'),
  resolvedBy: integer('resolvedBy'),
  resolvedAt: timestamp('resolvedAt', { withTimezone: true }),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  foreignKey({ columns: [t.initiatedBy], foreignColumns: [user.id] }).onDelete('cascade'),
  foreignKey({ columns: [t.resolvedBy], foreignColumns: [teacher.id] }),
])

// ===== FILES & DOCUMENTS =====
export const document = pgTable('document', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  documentType: text('documentType').notNull().check(check('document_type_check', "documentType IN ('report', 'receipt', 'transcript', 'certificate', 'other')")),
  title: text('title').notNull(),
  fileUrl: text('fileUrl').notNull(),
  fileSize: integer('fileSize'),
  mimeType: text('mimeType'),
  relatedId: integer('relatedId'),
  isPublic: boolean('isPublic').default(false),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  foreignKey({ columns: [t.userId], foreignColumns: [user.id] }).onDelete('cascade'),
])

// ===== SETTINGS & CONFIGURATION =====
export const schoolSetting = pgTable('school_setting', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: jsonb('value'),
  description: text('description'),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
  updatedBy: text('updatedBy'),
}, (t) => [
  foreignKey({ columns: [t.updatedBy], foreignColumns: [user.id] }),
])

// ===== RELATIONS =====
export const userRelations = relations(user, ({ one, many }) => ({
  role: one(userRole, { fields: [user.id], references: [userRole.userId] }),
  messages: many(message),
  notifications: many(notification),
  disputes: many(dispute),
  documents: many(document),
}))

export const userRoleRelations = relations(userRole, ({ one }) => ({
  user: one(user, { fields: [userRole.userId], references: [user.id] }),
}))

export const studentRelations = relations(student, ({ one, many }) => ({
  user: one(user, { fields: [student.userId], references: [user.id] }),
  assessmentResults: many(assessmentResult),
  attendance: many(attendance),
  payments: many(payment),
}))

export const teacherRelations = relations(teacher, ({ one, many }) => ({
  user: one(user, { fields: [teacher.userId], references: [user.id] }),
  classes: many(class_),
  subjects: many(subject),
  assessments: many(assessment),
  assessmentResults: many(assessmentResult),
  disputes: many(dispute),
}))

export const parentRelations = relations(parent, ({ one }) => ({
  user: one(user, { fields: [parent.userId], references: [user.id] }),
}))

export const classRelations = relations(class_, ({ one, many }) => ({
  teacher: one(teacher, { fields: [class_.teacherId], references: [teacher.id] }),
  subjects: many(subject),
  attendance: many(attendance),
}))

export const subjectRelations = relations(subject, ({ one, many }) => ({
  class: one(class_, { fields: [subject.classId], references: [class_.id] }),
  teacher: one(teacher, { fields: [subject.teacherId], references: [teacher.id] }),
  assessments: many(assessment),
}))

export const assessmentRelations = relations(assessment, ({ one, many }) => ({
  subject: one(subject, { fields: [assessment.subjectId], references: [subject.id] }),
  createdByTeacher: one(teacher, { fields: [assessment.createdBy], references: [teacher.id] }),
  questions: many(assessmentQuestion),
  results: many(assessmentResult),
}))

export const assessmentQuestionRelations = relations(assessmentQuestion, ({ one, many }) => ({
  assessment: one(assessment, { fields: [assessmentQuestion.assessmentId], references: [assessment.id] }),
  studentAnswers: many(studentAnswer),
}))

export const assessmentResultRelations = relations(assessmentResult, ({ one, many }) => ({
  assessment: one(assessment, { fields: [assessmentResult.assessmentId], references: [assessment.id] }),
  student: one(student, { fields: [assessmentResult.studentId], references: [student.id] }),
  gradedByTeacher: one(teacher, { fields: [assessmentResult.gradedBy], references: [teacher.id] }),
  answers: many(studentAnswer),
}))

export const attendanceRelations = relations(attendance, ({ one }) => ({
  student: one(student, { fields: [attendance.studentId], references: [student.id] }),
  class: one(class_, { fields: [attendance.classId], references: [class_.id] }),
  recordedByTeacher: one(teacher, { fields: [attendance.recordedBy], references: [teacher.id] }),
}))

export const paymentRelations = relations(payment, ({ one }) => ({
  student: one(student, { fields: [payment.studentId], references: [student.id] }),
}))

export const disputeRelations = relations(dispute, ({ one }) => ({
  initiatedByUser: one(user, { fields: [dispute.initiatedBy], references: [user.id] }),
  resolvedByTeacher: one(teacher, { fields: [dispute.resolvedBy], references: [teacher.id] }),
}))

export const documentRelations = relations(document, ({ one }) => ({
  user: one(user, { fields: [document.userId], references: [user.id] }),
}))
