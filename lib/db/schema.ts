import { text, timestamp, boolean, integer, numeric, date, jsonb, pgTable, foreignKey, unique } from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'

// ===== SCHOOL TENANCY TABLE =====
export const school = pgTable('school', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code').notNull().unique(), // First 4 letters of school name + unique 5 digits (e.g., SCHO12345)
  location: text('location').notNull(),
  registeredClasses: jsonb('registeredclasses').notNull(), // Primary 3 to SSS3 selected
  allowParents: boolean('allowparents').notNull().default(true),
  adminName: text('adminname').notNull(),
  adminPhone: text('adminphone').notNull(),
  adminEmail: text('adminemail').notNull(),
  bankName: text('bankname'),
  accountNumber: text('accountnumber'),
  accountName: text('accountname'),
  customPaymentLink: text('custompaymentlink'),
  paymentStatus: text('paymentstatus').notNull().default('PENDING'), // PENDING, PAID
  paymentReference: text('paymentreference').unique(),
  logoUrl: text('logo_url'),
  logoPath: text('logo_path'),
  logoUploadedAt: timestamp('logo_uploaded_at', { withTimezone: true }),
  createdAt: timestamp('createdat', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updatedat', { withTimezone: true }).notNull().defaultNow(),
})

// ===== CORE USER TABLES =====
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  image: text('image'),
  schoolId: text('schoolid'),
  password: text('password'),
  createdAt: timestamp('createdat', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updatedat', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  foreignKey({ columns: [t.schoolId], foreignColumns: [school.id] }).onDelete('cascade'),
])

export const userRole = pgTable('user_role', {
  id: text('id').primaryKey(),
  userId: text('userid').notNull().unique(),
  role: text('role').notNull(), // SUPER_ADMIN, SCHOOL_ADMIN, TEACHER, PARENT, STUDENT, PUPIL
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

export const userFcmToken = pgTable('user_fcm_tokens', {
  id: text('id').primaryKey(), userId: text('user_id').notNull(), token: text('token').notNull().unique(),
  deviceName: text('device_name'), deviceType: text('device_type').default('web'), browser: text('browser'), os: text('os'),
  isActive: boolean('is_active').notNull().default(true), createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [foreignKey({ columns: [t.userId], foreignColumns: [user.id] }).onDelete('cascade'), unique().on(t.userId, t.token)])

export const notificationHistory = pgTable('notification_history', {
  id: text('id').primaryKey(), userId: text('user_id'), title: text('title').notNull(), body: text('body').notNull(), type: text('type').notNull(),
  data: jsonb('data'), sentAt: timestamp('sent_at', { withTimezone: true }).notNull().defaultNow(), delivered: boolean('delivered').notNull().default(false), readAt: timestamp('read_at', { withTimezone: true }), link: text('link'), metadata: jsonb('metadata'),
}, (t) => [foreignKey({ columns: [t.userId], foreignColumns: [user.id] }).onDelete('set null')])

// ===== SCHOOL CORE TABLES =====
export const student = pgTable('student', {
  id: text('id').primaryKey(),
  userId: text('userid').unique(),
  schoolId: text('schoolid'),
  firstName: text('firstname').notNull(),
  middleName: text('middlename'),
  lastName: text('lastname').notNull(),
  dateOfBirth: date('dateofbirth'),
  dateOfResumption: date('dateofresumption'),
  gender: text('gender'), // Male, Female, or Gender expression
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
  registrationPaid: boolean('registration_paid').default(false),
  registrationReference: text('registration_reference'),
  enrollmentType: text('enrollment_type'), // ADMIN or SELF
  registrationStatus: text('registrationstatus').notNull().default('WAIVED'),
  password: text('password').default('default'),
  createdAt: timestamp('createdat', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updatedat', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  foreignKey({ columns: [t.userId], foreignColumns: [user.id] }).onDelete('cascade'),
  foreignKey({ columns: [t.parentId], foreignColumns: [parent.id] }).onDelete('set null'),
  foreignKey({ columns: [t.schoolId], foreignColumns: [school.id] }).onDelete('set null'),
])

export const teacher = pgTable('teacher', {
  id: text('id').primaryKey(),
  userId: text('userid').notNull().unique(),
  schoolId: text('schoolid'),
  staffCode: text('staffcode').unique(),
  firstName: text('firstname').notNull(),
  lastName: text('lastname').notNull(),
  gender: text('gender'),
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
  password: text('password').default('default'),
  status: text('status').default('PENDING'),
  isActive: boolean('isactive').default(true),
  createdAt: timestamp('createdat', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updatedat', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  foreignKey({ columns: [t.userId], foreignColumns: [user.id] }).onDelete('cascade'),
  foreignKey({ columns: [t.schoolId], foreignColumns: [school.id] }).onDelete('set null'),
])

export const parent = pgTable('parent', {
  id: text('id').primaryKey(),
  userId: text('userid').notNull().unique(),
  schoolId: text('schoolid'),
  firstName: text('firstname').notNull(),
  lastName: text('lastName').notNull(),
  gender: text('gender'),
  phoneNumber: text('phonenumber'),
  address: text('address'),
  profileImage: text('profileimage'),
  facialVerificationVideo: text('facialverificationvideo'),
  occupation: text('occupation'),
  password: text('password').default('default'),
  createdAt: timestamp('createdat', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updatedat', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  foreignKey({ columns: [t.userId], foreignColumns: [user.id] }).onDelete('cascade'),
  foreignKey({ columns: [t.schoolId], foreignColumns: [school.id] }).onDelete('set null'),
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
  schoolId: text('schoolId'),
  teacherId: text('teacherId'),
}, (t) => [
  foreignKey({ columns: [t.teacherId], foreignColumns: [teacher.id] }),
  foreignKey({ columns: [t.schoolId], foreignColumns: [school.id] }).onDelete('cascade'),
])

export const subject = pgTable('subject', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code').unique(),
  isActive: boolean('is_active').notNull().default(true),
  isCustom: boolean('is_custom').notNull().default(false),
  educationLevels: text('education_levels').array(),
  departments: text('departments').array(),
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
  schoolId: text('schoolid'),
  title: text('title').notNull(),
  description: text('description'),
  subjectId: text('subjectId').notNull(),
  termId: text('termId').notNull(),
  createdBy: text('createdBy').notNull(),
  duration: integer('duration').notNull(),
  type: text('type').notNull(),
  status: text('status').default('draft'),
  accessCode: text('accesscode'), // Exam Code / Access Code for CBT session
  adminComment: text('adminComment'),
  passingScore: integer('passingScore').default(40),
  totalPoints: integer('totalPoints').default(100),
  scheduledDate: text('scheduled_date'),
  scheduledTime: text('scheduled_time'),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  foreignKey({ columns: [t.subjectId], foreignColumns: [subject.id] }),
  foreignKey({ columns: [t.termId], foreignColumns: [term.id] }),
  foreignKey({ columns: [t.createdBy], foreignColumns: [teacher.id] }),
  foreignKey({ columns: [t.schoolId], foreignColumns: [school.id] }).onDelete('set null'),
])

export const assessmentQuestion = pgTable('assessment_question', {
  id: text('id').primaryKey(),
  assessmentId: text('assessmentId').notNull(),
  questionText: text('questionText').notNull(),
  questionType: text('questionType').notNull(),
  options: jsonb('options'),
  correctAnswer: text('correctAnswer'),
  imageUrl: text('imageUrl'),
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

export const cbtSessions = pgTable('cbt_sessions', {
  id: text('id').primaryKey(),
  assessmentId: text('assessment_id').notNull(),
  studentId: text('student_id').notNull(),
  accessCode: text('access_code').notNull(),
  status: text('status').notNull().default('ONGOING'), // ONGOING, COMPLETED, EXPIRED, TERMINATED
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  warningCount: integer('warning_count').default(0),
}, (t) => [
  foreignKey({ columns: [t.assessmentId], foreignColumns: [assessment.id] }).onDelete('cascade'),
  foreignKey({ columns: [t.studentId], foreignColumns: [student.id] }).onDelete('cascade'),
])

export const cbtAttempts = pgTable('cbt_attempts', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull(),
  studentId: text('student_id').notNull(),
  answers: jsonb('answers'),
  score: numeric('score', { precision: 5, scale: 2 }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
}, (t) => [
  foreignKey({ columns: [t.sessionId], foreignColumns: [cbtSessions.id] }).onDelete('cascade'),
  foreignKey({ columns: [t.studentId], foreignColumns: [student.id] }).onDelete('cascade'),
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
  schoolId: text('schoolid'),
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
  unique().on(t.schoolId, t.class, t.department, t.feeType),
  foreignKey({ columns: [t.schoolId], foreignColumns: [school.id] }).onDelete('cascade'),
])

export const payment = pgTable('payment', {
  id: text('id').primaryKey(),
  schoolId: text('schoolid'),
  studentId: text('studentid').notNull(),
  parentId: text('parentid'),
  termId: text('termid'),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  feeType: text('feetype'),
  paymentMethod: text('paymentmethod').notNull(), // KORAPAY, BANK_TRANSFER, CUSTOM_LINK
  transactionReference: text('transactionreference').unique(),
  korapayReference: text('korapayreference').unique(),
  receiptUrl: text('receipturl'),
  reconciliationStatus: text('reconciliation_status').default('UNRECONCILED'), // UNRECONCILED, RECONCILED, DISPUTED
  reconciledBy: text('reconciled_by'),
  reconciledAt: timestamp('reconciled_at', { withTimezone: true }),
  status: text('status').default('pending'), // pending, approved, cleared, failed
  paymentDate: timestamp('paymentdate', { withTimezone: true }),
  paidAt: timestamp('paidat', { withTimezone: true }),
  description: text('description'),
  createdAt: timestamp('createdat', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updatedat', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  foreignKey({ columns: [t.studentId], foreignColumns: [student.id] }),
  foreignKey({ columns: [t.schoolId], foreignColumns: [school.id] }).onDelete('set null'),
])

// ===== ADMISSION NUMBER SEQUENCES =====
export const admissionNumberSequences = pgTable('admission_number_sequences', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()::text`),
  schoolId: text('schoolid').notNull().unique(),
  lastNumber: integer('last_number').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  foreignKey({ columns: [t.schoolId], foreignColumns: [school.id] }).onDelete('cascade'),
])


// ===== ASSESSMENT LOGS =====
export const assessmentLogs = pgTable('assessment_logs', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()::text`),
  schoolId: text('schoolid').notNull(),
  assessmentId: text('assessment_id'),
  studentId: text('student_id'),
  action: text('action').notNull(), // STARTED, SUBMITTED, WARNED, AUTO_SUBMITTED, GRADED
  metadata: jsonb('metadata'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  foreignKey({ columns: [t.schoolId], foreignColumns: [school.id] }).onDelete('cascade'),
  foreignKey({ columns: [t.assessmentId], foreignColumns: [assessment.id] }).onDelete('cascade'),
  foreignKey({ columns: [t.studentId], foreignColumns: [student.id] }).onDelete('cascade'),
])

// ===== SCHOOL PAYMENT CONFIGURATION & RECEIPT UPLOADS =====
export const schoolPaymentConfig = pgTable('school_payment_config', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()::text`),
  schoolId: text('schoolid').notNull().unique(),
  useKorapay: boolean('use_korapay').notNull().default(true),
  bankName: text('bank_name'),
  accountNumber: text('account_number'),
  accountName: text('account_name'),
  customPaymentLink: text('custom_payment_link'),
  instructions: text('instructions'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  foreignKey({ columns: [t.schoolId], foreignColumns: [school.id] }).onDelete('cascade'),
])

export const paymentReceiptUploads = pgTable('payment_receipt_uploads', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()::text`),
  schoolId: text('schoolid').notNull(),
  paymentId: text('payment_id'),
  studentId: text('student_id'),
  parentId: text('parent_id'),
  uploadedBy: text('uploaded_by').notNull(),
  uploadedByRole: text('uploaded_by_role').notNull(), // PARENT, SCHOOL_ADMIN
  fileUrl: text('file_url').notNull(),
  filePath: text('file_path').notNull(),
  fileType: text('file_type').notNull(), // image/png, image/jpeg, application/pdf
  fileSizeKb: integer('file_size_kb'),
  amountClaimed: numeric('amount_claimed', { precision: 12, scale: 2 }),
  paymentReference: text('payment_reference'),
  status: text('status').notNull().default('PENDING'), // PENDING, APPROVED, REJECTED
  reviewedBy: text('reviewed_by'),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  rejectionReason: text('rejection_reason'),
  generatedReceiptUrl: text('generated_receipt_url'),
  generatedReceiptPath: text('generated_receipt_path'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  foreignKey({ columns: [t.schoolId], foreignColumns: [school.id] }).onDelete('cascade'),
  foreignKey({ columns: [t.paymentId], foreignColumns: [payment.id] }).onDelete('cascade'),
  foreignKey({ columns: [t.studentId], foreignColumns: [student.id] }).onDelete('cascade'),
  foreignKey({ columns: [t.parentId], foreignColumns: [parent.id] }).onDelete('set null'),
  foreignKey({ columns: [t.uploadedBy], foreignColumns: [user.id] }),
  foreignKey({ columns: [t.reviewedBy], foreignColumns: [user.id] }),
])

// ===== TRANSACTION LEDGER =====
export const transactionLedger = pgTable('transaction_ledger', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()::text`),
  schoolId: text('schoolid').notNull(),
  userId: text('user_id'),
  studentId: text('student_id'),
  type: text('type').notNull(), // REGISTRATION_FEE, FEE_PAYMENT, SALARY, AIRTIME, DATA, CLEARANCE, REFUND
  direction: text('direction').notNull(), // IN, OUT
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  currency: text('currency').default('NGN'),
  reference: text('reference').unique(),
  gateway: text('gateway'), // KORAPAY, SCHOOL_ACCOUNT, SYSTEM
  status: text('status').default('PENDING'), // PENDING, SUCCESS, FAILED
  description: text('description'),
  metadata: jsonb('metadata'),
  confirmationMethod: text('confirmation_method'), // KORAPAY_AUTO, MANUAL_UPLOAD, SCHOOL_ACCOUNT
  receiptUploadId: text('receipt_upload_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  foreignKey({ columns: [t.schoolId], foreignColumns: [school.id] }).onDelete('cascade'),
  foreignKey({ columns: [t.userId], foreignColumns: [user.id] }),
  foreignKey({ columns: [t.studentId], foreignColumns: [student.id] }),
  foreignKey({ columns: [t.receiptUploadId], foreignColumns: [paymentReceiptUploads.id] }).onDelete('set null'),
])

// ===== SCHOOL ADMIN ROLES =====
export const schoolAdminRoles = pgTable('school_admin_roles', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()::text`),
  schoolId: text('schoolid').notNull(),
  userId: text('userid').notNull(),
  level: text('level').notNull(), // PRIMARY_ADMIN, VICE_PRINCIPAL_ACADEMICS, VICE_PRINCIPAL_ADMIN, HOD_SCIENCE, HOD_ARTS, HOD_COMMERCIAL
  department: text('department'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique().on(t.schoolId, t.userId),
  foreignKey({ columns: [t.schoolId], foreignColumns: [school.id] }).onDelete('cascade'),
  foreignKey({ columns: [t.userId], foreignColumns: [user.id] }).onDelete('cascade'),
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

export const transactions = pgTable('transactions', {
  id: text('id').primaryKey(),
  reference: text('reference').notNull().unique(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('NGN'),
  status: text('status').notNull().default('pending'), // pending, success, failed
  customerEmail: text('customer_email').notNull(),
  customerName: text('customer_name'),
  description: text('description'),
  checkoutUrl: text('checkout_url'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ===== MESSAGING SYSTEM =====
export const conversation = pgTable('conversation', {
  id: text('id').primaryKey(),
  schoolId: text('schoolid'),
  type: text('type').notNull(),
  name: text('name'),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
}, (t) => [
  foreignKey({ columns: [t.schoolId], foreignColumns: [school.id] }).onDelete('cascade'),
])

// ===== STUDY VIDEO LIBRARY =====
export const studyVideo = pgTable('study_video', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  subject: text('subject').notNull(),
  className: text('class_name').notNull(),
  videoUrl: text('video_url').notNull(),
  durationMinutes: integer('duration_minutes'),
  teacherId: text('teacher_id').notNull(),
  isPublished: boolean('is_published').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [foreignKey({ columns: [t.teacherId], foreignColumns: [teacher.id] }).onDelete('cascade')])

export const studyVideoQuestion = pgTable('study_video_question', {
  id: text('id').primaryKey(),
  videoId: text('video_id').notNull(),
  studentId: text('student_id').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  foreignKey({ columns: [t.videoId], foreignColumns: [studyVideo.id] }).onDelete('cascade'),
  foreignKey({ columns: [t.studentId], foreignColumns: [student.id] }).onDelete('cascade'),
])

export const studyVideoReply = pgTable('study_video_reply', {
  id: text('id').primaryKey(),
  questionId: text('question_id').notNull(),
  teacherId: text('teacher_id').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  foreignKey({ columns: [t.questionId], foreignColumns: [studyVideoQuestion.id] }).onDelete('cascade'),
  foreignKey({ columns: [t.teacherId], foreignColumns: [teacher.id] }).onDelete('cascade'),
])

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
  schoolId: text('schoolid'),
  attachments: jsonb('attachments'),
  isRead: boolean('isRead').default(false),
  isDeleted: boolean('isDeleted').default(false),
  replyToId: text('replyToId'),
  reactions: jsonb('reactions'),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  foreignKey({ columns: [t.senderId], foreignColumns: [user.id] }).onDelete('cascade'),
  foreignKey({ columns: [t.conversationId], foreignColumns: [conversation.id] }).onDelete('cascade'),
  foreignKey({ columns: [t.schoolId], foreignColumns: [school.id] }).onDelete('set null'),
])

export const notification = pgTable('notification', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  schoolId: text('schoolid'),
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
  foreignKey({ columns: [t.schoolId], foreignColumns: [school.id] }).onDelete('cascade'),
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

export const supportTicketReply = pgTable('support_ticket_replies', {
  id: text('id').primaryKey(),
  ticketId: text('ticket_id').notNull(),
  senderId: text('sender_id').notNull(),
  message: text('message').notNull(),
  attachments: jsonb('attachments'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  foreignKey({ columns: [t.ticketId], foreignColumns: [supportTicket.id] }).onDelete('cascade'),
  foreignKey({ columns: [t.senderId], foreignColumns: [user.id] }).onDelete('cascade'),
])

export const abacPolicy = pgTable('abac_policy', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  role: text('role').notNull(), // STUDENT, PUPIL, TEACHER, PARENT, SCHOOL_ADMIN, SUPER_ADMIN
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
export const schoolRelations = relations(school, ({ many }) => ({
  users: many(user),
  students: many(student),
  teachers: many(teacher),
  parents: many(parent),
  classes: many(class_),
  assessments: many(assessment),
}))

export const userRelations = relations(user, ({ many, one }) => ({
  school: one(school, { fields: [user.schoolId], references: [school.id] }),
  userRole: one(userRole, { fields: [user.id], references: [userRole.userId] }),
  student: one(student, { fields: [user.id], references: [student.userId] }),
  teacher: one(teacher, { fields: [user.id], references: [teacher.userId] }),
  parent: one(parent, { fields: [user.id], references: [parent.userId] }),
}))

export const studentRelations = relations(student, ({ one, many }) => ({
  user: one(user, { fields: [student.userId], references: [user.id] }),
  school: one(school, { fields: [student.schoolId], references: [school.id] }),
  parent: one(parent, { fields: [student.parentId], references: [parent.id] }),
  results: many(assessmentResult),
  attendance: many(attendance),
  payments: many(payment),
}))

export const teacherRelations = relations(teacher, ({ one, many }) => ({
  user: one(user, { fields: [teacher.userId], references: [user.id] }),
  school: one(school, { fields: [teacher.schoolId], references: [school.id] }),
  classes: many(class_),
  subjects: many(teacherOnSubject),
  assessments: many(assessment),
}))

export const parentRelations = relations(parent, ({ one, many }) => ({
  user: one(user, { fields: [parent.userId], references: [user.id] }),
  school: one(school, { fields: [parent.schoolId], references: [school.id] }),
  students: many(student),
}))

export const conversationRelations = relations(conversation, ({ one, many }) => ({
  school: one(school, { fields: [conversation.schoolId], references: [school.id] }),
  participants: many(conversationParticipant),
  messages: many(message),
}))

export const messageRelations = relations(message, ({ one }) => ({
  sender: one(user, { fields: [message.senderId], references: [user.id] }),
  conversation: one(conversation, { fields: [message.conversationId], references: [conversation.id] }),
  school: one(school, { fields: [message.schoolId], references: [school.id] }),
}))

export const assessmentRelations = relations(assessment, ({ one, many }) => ({
  school: one(school, { fields: [assessment.schoolId], references: [school.id] }),
  subject: one(subject, { fields: [assessment.subjectId], references: [subject.id] }),
  questions: many(assessmentQuestion),
  results: many(assessmentResult),
  term: one(term, { fields: [assessment.termId], references: [term.id] }),
  teacher: one(teacher, { fields: [assessment.createdBy], references: [teacher.id] }),
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
  dailyRate: numeric('daily_rate', { precision: 12, scale: 2 }).default('0'),
  hourlyRate: numeric('hourly_rate', { precision: 12, scale: 2 }).default('0'),
  latePenaltyPerMinute: numeric('late_penalty_per_minute', { precision: 12, scale: 2 }).default('0'),
  earlyExitPenaltyPerMinute: numeric('early_exit_penalty_per_minute', { precision: 12, scale: 2 }).default('0'),
  absencePenaltyPerDay: numeric('absence_penalty_per_day', { precision: 12, scale: 2 }).default('0'),
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

// ===== ADULT EDUCATION TABLES =====
export const adultEducationEnrollment = pgTable('adult_education_enrollments', {
  id: text('id').primaryKey(),
  parentId: text('parent_id').notNull(),
  schoolId: text('school_id'),
  daysOfWeek: jsonb('days_of_week').notNull(), // Array of days, e.g. ["Monday", "Wednesday"]
  subjectToLearn: text('subject_to_learn').notNull(),
  preferredTime: text('preferred_time').notNull(),
  status: text('status').notNull().default('PENDING_PAYMENT'), // PENDING_PAYMENT, ACTIVE, EXPIRED
  registrationPaid: boolean('registration_paid').notNull().default(false),
  weeklyPaidUntil: timestamp('weekly_paid_until', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, (t) => [
  foreignKey({ columns: [t.schoolId], foreignColumns: [school.id] }).onDelete('set null'),
])

// ===== STUDENT GIFTS & LEADERBOARD REWARDS =====
export const studentGifts = pgTable('student_gifts', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()::text`),
  schoolId: text('schoolid'),
  studentId: text('student_id').notNull(),
  title: text('title').notNull(),
  reason: text('reason'),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull().default('0.00'),
  giftType: text('gift_type').notNull().default('CASH_OR_FEE'), // CASH, FEE_CREDIT, CASH_OR_FEE
  status: text('status').notNull().default('AVAILABLE'), // AVAILABLE, REDEEMED_CASH, APPLIED_TO_FEES, EXPIRED
  receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  foreignKey({ columns: [t.studentId], foreignColumns: [student.id] }).onDelete('cascade'),
  foreignKey({ columns: [t.schoolId], foreignColumns: [school.id] }).onDelete('set null'),
])

// ===== TEACHER ATTENDANCE & LEAVE TABLES =====
export const teacherAttendance = pgTable('teacher_attendance', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()::text`),
  schoolId: text('schoolid').notNull(),
  teacherId: text('teacherid').notNull(),
  workDate: date('work_date').notNull(),
  clockInAt: timestamp('clock_in_at', { withTimezone: true }),
  clockOutAt: timestamp('clock_out_at', { withTimezone: true }),
  clockInIp: text('clock_in_ip'),
  clockOutIp: text('clock_out_ip'),
  clockInDevice: text('clock_in_device'),
  clockOutDevice: text('clock_out_device'),
  clockInLat: numeric('clock_in_lat', { precision: 10, scale: 7 }),
  clockInLng: numeric('clock_in_lng', { precision: 10, scale: 7 }),
  clockOutLat: numeric('clock_out_lat', { precision: 10, scale: 7 }),
  clockOutLng: numeric('clock_out_lng', { precision: 10, scale: 7 }),
  totalMinutes: integer('total_minutes'),
  status: text('status').notNull().default('PRESENT'), // PRESENT, LATE, ABSENT, HALF_DAY, ON_LEAVE, SUSPENDED
  lateMinutes: integer('late_minutes').default(0),
  earlyExitMinutes: integer('early_exit_minutes').default(0),
  overtimeMinutes: integer('overtime_minutes').default(0),
  isManualOverride: boolean('is_manual_override').default(false),
  overrideBy: text('override_by'),
  overrideReason: text('override_reason'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique().on(t.teacherId, t.workDate),
  foreignKey({ columns: [t.schoolId], foreignColumns: [school.id] }).onDelete('cascade'),
  foreignKey({ columns: [t.teacherId], foreignColumns: [teacher.id] }).onDelete('cascade'),
  foreignKey({ columns: [t.overrideBy], foreignColumns: [user.id] }),
])

export const leaveTypes = pgTable('leave_types', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()::text`),
  schoolId: text('schoolid'),
  name: text('name').notNull(),
  code: text('code').notNull(),
  defaultDaysPerYear: integer('default_days_per_year').notNull().default(12),
  isPaid: boolean('is_paid').notNull().default(true),
  requiresAttachment: boolean('requires_attachment').default(false),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique().on(t.schoolId, t.code),
  foreignKey({ columns: [t.schoolId], foreignColumns: [school.id] }).onDelete('cascade'),
])

export const teacherLeaveRequests = pgTable('teacher_leave_requests', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()::text`),
  schoolId: text('schoolid').notNull(),
  teacherId: text('teacherid').notNull(),
  leaveTypeId: text('leave_type_id').notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  totalDays: integer('total_days').notNull(),
  reason: text('reason').notNull(),
  attachmentUrl: text('attachment_url'),
  attachmentPath: text('attachment_path'),
  status: text('status').notNull().default('PENDING'), // PENDING, APPROVED, REJECTED, CANCELLED
  reviewedBy: text('reviewed_by'),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  adminComment: text('admin_comment'),
  rejectionReason: text('rejection_reason'),
  isPaid: boolean('is_paid').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  foreignKey({ columns: [t.schoolId], foreignColumns: [school.id] }).onDelete('cascade'),
  foreignKey({ columns: [t.teacherId], foreignColumns: [teacher.id] }).onDelete('cascade'),
  foreignKey({ columns: [t.leaveTypeId], foreignColumns: [leaveTypes.id] }),
  foreignKey({ columns: [t.reviewedBy], foreignColumns: [user.id] }),
])

export const teacherLeaveBalance = pgTable('teacher_leave_balance', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()::text`),
  schoolId: text('schoolid').notNull(),
  teacherId: text('teacherid').notNull(),
  leaveTypeId: text('leave_type_id').notNull(),
  academicYear: text('academic_year').notNull(),
  allocatedDays: integer('allocated_days').notNull().default(0),
  usedDays: integer('used_days').notNull().default(0),
  pendingDays: integer('pending_days').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique().on(t.teacherId, t.leaveTypeId, t.academicYear),
  foreignKey({ columns: [t.schoolId], foreignColumns: [school.id] }).onDelete('cascade'),
  foreignKey({ columns: [t.teacherId], foreignColumns: [teacher.id] }).onDelete('cascade'),
  foreignKey({ columns: [t.leaveTypeId], foreignColumns: [leaveTypes.id] }),
])

export const teacherSalaryDeductions = pgTable('teacher_salary_deductions', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()::text`),
  schoolId: text('schoolid').notNull(),
  teacherId: text('teacherid').notNull(),
  month: text('month').notNull(),
  deductionType: text('deduction_type').notNull(), // ABSENCE, LATE, EARLY_EXIT, UNPAID_LEAVE, OTHER
  referenceAttendanceId: text('reference_attendance_id'),
  referenceLeaveId: text('reference_leave_id'),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  reason: text('reason'),
  appliedBy: text('applied_by'),
  appliedAt: timestamp('applied_at', { withTimezone: true }).notNull().defaultNow(),
  reversed: boolean('reversed').default(false),
  reversedBy: text('reversed_by'),
  reversedAt: timestamp('reversed_at', { withTimezone: true }),
  reversalReason: text('reversal_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  foreignKey({ columns: [t.schoolId], foreignColumns: [school.id] }).onDelete('cascade'),
  foreignKey({ columns: [t.teacherId], foreignColumns: [teacher.id] }).onDelete('cascade'),
  foreignKey({ columns: [t.referenceAttendanceId], foreignColumns: [teacherAttendance.id] }),
  foreignKey({ columns: [t.referenceLeaveId], foreignColumns: [teacherLeaveRequests.id] }),
  foreignKey({ columns: [t.appliedBy], foreignColumns: [user.id] }),
  foreignKey({ columns: [t.reversedBy], foreignColumns: [user.id] }),
])

export const schoolAttendanceConfig = pgTable('school_attendance_config', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()::text`),
  schoolId: text('schoolid').notNull().unique(),
  workStartTime: text('work_start_time').notNull().default('08:00:00'),
  workEndTime: text('work_end_time').notNull().default('16:00:00'),
  lateThresholdMinutes: integer('late_threshold_minutes').notNull().default(10),
  earlyExitThresholdMinutes: integer('early_exit_threshold_minutes').notNull().default(10),
  halfDayMinutes: integer('half_day_minutes').notNull().default(180),
  autoAbsentIfNoClockin: boolean('auto_absent_if_no_clockin').default(true),
  requireSelfie: boolean('require_selfie').default(false),
  requireLocation: boolean('require_location').default(false),
  autoDeductAbsence: boolean('auto_deduct_absence').default(false),
  autoDeductLate: boolean('auto_deduct_late').default(false),
  autoDeductEarlyExit: boolean('auto_deduct_early_exit').default(false),
  unpaidLeaveDeduction: boolean('unpaid_leave_deduction').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  foreignKey({ columns: [t.schoolId], foreignColumns: [school.id] }).onDelete('cascade'),
])

export const adultEducationPayment = pgTable('adult_education_payments', {
  id: text('id').primaryKey(),
  parentId: text('parent_id').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  paymentType: text('payment_type').notNull(), // REGISTRATION, WEEKLY
  reference: text('reference').notNull().unique(),
  status: text('status').notNull().default('success'), // success, pending, failed
  paidAt: timestamp('paid_at', { withTimezone: true }).notNull().defaultNow()
})

export const adultEducationClass = pgTable('adult_education_classes', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  type: text('type').notNull(), // VIDEO, LIVE, ASSIGNMENT, SAVED_SESSION
  url: text('url'), // Video URL or meeting URL
  content: text('content'), // Assignment details
  dueDate: timestamp('due_date', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  teacherId: text('teacher_id') // Null/empty means Admin is the teacher
})

export const systemSettings = pgTable('system_settings', {
  id: text('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value'),
  type: text('type'),
  description: text('description'),
  updatedAt: timestamp('updated_at').defaultNow()
})

// ===== INVITATIONS TABLE =====
export const invitations = pgTable('invitations', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull(),
  email: text('email'),
  phone: text('phone'),
  role: text('role').notNull(), // TEACHER, PARENT, STUDENT
  token: text('token').notNull().unique(),
  status: text('status').notNull().default('PENDING'), // PENDING, ACCEPTED, EXPIRED
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  invitedBy: text('invited_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  foreignKey({ columns: [t.schoolId], foreignColumns: [school.id] }).onDelete('cascade'),
])

// ===== ASSESSMENT SCHEDULE TABLE =====
export const assessmentSchedule = pgTable('assessment_schedule', {
  id: text('id').primaryKey(),
  assessmentId: text('assessment_id').notNull(),
  startTime: timestamp('start_time', { withTimezone: true }).notNull(),
  endTime: timestamp('end_time', { withTimezone: true }).notNull(),
  classId: text('class_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  foreignKey({ columns: [t.assessmentId], foreignColumns: [assessment.id] }).onDelete('cascade'),
])

// ===== BOOK BORROWINGS TABLE =====
export const bookBorrowings = pgTable('book_borrowings', {
  id: text('id').primaryKey(),
  bookId: text('book_id').notNull(),
  userId: text('user_id'),
  studentId: text('student_id'),
  borrowDate: timestamp('borrow_date', { withTimezone: true }).notNull().defaultNow(),
  dueDate: timestamp('due_date', { withTimezone: true }).notNull(),
  returnDate: timestamp('return_date', { withTimezone: true }),
  fineAmount: numeric('fine_amount', { precision: 12, scale: 2 }).default('0.00'),
  status: text('status').notNull().default('BORROWED'), // BORROWED, RETURNED, OVERDUE
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  foreignKey({ columns: [t.bookId], foreignColumns: [libraryBooks.id] }).onDelete('cascade'),
])

// ===== STUDENT BADGES TABLE =====
export const studentBadges = pgTable('student_badges', {
  id: text('id').primaryKey(),
  studentId: text('student_id').notNull(),
  badgeName: text('badge_name').notNull(),
  badgeType: text('badge_type').notNull(), // GOLD, SILVER, BRONZE, SPECIAL
  reason: text('reason'),
  awardedAt: timestamp('awarded_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  foreignKey({ columns: [t.studentId], foreignColumns: [student.id] }).onDelete('cascade'),
])

// ===== PAYMENT WEBHOOK LOGS TABLE =====
export const paymentWebhookLogs = pgTable('payment_webhook_logs', {
  id: text('id').primaryKey(),
  reference: text('reference').notNull(),
  eventType: text('event_type').notNull(),
  payload: jsonb('payload'),
  status: text('status').notNull().default('PROCESSED'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ===== FAQ ARTICLES TABLE =====
export const nigerianBanks = pgTable('nigerian_banks', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()::text`),
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
  slug: text('slug'),
  nibssCode: text('nibss_code'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const faqArticles = pgTable('faq_articles', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  category: text('category').notNull(),
  content: text('content').notNull(),
  keywords: jsonb('keywords'),
  isPublished: boolean('is_published').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ===== LESSON NOTES TABLE =====
export const lessonNotes = pgTable('lesson_notes', {
  id: text('id').primaryKey(),
  schoolId: text('school_id'),
  teacherId: text('teacher_id'),
  title: text('title').notNull(),
  subject: text('subject').notNull(),
  classLevel: text('class_level').notNull(),
  author: text('author').notNull(),
  category: text('category').default('Lesson Notes'),
  content: text('content'), // For manual typing
  description: text('description'),
  fileUrl: text('file_url'), // Supabase Storage public bucket URL
  storagePath: text('storage_path'), // Path inside Supabase Storage bucket
  fileSize: text('file_size'),
  isPdf: boolean('is_pdf').default(false),
  isDigital: boolean('is_digital').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  foreignKey({ columns: [t.schoolId], foreignColumns: [school.id] }).onDelete('set null'),
])
