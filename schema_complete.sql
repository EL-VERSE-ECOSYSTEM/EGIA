-- =====================================================================
-- EL GOODNEWS INT'L ACADEMY - UNIFIED COMPREHENSIVE PostgreSQL DATABASE SCHEMA
-- Handles all core structures, automated credentials, library resources,
-- profile media, and real-time proctored and classroom video recordings.
-- =====================================================================

-- Enable necessary Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean drop of existing tables to prevent type collisions (ERROR: 42710)
DROP TABLE IF EXISTS public.video_sessions CASCADE;
DROP TABLE IF EXISTS public.library_books CASCADE;
DROP TABLE IF EXISTS public.payment_installment CASCADE;
DROP TABLE IF EXISTS public.payment CASCADE;
DROP TABLE IF EXISTS public.fee_structure CASCADE;
DROP TABLE IF EXISTS public.assessment_result CASCADE;
DROP TABLE IF EXISTS public.assessment CASCADE;
DROP TABLE IF EXISTS public.dispute CASCADE;
DROP TABLE IF EXISTS public.notification CASCADE;
DROP TABLE IF EXISTS public.student CASCADE;
DROP TABLE IF EXISTS public.teacher CASCADE;
DROP TABLE IF EXISTS public.parent CASCADE;
DROP TABLE IF EXISTS public.user_role CASCADE;
DROP TABLE IF EXISTS public."user" CASCADE;

-- ---------------------------------------------------------------------
-- 1. CORE USER & ACCOUNT SECURITY TABLES
-- ---------------------------------------------------------------------
CREATE TABLE public."user" (
  id text NOT NULL,
  email text NOT NULL UNIQUE,
  name text,
  image text, -- Profile Picture media URL / Base64 String
  createdAt timestamp with time zone NOT NULL DEFAULT now(),
  updatedAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_pkey PRIMARY KEY (id)
);

CREATE TABLE public.user_role (
  id text NOT NULL,
  userId text NOT NULL UNIQUE,
  role text NOT NULL, -- ADMIN, TEACHER, PARENT, STUDENT
  createdAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_role_pkey PRIMARY KEY (id),
  CONSTRAINT user_role_userId_fkey FOREIGN KEY (userId) REFERENCES public."user"(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- 2. ACADEMIC AND SCHOOL PROFILES
-- ---------------------------------------------------------------------
CREATE TABLE public.parent (
  id text NOT NULL,
  userId text NOT NULL UNIQUE,
  firstName text NOT NULL,
  lastName text NOT NULL,
  phoneNumber text,
  address text,
  profileImage text, -- Parent profile picture media path
  facialVerificationVideo text, -- Facial structure verification video session URL
  occupation text,
  createdAt timestamp with time zone NOT NULL DEFAULT now(),
  updatedAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT parent_pkey PRIMARY KEY (id),
  CONSTRAINT parent_userId_fkey FOREIGN KEY (userId) REFERENCES public."user"(id) ON DELETE CASCADE
);

CREATE TABLE public.student (
  id text NOT NULL,
  userId text UNIQUE,
  firstName text NOT NULL,
  middleName text,
  lastName text NOT NULL,
  dateOfBirth date,
  dateOfResumption date,
  gender text,
  class text NOT NULL, -- Ranges from Primary 3 to SSS 3
  arm text,
  department text, -- SCIENCE, ARTS, COMMERCIAL
  admissionNumber text UNIQUE, -- Unique generated GODXXXXXX login identifier
  parentId text,
  termId text,
  sessionId text,
  profileImage text, -- Student profile picture URL
  facialVerificationVideo text, -- Biometric webcam media verification
  subjectsDone jsonb, -- Array of enrolled academic subjects
  isActive boolean DEFAULT true,
  password text DEFAULT 'default',
  createdAt timestamp with time zone NOT NULL DEFAULT now(),
  updatedAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT student_pkey PRIMARY KEY (id),
  CONSTRAINT student_userId_fkey FOREIGN KEY (userId) REFERENCES public."user"(id) ON DELETE CASCADE,
  CONSTRAINT student_parentId_fkey FOREIGN KEY (parentId) REFERENCES public.parent(id) ON DELETE SET NULL
);

CREATE TABLE public.teacher (
  id text NOT NULL,
  userId text NOT NULL UNIQUE,
  staffCode text UNIQUE, -- Unique generated EGIA-ST-XXXXXX login identifier
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
  profileImage text, -- Teacher profile picture URL
  facialVerificationVideo text, -- Webcam biometric session recording path
  status text DEFAULT 'PENDING',
  isActive boolean DEFAULT true,
  createdAt timestamp with time zone NOT NULL DEFAULT now(),
  updatedAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT teacher_pkey PRIMARY KEY (id),
  CONSTRAINT teacher_userId_fkey FOREIGN KEY (userId) REFERENCES public."user"(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- 3. SCHOOL FEES, PAYMENTS, AND BILLING (ONLINE KORAPAY & MANUAL)
-- ---------------------------------------------------------------------
CREATE TABLE public.fee_structure (
  id text NOT NULL,
  class text NOT NULL,
  department text,
  feeType text NOT NULL, -- TUITION, UNIFORM, BOOKS, ACTIVATION, SPORTS
  amount numeric(12, 2) NOT NULL,
  dueDate date,
  description text,
  isActive boolean DEFAULT true,
  createdAt timestamp with time zone NOT NULL DEFAULT now(),
  updatedAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT fee_structure_pkey PRIMARY KEY (id),
  CONSTRAINT fee_structure_class_dept_type_unique UNIQUE (class, department, feeType)
);

CREATE TABLE public.payment (
  id text NOT NULL,
  studentId text NOT NULL,
  parentId text,
  termId text,
  amount numeric(12, 2) NOT NULL,
  feeType text,
  paymentMethod text NOT NULL, -- ONLINE (Korapay card/ussd), MANUAL (bank transfer receipt)
  transactionReference text UNIQUE,
  korapayReference text UNIQUE,
  receiptUrl text, -- Uploaded bank deposit/transfer slip image
  status text DEFAULT 'pending', -- pending, cleared, failed
  paymentDate timestamp with time zone,
  paidAt timestamp with time zone,
  description text,
  createdAt timestamp with time zone NOT NULL DEFAULT now(),
  updatedAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT payment_pkey PRIMARY KEY (id),
  CONSTRAINT payment_studentId_fkey FOREIGN KEY (studentId) REFERENCES public.student(id)
);

CREATE TABLE public.payment_installment (
  id text NOT NULL,
  paymentId text NOT NULL,
  amount numeric(12, 2) NOT NULL,
  dueDate date NOT NULL,
  paidAt timestamp with time zone,
  status text DEFAULT 'pending',
  installmentNumber integer NOT NULL,
  createdAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT payment_installment_pkey PRIMARY KEY (id),
  CONSTRAINT payment_installment_paymentId_fkey FOREIGN KEY (paymentId) REFERENCES public.payment(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- 4. DIGITAL LIBRARY & GOOGLE-LIKE CONTENT SEARCH ENGINE
-- ---------------------------------------------------------------------
CREATE TABLE public.library_books (
  id text NOT NULL,
  isbn text UNIQUE,
  title text NOT NULL,
  subtitle text,
  authors jsonb,
  author text,
  publisher text,
  publication_year integer,
  edition text,
  volume text,
  language text DEFAULT 'English',
  pages integer,
  category text, -- Textbooks, Past Questions, Class Notes, Video Tutorials, Study Guides
  sub_category text,
  description text,
  total_copies integer DEFAULT 1,
  available_copies integer DEFAULT 1,
  cover_image_url text,
  file_url text,
  location text,
  content text, -- Google-like exact searchable lesson textbook chapter context body
  subject text, -- Mathematics, Chemistry, English Language, Physics, etc.
  class_level text, -- Primary 3 - SSS 3
  keywords jsonb,
  is_digital boolean DEFAULT false,
  rating numeric,
  rating_count integer DEFAULT 0,
  borrowed_count integer DEFAULT 0,
  deleted_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT library_books_pkey PRIMARY KEY (id)
);

CREATE TABLE public.book_import_logs (
  id text NOT NULL,
  filename text NOT NULL,
  total_records integer DEFAULT 0,
  inserted integer DEFAULT 0,
  updated integer DEFAULT 0,
  skipped integer DEFAULT 0,
  failed integer DEFAULT 0,
  errors jsonb,
  status text DEFAULT 'PENDING',
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT book_import_logs_pkey PRIMARY KEY (id)
);

-- Create index to supercharge exact-phrase queries and keyword scans
CREATE INDEX IF NOT EXISTS idx_library_books_search
ON public.library_books USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, '') || ' ' || coalesce(author, '')));

-- ---------------------------------------------------------------------
-- 5. CBT ASSESSMENTS & REAL-TIME WEBCAM PROCTOR VIDEOS
-- ---------------------------------------------------------------------
CREATE TABLE public.assessment (
  id text NOT NULL,
  title text NOT NULL,
  description text,
  subjectId text NOT NULL,
  termId text NOT NULL,
  createdBy text NOT NULL,
  duration integer NOT NULL, -- Exam duration in minutes
  type text NOT NULL, -- EXAM, TEST, WEEKEND_ASSESSMENT
  status text DEFAULT 'draft',
  passingScore integer DEFAULT 40,
  totalPoints integer DEFAULT 100,
  createdAt timestamp with time zone NOT NULL DEFAULT now(),
  updatedAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT assessment_pkey PRIMARY KEY (id)
);

CREATE TABLE public.assessment_result (
  id text NOT NULL,
  assessmentId text NOT NULL,
  studentId text NOT NULL,
  score numeric(5, 2) NOT NULL,
  totalQuestions integer NOT NULL,
  correctAnswers integer NOT NULL,
  timeSpent integer NOT NULL,
  status text NOT NULL, -- PASSED, FAILED, UNDER_REVIEW
  assessmentVideo text, -- WebM proctored assessment video session path
  warningCount integer DEFAULT 0, -- Proctoring face-away / object violations
  proctorLogs jsonb, -- Timestamp logs of webcam triggers
  createdAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT assessment_result_pkey PRIMARY KEY (id),
  CONSTRAINT assessment_result_assessmentId_fkey FOREIGN KEY (assessmentId) REFERENCES public.assessment(id) ON DELETE CASCADE,
  CONSTRAINT assessment_result_studentId_fkey FOREIGN KEY (studentId) REFERENCES public.student(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- 6. LIVE VIDEO CLASSROOMS & STREAMING SESSION RECORDINGS
-- ---------------------------------------------------------------------
CREATE TABLE public.video_sessions (
  id text NOT NULL,
  title text NOT NULL,
  description text,
  class text NOT NULL, -- Target class grade
  subject text NOT NULL, -- Subject name
  hostTeacherId text NOT NULL, -- Host
  streamUrl text, -- Live streaming endpoint (WebRTC, HLS, or Jitsi SDK room)
  recordingUrl text, -- Saved lecture MP4 video URL
  status text DEFAULT 'scheduled', -- scheduled, live, completed, cancelled
  scheduledAt timestamp with time zone NOT NULL,
  durationMinutes integer DEFAULT 45,
  createdAt timestamp with time zone DEFAULT now(),
  CONSTRAINT video_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT video_sessions_teacher_fkey FOREIGN KEY (hostTeacherId) REFERENCES public.teacher(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- 7. MESSAGING, SYSTEM AUDITS, AND SUPPORT DISPUTES
-- ---------------------------------------------------------------------
CREATE TABLE public.dispute (
  id text NOT NULL,
  ticketNumber text NOT NULL UNIQUE,
  title text NOT NULL,
  category text NOT NULL,
  priority text NOT NULL,
  status text DEFAULT 'OPEN',
  description text NOT NULL,
  evidence jsonb, -- Array of upload slip images or screenshots
  raisedById text NOT NULL,
  createdAt timestamp with time zone NOT NULL DEFAULT now(),
  updatedAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT dispute_pkey PRIMARY KEY (id),
  CONSTRAINT dispute_raisedById_fkey FOREIGN KEY (raisedById) REFERENCES public."user"(id) ON DELETE CASCADE
);

CREATE TABLE public.notification (
  id text NOT NULL,
  userId text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL,
  metadata jsonb,
  isRead boolean DEFAULT false,
  createdAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT notification_pkey PRIMARY KEY (id),
  CONSTRAINT notification_userId_fkey FOREIGN KEY (userId) REFERENCES public."user"(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- 8. INITIAL HIGH-FIDELITY DIGITAL LIBRARY CATALOG SEED
-- ---------------------------------------------------------------------
INSERT INTO public.library_books (id, isbn, title, author, publisher, publication_year, category, total_copies, available_copies, location, content, subject, class_level)
VALUES
('res-1', 'ISBN-97810482', 'Essential Mathematics for Senior Secondary Schools (Book 1)', 'Dr. O. A. Adebayo', 'University Press', 2022, 'Textbooks', 10, 10, 'Main Block digital repository', 'Chapter 1: Number Bases. Let''s learn conversion between bases, addition, and subtraction in other bases. Binary, octal, and hexadecimal operations...', 'Mathematics', 'SSS 1')
ON CONFLICT (isbn) DO NOTHING;

INSERT INTO public.library_books (id, isbn, title, author, publisher, publication_year, category, total_copies, available_copies, location, content, subject, class_level)
VALUES
('res-2', 'ISBN-97812048', 'Modern Biology for Senior Secondary Schools', 'Prof. T. U. Ndu', 'African Educational Publishers', 2023, 'Textbooks', 15, 15, 'Science Block catalog', 'Chapter 3: Photosynthesis. Photosynthesis is the chemical process by which green plants build up complex organic substances from carbon dioxide and water using light energy...', 'Biology', 'SSS 2')
ON CONFLICT (isbn) DO NOTHING;

INSERT INTO public.library_books (id, isbn, title, author, publisher, publication_year, category, total_copies, available_copies, location, content, subject, class_level)
VALUES
('res-3', 'ISBN-97813592', 'New School Physics for SSS', 'M. W. Anyakoha', 'FEP Publishers', 2021, 'Textbooks', 8, 8, 'Science Block catalog', 'Chapter 12: Waves and Wave Motion. Reflection, refraction, diffraction, and polarization of wave pulses. Formulas for frequency, wavelength, and velocity...', 'Physics', 'SSS 3')
ON CONFLICT (isbn) DO NOTHING;
