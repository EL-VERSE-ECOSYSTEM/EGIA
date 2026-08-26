-- =====================================================================
-- EL LEARN APP - UNIFIED MULTI-TENANT PostgreSQL DATABASE SCHEMA
-- Handles multi-tenant school accounts, automated credentials, library,
-- CBT proctored exams, adult education, messaging, and real-time sync.
-- =====================================================================

-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables to ensure clean initialization
DROP TABLE IF EXISTS public.adult_education_enrollments CASCADE;
DROP TABLE IF EXISTS public.adult_education_payments CASCADE;
DROP TABLE IF EXISTS public.adult_education_classes CASCADE;
DROP TABLE IF EXISTS public.library_books CASCADE;
DROP TABLE IF EXISTS public.payment CASCADE;
DROP TABLE IF EXISTS public.fee_structure CASCADE;
DROP TABLE IF EXISTS public.assessment_result CASCADE;
DROP TABLE IF EXISTS public.assessment_question CASCADE;
DROP TABLE IF EXISTS public.assessment CASCADE;
DROP TABLE IF EXISTS public.message CASCADE;
DROP TABLE IF EXISTS public.conversation_participant CASCADE;
DROP TABLE IF EXISTS public.conversation CASCADE;
DROP TABLE IF EXISTS public.notification CASCADE;
DROP TABLE IF EXISTS public.student CASCADE;
DROP TABLE IF EXISTS public.teacher CASCADE;
DROP TABLE IF EXISTS public.parent CASCADE;
DROP TABLE IF EXISTS public.user_role CASCADE;
DROP TABLE IF EXISTS public."user" CASCADE;
DROP TABLE IF EXISTS public.school CASCADE;

-- ---------------------------------------------------------------------
-- 1. SCHOOL TENANCY TABLE
-- ---------------------------------------------------------------------
CREATE TABLE public.school (
  id text NOT NULL,
  name text NOT NULL,
  code text NOT NULL UNIQUE, -- First 4 letters of school name + 5 random digits (e.g., EGIA-19001)
  location text NOT NULL,
  registeredClasses jsonb NOT NULL,
  allowParents boolean NOT NULL DEFAULT true,
  adminName text NOT NULL,
  adminPhone text NOT NULL,
  adminEmail text NOT NULL,
  paymentStatus text NOT NULL DEFAULT 'PAID',
  paymentReference text UNIQUE,
  createdAt timestamp with time zone NOT NULL DEFAULT now(),
  updatedAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT school_pkey PRIMARY KEY (id)
);

-- ---------------------------------------------------------------------
-- 2. CORE USER & SECURITY TABLES
-- ---------------------------------------------------------------------
CREATE TABLE public."user" (
  id text NOT NULL,
  email text NOT NULL UNIQUE,
  name text,
  image text,
  schoolId text,
  createdAt timestamp with time zone NOT NULL DEFAULT now(),
  updatedAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_pkey PRIMARY KEY (id),
  CONSTRAINT user_schoolId_fkey FOREIGN KEY (schoolId) REFERENCES public.school(id) ON DELETE CASCADE
);

CREATE TABLE public.user_role (
  id text NOT NULL,
  userId text NOT NULL UNIQUE,
  role text NOT NULL, -- SUPER_ADMIN, SCHOOL_ADMIN, TEACHER, PARENT, STUDENT
  createdAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_role_pkey PRIMARY KEY (id),
  CONSTRAINT user_role_userId_fkey FOREIGN KEY (userId) REFERENCES public."user"(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- 3. PROFILES: PARENT, STUDENT, TEACHER
-- ---------------------------------------------------------------------
CREATE TABLE public.parent (
  id text NOT NULL,
  userId text NOT NULL UNIQUE,
  schoolId text,
  firstName text NOT NULL,
  lastName text NOT NULL,
  phoneNumber text,
  address text,
  profileImage text,
  facialVerificationVideo text,
  occupation text,
  createdAt timestamp with time zone NOT NULL DEFAULT now(),
  updatedAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT parent_pkey PRIMARY KEY (id),
  CONSTRAINT parent_userId_fkey FOREIGN KEY (userId) REFERENCES public."user"(id) ON DELETE CASCADE,
  CONSTRAINT parent_schoolId_fkey FOREIGN KEY (schoolId) REFERENCES public.school(id) ON DELETE SET NULL
);

CREATE TABLE public.student (
  id text NOT NULL,
  userId text UNIQUE,
  schoolId text,
  firstName text NOT NULL,
  middleName text,
  lastName text NOT NULL,
  dateOfBirth date,
  dateOfResumption date,
  gender text,
  class text NOT NULL,
  arm text,
  department text,
  admissionNumber text UNIQUE, -- e.g. EGIA-S-123456 or EGIA-P-123456
  parentId text,
  termId text,
  sessionId text,
  profileImage text,
  facialVerificationVideo text,
  subjectsDone jsonb,
  isActive boolean DEFAULT true,
  registrationStatus text NOT NULL DEFAULT 'WAIVED',
  password text DEFAULT 'default',
  createdAt timestamp with time zone NOT NULL DEFAULT now(),
  updatedAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT student_pkey PRIMARY KEY (id),
  CONSTRAINT student_userId_fkey FOREIGN KEY (userId) REFERENCES public."user"(id) ON DELETE CASCADE,
  CONSTRAINT student_parentId_fkey FOREIGN KEY (parentId) REFERENCES public.parent(id) ON DELETE SET NULL,
  CONSTRAINT student_schoolId_fkey FOREIGN KEY (schoolId) REFERENCES public.school(id) ON DELETE SET NULL
);

CREATE TABLE public.teacher (
  id text NOT NULL,
  userId text NOT NULL UNIQUE,
  schoolId text,
  staffCode text UNIQUE, -- e.g. EGIA-ST-123456
  firstName text NOT NULL,
  lastName text NOT NULL,
  type text DEFAULT 'FULL_TIME',
  isClassTeacher boolean DEFAULT false,
  isPartTime boolean DEFAULT false,
  assignedClassId text,
  handlingClasses jsonb,
  teachingSubjects jsonb,
  qualification text,
  specialization text,
  profileImage text,
  facialVerificationVideo text,
  status text DEFAULT 'PENDING',
  isActive boolean DEFAULT true,
  createdAt timestamp with time zone NOT NULL DEFAULT now(),
  updatedAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT teacher_pkey PRIMARY KEY (id),
  CONSTRAINT teacher_userId_fkey FOREIGN KEY (userId) REFERENCES public."user"(id) ON DELETE CASCADE,
  CONSTRAINT teacher_schoolId_fkey FOREIGN KEY (schoolId) REFERENCES public.school(id) ON DELETE SET NULL
);

-- ---------------------------------------------------------------------
-- 4. CBT ASSESSMENTS & EXAMS
-- ---------------------------------------------------------------------
CREATE TABLE public.assessment (
  id text NOT NULL,
  schoolId text,
  title text NOT NULL,
  description text,
  subjectId text NOT NULL,
  termId text NOT NULL,
  createdBy text NOT NULL,
  duration integer NOT NULL,
  type text NOT NULL, -- ASSESSMENT_CBT, EXAM_CBT, WEEKEND_ASSIGNMENT
  status text DEFAULT 'draft', -- draft, published, approved, rejected
  accesscode text,
  adminComment text,
  passingScore integer DEFAULT 40,
  totalPoints integer DEFAULT 100,
  createdAt timestamp with time zone NOT NULL DEFAULT now(),
  updatedAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT assessment_pkey PRIMARY KEY (id),
  CONSTRAINT assessment_schoolId_fkey FOREIGN KEY (schoolId) REFERENCES public.school(id) ON DELETE SET NULL
);

CREATE TABLE public.assessment_result (
  id text NOT NULL,
  assessmentId text NOT NULL,
  studentId text NOT NULL,
  score numeric(5, 2) NOT NULL,
  totalQuestions integer NOT NULL,
  correctAnswers integer NOT NULL,
  timeSpent integer NOT NULL,
  status text NOT NULL,
  assessmentVideo text,
  warningCount integer DEFAULT 0,
  proctorLogs jsonb,
  createdAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT assessment_result_pkey PRIMARY KEY (id),
  CONSTRAINT assessment_result_assessmentId_fkey FOREIGN KEY (assessmentId) REFERENCES public.assessment(id) ON DELETE CASCADE,
  CONSTRAINT assessment_result_studentId_fkey FOREIGN KEY (studentId) REFERENCES public.student(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- 5. MESSAGING & NOTIFICATIONS
-- ---------------------------------------------------------------------
CREATE TABLE public.conversation (
  id text NOT NULL,
  schoolId text,
  type text NOT NULL,
  name text,
  createdAt timestamp with time zone DEFAULT now(),
  updatedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT conversation_pkey PRIMARY KEY (id),
  CONSTRAINT conversation_schoolId_fkey FOREIGN KEY (schoolId) REFERENCES public.school(id) ON DELETE CASCADE
);

CREATE TABLE public.message (
  id text NOT NULL,
  content text NOT NULL,
  senderId text NOT NULL,
  conversationId text NOT NULL,
  schoolId text,
  attachments jsonb,
  isRead boolean DEFAULT false,
  createdAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT message_pkey PRIMARY KEY (id),
  CONSTRAINT message_senderId_fkey FOREIGN KEY (senderId) REFERENCES public."user"(id) ON DELETE CASCADE,
  CONSTRAINT message_conversationId_fkey FOREIGN KEY (conversationId) REFERENCES public.conversation(id) ON DELETE CASCADE,
  CONSTRAINT message_schoolId_fkey FOREIGN KEY (schoolId) REFERENCES public.school(id) ON DELETE SET NULL
);

CREATE TABLE public.notification (
  id text NOT NULL,
  userId text NOT NULL,
  schoolId text,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL,
  metadata jsonb,
  isRead boolean DEFAULT false,
  createdAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT notification_pkey PRIMARY KEY (id),
  CONSTRAINT notification_userId_fkey FOREIGN KEY (userId) REFERENCES public."user"(id) ON DELETE CASCADE,
  CONSTRAINT notification_schoolId_fkey FOREIGN KEY (schoolId) REFERENCES public.school(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- 6. DEFAULT SEED RECORDS
-- ---------------------------------------------------------------------
-- Insert Default School: EL GOODNEWS INTERNATIONAL ACADEMY
INSERT INTO public.school (id, name, code, location, registeredClasses, allowParents, adminName, adminPhone, adminEmail, paymentStatus, paymentReference)
VALUES (
  'sch_egia_default',
  'EL GOODNEWS INTERNATIONAL ACADEMY',
  'EGIA-19001',
  'Lagos, Nigeria',
  '["Primary 3","Primary 4","Primary 5","Primary 6","JSS1","JSS2","JSS3","SSS1","SSS2","SSS3"]'::jsonb,
  true,
  'School Administrator',
  '08108854279, 08061908715',
  'admin@egia.com',
  'PAID',
  'REF_EGIA_19001'
) ON CONFLICT (code) DO NOTHING;

-- Insert Super Admin User
INSERT INTO public."user" (id, email, name, schoolId)
VALUES (
  'usr_super_admin_01',
  'ixoralyon013@gmail.com',
  'Super Administrator',
  'sch_egia_default'
) ON CONFLICT (email) DO NOTHING;

-- Assign SUPER_ADMIN role
INSERT INTO public.user_role (id, userId, role)
VALUES (
  'ur_super_admin_01',
  'usr_super_admin_01',
  'SUPER_ADMIN'
) ON CONFLICT (userId) DO NOTHING;
