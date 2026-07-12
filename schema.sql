-- ====================================================================
-- EL GOODNEWS INT'L ACADEMY - COMPLETE SCHOOL MANAGEMENT SYSTEM SCHEMA
-- ====================================================================
-- This schema represents all entities, tables, constraints, relations,
-- and auditing logs required to run the EL GOODNEWS Academy platform.
-- Compatible with PostgreSQL (Neon / Supabase).
-- ====================================================================

-- ===== CORE USER TABLES =====

CREATE TABLE IF NOT EXISTS "user" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "name" TEXT,
  "image" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "user_role" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL UNIQUE,
  "role" TEXT NOT NULL, -- 'ADMIN', 'TEACHER', 'PARENT', 'STUDENT'
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT "user_role_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE
);

-- ===== PARENT PROFILE TABLE =====

CREATE TABLE IF NOT EXISTS "parent" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL UNIQUE,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "phoneNumber" TEXT,
  "address" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT "parent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE
);

-- ===== STUDENT PROFILE TABLE =====

CREATE TABLE IF NOT EXISTS "student" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT UNIQUE,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "dateOfBirth" DATE,
  "gender" TEXT,
  "class" TEXT NOT NULL,
  "arm" TEXT,
  "department" TEXT,
  "admissionNumber" TEXT UNIQUE,
  "parentId" TEXT,
  "termId" TEXT,
  "sessionId" TEXT,
  "profileImage" TEXT,
  "isActive" BOOLEAN DEFAULT TRUE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT "student_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE,
  CONSTRAINT "student_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "parent"("id") ON DELETE SET NULL
);

-- ===== TEACHER PROFILE TABLE =====

CREATE TABLE IF NOT EXISTS "teacher" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL UNIQUE,
  "staffCode" TEXT UNIQUE,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "type" TEXT DEFAULT 'FULL_TIME', -- 'FULL_TIME', 'PART_TIME'
  "isClassTeacher" BOOLEAN DEFAULT FALSE,
  "assignedClassId" TEXT,
  "daysPresent" JSONB,
  "applicationLetterUrl" TEXT,
  "cvUrl" TEXT,
  "qualification" TEXT,
  "specialization" TEXT,
  "profileImage" TEXT,
  "status" TEXT DEFAULT 'PENDING',
  "isActive" BOOLEAN DEFAULT TRUE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT "teacher_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE
);

-- ===== ACADEMIC STRUCTURE TABLES =====

CREATE TABLE IF NOT EXISTS "academic_session" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "startDate" DATE NOT NULL,
  "endDate" DATE NOT NULL,
  "isCurrent" BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS "term" (
  "id" TEXT PRIMARY KEY,
  "sessionId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "startDate" DATE NOT NULL,
  "endDate" DATE NOT NULL,
  "isCurrent" BOOLEAN DEFAULT FALSE,
  CONSTRAINT "term_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "academic_session"("id")
);

CREATE TABLE IF NOT EXISTS "class" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "teacherId" TEXT,
  CONSTRAINT "class_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teacher"("id")
);

CREATE TABLE IF NOT EXISTS "subject" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "code" TEXT UNIQUE
);

CREATE TABLE IF NOT EXISTS "teacher_on_subject" (
  "id" TEXT PRIMARY KEY,
  "teacherId" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  "classId" TEXT NOT NULL,
  CONSTRAINT "teacher_on_subject_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teacher"("id"),
  CONSTRAINT "teacher_on_subject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subject"("id"),
  CONSTRAINT "teacher_on_subject_classId_fkey" FOREIGN KEY ("classId") REFERENCES "class"("id")
);

-- ===== PROMOTION & DEMOTION HISTORY =====

CREATE TABLE IF NOT EXISTS "promotion_history" (
  "id" TEXT PRIMARY KEY,
  "studentId" TEXT NOT NULL,
  "fromClass" TEXT NOT NULL,
  "toClass" TEXT NOT NULL,
  "type" TEXT NOT NULL, -- 'PROMOTION', 'DEMOTION'
  "reason" TEXT,
  "adminComment" TEXT,
  "performedBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT "promotion_history_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student"("id"),
  CONSTRAINT "promotion_history_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES "user"("id")
);

-- ===== CBT & ASSESSMENT TABLES =====

CREATE TABLE IF NOT EXISTS "assessment" (
  "id" TEXT PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "subjectId" TEXT NOT NULL,
  "termId" TEXT NOT NULL,
  "createdBy" TEXT NOT NULL,
  "duration" INTEGER NOT NULL,
  "type" TEXT NOT NULL, -- 'EXAM', 'TEST', 'QUIZ'
  "status" TEXT DEFAULT 'draft',
  "passingScore" INTEGER DEFAULT 40,
  "totalPoints" INTEGER DEFAULT 100,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT "assessment_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subject"("id"),
  CONSTRAINT "assessment_termId_fkey" FOREIGN KEY ("termId") REFERENCES "term"("id"),
  CONSTRAINT "assessment_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "teacher"("id")
);

CREATE TABLE IF NOT EXISTS "assessment_question" (
  "id" TEXT PRIMARY KEY,
  "assessmentId" TEXT NOT NULL,
  "questionText" TEXT NOT NULL,
  "questionType" TEXT NOT NULL, -- 'MCQ_Single', 'MCQ_Multiple', 'FITB', 'TrueFalse', 'Numeric', 'ShortAnswer'
  "options" JSONB,
  "correctAnswer" TEXT,
  "points" INTEGER DEFAULT 1,
  "explanation" TEXT,
  "order" INTEGER NOT NULL,
  CONSTRAINT "assessment_question_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessment"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "assessment_result" (
  "id" TEXT PRIMARY KEY,
  "assessmentId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "score" NUMERIC(5, 2) NOT NULL,
  "totalQuestions" INTEGER NOT NULL,
  "correctAnswers" INTEGER NOT NULL,
  "timeSpent" INTEGER NOT NULL,
  "status" TEXT NOT NULL, -- 'COMPLETED', 'ONGOING', 'PASSED', 'FAILED'
  "gradedBy" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT "assessment_result_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessment"("id"),
  CONSTRAINT "assessment_result_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student"("id")
);

CREATE TABLE IF NOT EXISTS "student_answer" (
  "id" TEXT PRIMARY KEY,
  "assessmentResultId" TEXT NOT NULL,
  "questionId" TEXT NOT NULL,
  "answerText" TEXT,
  "isCorrect" BOOLEAN,
  "pointsEarned" INTEGER,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT "student_answer_assessmentResultId_fkey" FOREIGN KEY ("assessmentResultId") REFERENCES "assessment_result"("id") ON DELETE CASCADE
);

-- ===== ATTENDANCE =====

CREATE TABLE IF NOT EXISTS "attendance" (
  "id" TEXT PRIMARY KEY,
  "studentId" TEXT NOT NULL,
  "classId" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "status" TEXT NOT NULL, -- 'PRESENT', 'ABSENT', 'LATE'
  "remarks" TEXT,
  "recordedBy" TEXT,
  "recordedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT "attendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student"("id"),
  CONSTRAINT "attendance_classId_fkey" FOREIGN KEY ("classId") REFERENCES "class"("id")
);

-- ===== FEES & PAYMENTS =====

CREATE TABLE IF NOT EXISTS "fee_structure" (
  "id" TEXT PRIMARY KEY,
  "class" TEXT NOT NULL,
  "department" TEXT,
  "feeType" TEXT NOT NULL, -- 'TUITION', 'PTA', 'SPORTS', 'DEVELOPMENT', 'EXAM'
  "amount" NUMERIC(12, 2) NOT NULL,
  "dueDate" DATE,
  "description" TEXT,
  "isActive" BOOLEAN DEFAULT TRUE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT "fee_structure_class_department_feeType_unique" UNIQUE ("class", "department", "feeType")
);

CREATE TABLE IF NOT EXISTS "payment" (
  "id" TEXT PRIMARY KEY,
  "studentId" TEXT NOT NULL,
  "parentId" TEXT,
  "termId" TEXT,
  "amount" NUMERIC(12, 2) NOT NULL,
  "feeType" TEXT,
  "paymentMethod" TEXT NOT NULL, -- 'KORAPAY', 'CASH', 'TRANSFER'
  "transactionReference" TEXT UNIQUE,
  "korapayReference" TEXT UNIQUE,
  "receiptUrl" TEXT,
  "status" TEXT DEFAULT 'pending', -- 'pending', 'success', 'failed'
  "paymentDate" TIMESTAMP WITH TIME ZONE,
  "paidAt" TIMESTAMP WITH TIME ZONE,
  "description" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT "payment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student"("id")
);

CREATE TABLE IF NOT EXISTS "payment_installment" (
  "id" TEXT PRIMARY KEY,
  "paymentId" TEXT NOT NULL,
  "amount" NUMERIC(12, 2) NOT NULL,
  "dueDate" DATE NOT NULL,
  "paidAt" TIMESTAMP WITH TIME ZONE,
  "status" TEXT DEFAULT 'pending',
  "installmentNumber" INTEGER NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT "payment_installment_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payment"("id")
);

-- ===== MESSAGING SYSTEM =====

CREATE TABLE IF NOT EXISTS "conversation" (
  "id" TEXT PRIMARY KEY,
  "type" TEXT NOT NULL, -- 'DIRECT', 'GROUP'
  "name" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "conversation_participant" (
  "id" TEXT PRIMARY KEY,
  "conversationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "lastReadAt" TIMESTAMP,
  "joinedAt" TIMESTAMP DEFAULT NOW(),
  CONSTRAINT "conversation_participant_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversation"("id"),
  CONSTRAINT "conversation_participant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id")
);

CREATE TABLE IF NOT EXISTS "message" (
  "id" TEXT PRIMARY KEY,
  "content" TEXT NOT NULL,
  "senderId" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "attachments" JSONB,
  "isRead" BOOLEAN DEFAULT FALSE,
  "isDeleted" BOOLEAN DEFAULT FALSE,
  "replyToId" TEXT,
  "reactions" JSONB,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT "message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "user"("id") ON DELETE CASCADE,
  CONSTRAINT "message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversation"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "notification" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "metadata" JSONB,
  "isRead" BOOLEAN DEFAULT FALSE,
  "actionUrl" TEXT,
  "readAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT "notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE
);

-- ===== DISPUTE & SUPPORT =====

CREATE TABLE IF NOT EXISTS "dispute" (
  "id" TEXT PRIMARY KEY,
  "ticketNumber" TEXT NOT NULL UNIQUE,
  "title" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "priority" TEXT NOT NULL,
  "status" TEXT DEFAULT 'OPEN', -- 'OPEN', 'PENDING', 'RESOLVED'
  "description" TEXT NOT NULL,
  "evidence" JSONB,
  "raisedById" TEXT NOT NULL,
  "assignedToId" TEXT,
  "relatedStudentId" TEXT,
  "relatedPaymentId" TEXT,
  "relatedAssessmentId" TEXT,
  "resolution" TEXT,
  "resolvedBy" TEXT,
  "resolvedAt" TIMESTAMP WITH TIME ZONE,
  "escalatedAt" TIMESTAMP WITH TIME ZONE,
  "escalatedTo" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT "dispute_raisedById_fkey" FOREIGN KEY ("raisedById") REFERENCES "user"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "dispute_message" (
  "id" TEXT PRIMARY KEY,
  "disputeId" TEXT NOT NULL,
  "senderId" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "attachments" JSONB,
  "isInternal" BOOLEAN DEFAULT FALSE,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  CONSTRAINT "dispute_message_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "dispute"("id"),
  CONSTRAINT "dispute_message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "user"("id")
);

CREATE TABLE IF NOT EXISTS "support_ticket" (
  "id" TEXT PRIMARY KEY,
  "ticketNumber" TEXT NOT NULL UNIQUE,
  "title" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "priority" TEXT NOT NULL,
  "status" TEXT DEFAULT 'OPEN',
  "description" TEXT NOT NULL,
  "screenshots" JSONB,
  "userId" TEXT NOT NULL,
  "assignedAgentId" TEXT,
  "resolution" TEXT,
  "satisfaction" TEXT,
  "resolvedAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT "support_ticket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id")
);

-- ===== ACCESS CONTROL (ABAC) & AUDITING =====

CREATE TABLE IF NOT EXISTS "abac_policy" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "description" TEXT,
  "role" TEXT NOT NULL,
  "resource" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "conditions" JSONB NOT NULL,
  "priority" INTEGER DEFAULT 0,
  "effect" TEXT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "audit_log" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "resource" TEXT NOT NULL,
  "resourceId" TEXT,
  "details" JSONB,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT "audit_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE
);
