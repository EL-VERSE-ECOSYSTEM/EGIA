-- EL GOODNEWS ACADEMY: Canonical Complete Supabase SQL Schema
-- Full setup including multi-tenant school tenancy, adult education, realtime publications, and triggers.

drop table if exists public.adult_education_payments cascade;
drop table if exists public.adult_education_classes cascade;
drop table if exists public.adult_education_enrollments cascade;
drop table if exists public.report_card cascade;
drop table if exists public.teacher_request cascade;
drop table if exists public.teacher_wallet cascade;
drop table if exists public.book_favorites cascade;
drop table if exists public.book_import_logs cascade;
drop table if exists public.search_logs cascade;
drop table if exists public.book_reviews cascade;
drop table if exists public.reading_history cascade;
drop table if exists public.book_requests cascade;
drop table if exists public.book_borrowings cascade;
drop table if exists public.book_tag_relations cascade;
drop table if exists public.book_tags cascade;
drop table if exists public.book_categories cascade;
drop table if exists public.books cascade;
drop table if exists public.attendance_records cascade;
drop table if exists public.support_ticket_replies cascade;
drop table if exists public.support_tickets cascade;
drop table if exists public.dispute_messages cascade;
drop table if exists public.disputes cascade;
drop table if exists public.announcements cascade;
drop table if exists public.notification cascade;
drop table if exists public.notifications cascade;
drop table if exists public.message cascade;
drop table if exists public.messages cascade;
drop table if exists public.conversation_participant cascade;
drop table if exists public.conversation_participants cascade;
drop table if exists public.conversation cascade;
drop table if exists public.conversations cascade;
drop table if exists public.payment_webhook_logs cascade;
drop table if exists public.payment_installment cascade;
drop table if exists public.payment_installments cascade;
drop table if exists public.payment cascade;
drop table if exists public.payments cascade;
drop table if exists public.fee_structure cascade;
drop table if exists public.fee_structures cascade;
drop table if exists public.cbt_attempts cascade;
drop table if exists public.cbt_sessions cascade;
drop table if exists public.results cascade;
drop table if exists public.fitb_answers cascade;
drop table if exists public.questions cascade;
drop table if exists public.student_answer cascade;
drop table if exists public.assessment_result cascade;
drop table if exists public.assessment_question cascade;
drop table if exists public.assessment cascade;
drop table if exists public.assessments cascade;
drop table if exists public.timetables cascade;
drop table if exists public.class_subjects cascade;
drop table if exists public.teacher_on_subject cascade;
drop table if exists public.subject cascade;
drop table if exists public.subjects cascade;
drop table if exists public.student_class_assignments cascade;
drop table if exists public.class_arms cascade;
drop table if exists public.class cascade;
drop table if exists public.classes cascade;
drop table if exists public.term cascade;
drop table if exists public.terms cascade;
drop table if exists public.academic_session cascade;
drop table if exists public.academic_sessions cascade;
drop table if exists public.admins cascade;
drop table if exists public.parent_students cascade;
drop table if exists public.parent cascade;
drop table if exists public.parents cascade;
drop table if exists public.teacher cascade;
drop table if exists public.teachers cascade;
drop table if exists public.student cascade;
drop table if exists public.students cascade;
drop table if exists public.user_role cascade;
drop table if exists public."user" cascade;
drop table if exists public.users cascade;
drop table if exists public.school cascade;
drop table if exists public.promotion_history cascade;
drop table if exists public.permissions cascade;
drop table if exists public.role_permissions cascade;
drop table if exists public.user_permissions cascade;
drop table if exists public.abac_policy cascade;
drop table if exists public.abac_policies cascade;
drop table if exists public.audit_log cascade;
drop table if exists public.audit_logs cascade;
drop table if exists public.login_history cascade;
drop table if exists public.system_settings cascade;
drop table if exists public.learning_materials cascade;
drop table if exists public.disciplinary_records cascade;

drop schema if exists public cascade;
create schema public;
grant usage on schema public to postgres, anon, authenticated, service_role;

create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";
create extension if not exists citext;
create extension if not exists pg_trgm;
create extension if not exists unaccent;

-- SCHOOL TENANCY -------------------------------------------------------------
create table public."school" (
  "id" text primary key,
  "name" text not null,
  "code" text not null unique,
  "location" text not null,
  "registeredclasses" jsonb not null,
  "allowparents" boolean not null default true,
  "adminname" text not null,
  "adminphone" text not null,
  "adminemail" text not null,
  "bankname" text,
  "accountnumber" text,
  "accountname" text,
  "custompaymentlink" text,
  "paymentstatus" text not null default 'PENDING',
  "paymentreference" text unique,
  "createdat" timestamptz not null default now(),
  "updatedat" timestamptz not null default now()
);

-- CORE ACCOUNTS AND PROFILES -------------------------------------------------
create table public."user" (
  "id" text primary key,
  "email" text not null unique,
  "name" text,
  "image" text,
  "schoolid" text references public."school"("id") on delete cascade,
  "createdat" timestamptz not null default now(),
  "updatedat" timestamptz not null default now()
);

create table public."user_role" (
  "id" text primary key,
  "userid" text not null unique references public."user"("id") on delete cascade,
  "role" text not null,
  "createdat" timestamptz not null default now()
);

create table public."parent" (
  "id" text primary key,
  "userid" text not null unique references public."user"("id") on delete cascade,
  "schoolid" text references public."school"("id") on delete set null,
  "firstname" text not null,
  "lastname" text not null,
  "phonenumber" text,
  "address" text,
  "profileimage" text,
  "facialverificationvideo" text,
  "occupation" text,
  "createdat" timestamptz not null default now(),
  "updatedat" timestamptz not null default now()
);

create table public."teacher" (
  "id" text primary key,
  "userid" text not null unique references public."user"("id") on delete cascade,
  "schoolid" text references public."school"("id") on delete set null,
  "staffcode" text unique,
  "firstname" text not null,
  "lastname" text not null,
  "type" text default 'FULL_TIME',
  "isclassteacher" boolean default false,
  "isparttime" boolean default false,
  "assignedclassid" text,
  "dayspresent" jsonb,
  "handlingclasses" jsonb,
  "teachingsubjects" jsonb,
  "presentdays" jsonb,
  "resumptiontime" text,
  "resumptiondate" date,
  "bio" text,
  "applicationletterurl" text,
  "cvurl" text,
  "qualification" text,
  "specialization" text,
  "profileimage" text,
  "facialverificationvideo" text,
  "status" text default 'PENDING',
  "isactive" boolean default true,
  "createdat" timestamptz not null default now(),
  "updatedat" timestamptz not null default now()
);

create table public."academic_session" (
  "id" text primary key,
  "name" text not null,
  "startDate" date not null,
  "endDate" date not null,
  "isCurrent" boolean default false
);

create table public."term" (
  "id" text primary key,
  "sessionId" text not null references public."academic_session"("id"),
  "name" text not null,
  "startDate" date not null,
  "endDate" date not null,
  "isCurrent" boolean default false
);

create table public."class" (
  "id" text primary key,
  "name" text not null,
  "schoolId" text references public."school"("id") on delete cascade,
  "teacherId" text references public."teacher"("id")
);

create table public."student" (
  "id" text primary key,
  "userid" text unique references public."user"("id") on delete cascade,
  "schoolid" text references public."school"("id") on delete set null,
  "firstname" text not null,
  "middlename" text,
  "lastname" text not null,
  "dateofbirth" date,
  "dateofresumption" date,
  "gender" text,
  "class" text not null,
  "arm" text,
  "department" text,
  "admissionnumber" text unique,
  "parentid" text references public."parent"("id") on delete set null,
  "termid" text,
  "sessionid" text,
  "profileimage" text,
  "facialverificationvideo" text,
  "subjectsdone" jsonb,
  "isactive" boolean default true,
  "registrationstatus" text not null default 'WAIVED',
  "password" text default 'default',
  "createdat" timestamptz not null default now(),
  "updatedat" timestamptz not null default now()
);

-- SUBJECTS & ACADEMICS -------------------------------------------------------
create table public."subject" (
  "id" text primary key,
  "name" text not null,
  "code" text unique,
  "is_active" boolean not null default true,
  "is_custom" boolean not null default false,
  "education_levels" text[] not null default '{}',
  "departments" text[] not null default '{}'
);

create table public."teacher_on_subject" (
  "id" text primary key,
  "teacherId" text not null references public."teacher"("id"),
  "subjectId" text not null references public."subject"("id"),
  "classId" text not null references public."class"("id"),
  unique ("teacherId", "subjectId", "classId")
);

create table public."promotion_history" (
  "id" text primary key,
  "studentId" text not null references public."student"("id"),
  "fromClass" text not null,
  "toClass" text not null,
  "type" text not null,
  "reason" text,
  "adminComment" text,
  "performedBy" text not null references public."user"("id"),
  "createdAt" timestamptz not null default now()
);

-- ASSESSMENTS & CBT ---------------------------------------------------------
create table public."assessment" (
  "id" text primary key,
  "schoolid" text references public."school"("id") on delete set null,
  "title" text not null,
  "description" text,
  "subjectId" text not null references public."subject"("id"),
  "termId" text not null references public."term"("id"),
  "createdBy" text not null references public."teacher"("id"),
  "duration" integer not null,
  "type" text not null,
  "status" text default 'draft',
  "accesscode" text,
  "adminComment" text,
  "passingScore" integer default 40,
  "totalPoints" integer default 100,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table public."assessment_question" (
  "id" text primary key,
  "assessmentId" text not null references public."assessment"("id") on delete cascade,
  "questionText" text not null,
  "questionType" text not null,
  "options" jsonb,
  "correctAnswer" text,
  "points" integer default 1,
  "explanation" text,
  "order" integer not null
);

create table public."assessment_result" (
  "id" text primary key,
  "assessmentId" text not null references public."assessment"("id"),
  "studentId" text not null references public."student"("id"),
  "score" numeric(5,2) not null,
  "totalQuestions" integer not null, "correctAnswers" integer not null, "timeSpent" integer not null,
  "status" text not null, "gradedBy" text, "assessmentVideo" text, "warningCount" integer default 0,
  "proctorLogs" jsonb, "createdAt" timestamptz not null default now()
);

create table public."student_answer" (
  "id" text primary key,
  "assessmentResultId" text not null references public."assessment_result"("id") on delete cascade,
  "questionId" text not null references public."assessment_question"("id"),
  "answerText" text, "isCorrect" boolean, "pointsEarned" integer, "createdAt" timestamptz not null default now()
);

create table public."attendance" (
  "id" text primary key,
  "studentId" text not null references public."student"("id"),
  "classId" text not null references public."class"("id"),
  "date" date not null, "status" text not null, "remarks" text, "recordedBy" text, "recordedAt" timestamptz not null default now()
);

-- FEES & PAYMENTS -----------------------------------------------------------
create table public."fee_structure" (
  "id" text primary key, "class" text not null, "department" text, "feeType" text not null,
  "amount" numeric(12,2) not null, "dueDate" date, "description" text, "isActive" boolean default true,
  "createdAt" timestamptz not null default now(), "updatedAt" timestamptz not null default now(),
  unique ("class", "department", "feeType")
);

create table public."payment" (
  "id" text primary key,
  "studentid" text not null references public."student"("id"),
  "parentid" text, "termid" text, "amount" numeric(12,2) not null, "feetype" text, "paymentmethod" text not null,
  "transactionreference" text unique, "korapayreference" text unique, "receipturl" text, "status" text default 'pending',
  "paymentdate" timestamptz, "paidat" timestamptz, "description" text,
  "createdat" timestamptz not null default now(), "updatedat" timestamptz not null default now()
);

create table public."payment_installment" (
  "id" text primary key,
  "paymentId" text not null references public."payment"("id"),
  "amount" numeric(12,2) not null, "dueDate" date not null, "paidAt" timestamptz, "status" text default 'pending', "installmentNumber" integer not null,
  "createdAt" timestamptz not null default now()
);

-- COMMUNICATION & NOTIFICATIONS ---------------------------------------------
create table public."conversation" (
  "id" text primary key,
  "schoolid" text references public."school"("id") on delete cascade,
  "type" text not null, "name" text, "createdAt" timestamp default now(), "updatedAt" timestamp default now()
);

create table public."conversation_participant" (
  "id" text primary key,
  "conversationId" text not null references public."conversation"("id") on delete cascade,
  "userId" text not null references public."user"("id") on delete cascade,
  "lastReadAt" timestamp, "joinedAt" timestamp default now()
);

create table public."message" (
  "id" text primary key,
  "content" text not null,
  "senderId" text not null references public."user"("id") on delete cascade,
  "conversationId" text not null references public."conversation"("id") on delete cascade,
  "schoolid" text references public."school"("id") on delete set null,
  "attachments" jsonb, "isRead" boolean default false, "isDeleted" boolean default false, "replyToId" text, "reactions" jsonb,
  "createdAt" timestamptz not null default now()
);

create table public."notification" (
  "id" text primary key,
  "userId" text not null references public."user"("id") on delete cascade,
  "schoolid" text references public."school"("id") on delete cascade,
  "title" text not null, "message" text not null, "type" text not null, "metadata" jsonb, "isRead" boolean default false,
  "actionUrl" text, "readAt" timestamptz, "createdAt" timestamptz not null default now()
);

-- ADULT EDUCATION ------------------------------------------------------------
create table public."adult_education_enrollments" (
  "id" text primary key,
  "parent_id" text not null,
  "school_id" text references public."school"("id") on delete set null,
  "days_of_week" jsonb not null,
  "subject_to_learn" text not null,
  "preferred_time" text not null,
  "status" text not null default 'PENDING_PAYMENT',
  "registration_paid" boolean not null default false,
  "weekly_paid_until" timestamptz,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

create table public."adult_education_payments" (
  "id" text primary key,
  "parent_id" text not null,
  "amount" numeric(12,2) not null,
  "payment_type" text not null,
  "reference" text not null unique,
  "status" text not null default 'success',
  "paid_at" timestamptz not null default now()
);

create table public."adult_education_classes" (
  "id" text primary key,
  "title" text not null,
  "description" text,
  "type" text not null,
  "url" text,
  "content" text,
  "due_date" timestamptz,
  "created_at" timestamptz not null default now(),
  "teacher_id" text
);

-- TEACHER WALLET & REQUESTS --------------------------------------------------
create table public."teacher_wallet" (
  "id" text primary key,
  "teacherId" text not null unique references public."teacher"("id"),
  "balance" numeric(12,2) default 0.00,
  "salaryAmount" numeric(12,2) default 150000.00,
  "salaryStatus" text default 'pending',
  "updatedAt" timestamptz not null default now()
);

create table public."teacher_request" (
  "id" text primary key,
  "teacherId" text not null references public."teacher"("id"),
  "type" text not null,
  "amount" numeric(12,2) not null,
  "details" text,
  "phoneNumber" text not null,
  "status" text default 'pending',
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table public."report_card" (
  "id" text primary key,
  "studentId" text not null,
  "studentName" text not null,
  "className" text not null,
  "marks" jsonb not null,
  "teacherRemarks" text,
  "status" text default 'PENDING',
  "adminFeedback" text,
  "term" text,
  "session" text,
  "endorsedAt" timestamp,
  "createdAt" timestamp default now()
);

create table public."system_settings" (
  "id" text primary key,
  "key" text not null unique,
  "value" text,
  "type" text,
  "description" text,
  "updated_at" timestamp default now()
);

-- SUPABASE REALTIME PUBLICATION SETUP -----------------------------------------
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

alter publication supabase_realtime add table
  public."school",
  public."user",
  public."student",
  public."teacher",
  public."parent",
  public."assessment",
  public."conversation",
  public."message",
  public."notification",
  public."adult_education_enrollments";

-- SEED SUBJECTS ------------------------------------------------------------------
insert into public."subject" ("id", "name", "code", "education_levels", "departments") values
  (gen_random_uuid()::text, 'Mathematics', 'MATH', array['PRIMARY','JUNIOR','SENIOR'], array['GENERAL']),
  (gen_random_uuid()::text, 'English Studies', 'ENG', array['PRIMARY','JUNIOR'], array['GENERAL']),
  (gen_random_uuid()::text, 'Use of English', 'USE-ENG', array['SENIOR'], array['GENERAL','SCIENCE','ARTS','COMMERCIAL']),
  (gen_random_uuid()::text, 'History', 'HIST', array['PRIMARY','JUNIOR'], array['GENERAL']),
  (gen_random_uuid()::text, 'Security and Citizenship Education', 'SCE', array['PRIMARY','JUNIOR'], array['GENERAL']),
  (gen_random_uuid()::text, 'French', 'FRENCH', array['PRIMARY','JUNIOR'], array['GENERAL']),
  (gen_random_uuid()::text, 'Intermediate Science', 'INT-SCI', array['PRIMARY','JUNIOR'], array['GENERAL']),
  (gen_random_uuid()::text, 'Verbal Reasoning', 'VERBAL', array['PRIMARY','JUNIOR'], array['GENERAL']),
  (gen_random_uuid()::text, 'Quantitative Reasoning', 'QUANT', array['PRIMARY','JUNIOR'], array['GENERAL']),
  (gen_random_uuid()::text, 'Digital Technology', 'DIGI', array['PRIMARY','JUNIOR','SENIOR'], array['GENERAL','SCIENCE','ARTS','COMMERCIAL']),
  (gen_random_uuid()::text, 'Cultural and Creative Arts', 'CCA', array['PRIMARY','JUNIOR'], array['GENERAL']),
  (gen_random_uuid()::text, 'Yoruba', 'YORUBA', array['PRIMARY','JUNIOR','SENIOR'], array['GENERAL','ARTS']),
  (gen_random_uuid()::text, 'Prevocational Studies', 'PVS', array['PRIMARY','JUNIOR'], array['GENERAL']),
  (gen_random_uuid()::text, 'Business Studies', 'BUS', array['JUNIOR'], array['GENERAL']),
  (gen_random_uuid()::text, 'Biology', 'BIO', array['SENIOR'], array['GENERAL','SCIENCE']),
  (gen_random_uuid()::text, 'Citizenship and Heritage Studies', 'CHS', array['SENIOR'], array['GENERAL','SCIENCE','ARTS','COMMERCIAL']),
  (gen_random_uuid()::text, 'Physics', 'PHY', array['SENIOR'], array['SCIENCE']),
  (gen_random_uuid()::text, 'Chemistry', 'CHEM', array['SENIOR'], array['SCIENCE']),
  (gen_random_uuid()::text, 'Agricultural Science', 'AGRIC', array['SENIOR'], array['SCIENCE']),
  (gen_random_uuid()::text, 'Further Mathematics', 'FMATH', array['SENIOR'], array['SCIENCE','COMMERCIAL']),
  (gen_random_uuid()::text, 'Geography', 'GEO', array['SENIOR'], array['SCIENCE']),
  (gen_random_uuid()::text, 'Government', 'GOV', array['SENIOR'], array['ARTS','COMMERCIAL']),
  (gen_random_uuid()::text, 'Literature in English', 'LIT', array['SENIOR'], array['ARTS']),
  (gen_random_uuid()::text, 'Christian Religious Studies', 'CRS', array['SENIOR'], array['ARTS']),
  (gen_random_uuid()::text, 'Commerce', 'COMM', array['SENIOR'], array['COMMERCIAL']),
  (gen_random_uuid()::text, 'Financial Accounting', 'ACC', array['SENIOR'], array['COMMERCIAL']),
  (gen_random_uuid()::text, 'Physical and Health Education', 'PHE', array['PRIMARY','JUNIOR'], array['GENERAL']),
  (gen_random_uuid()::text, 'Livestock Farming', 'LIVESTOCK', array['JUNIOR','SENIOR'], array['SCIENCE']),
  (gen_random_uuid()::text, 'Horticulture', 'HORT', array['JUNIOR','SENIOR'], array['SCIENCE'])
on conflict (code) do nothing;

-- =====================================================================
-- EL GOODNEWS INT'L ACADEMY - SEED DATA FOR MULTI-TENANT & AUTOMATED LOGIN ACCOUNTS
-- =====================================================================

-- 0. SEED DEFAULT MULTI-TENANT SCHOOL
INSERT INTO public.school (
  id,
  name,
  code,
  location,
  registeredclasses,
  allowparents,
  adminname,
  adminphone,
  adminemail,
  paymentstatus,
  createdat,
  updatedat
) VALUES (
  'school-elgoodnews-001',
  'EL GOODNEWS INT''L ACADEMY',
  'EXCE-10015',
  'Lagos, Nigeria',
  '["Primary 3", "Primary 4", "Primary 5", "Primary 6", "JSS1", "JSS2", "JSS3", "SSS1", "SSS2", "SSS3"]'::jsonb,
  true,
  'MRS HAPPINESS IFEANYI',
  '+234-8108854279',
  'admin@school.com',
  'PAID',
  NOW(),
  NOW()
) ON CONFLICT (code) DO NOTHING;

-- 1. CLEANSE PRE-EXISTING SEED RECORDS TO PREVENT CONSTRAINT CONFLICTS
DELETE FROM public.student WHERE admissionnumber IN ('EGIA-S-00998', 'EGIA-S-00997', 'ELGO-S-00998', 'ELGO-S-00997');
DELETE FROM public.user_role WHERE userid IN ('user-samuel-00998', 'user-jeremiah-00997', 'user-superadmin-001');
DELETE FROM public."user" WHERE email IN ('samuel012@gmail.com', 'sophieadesuwa6@gmail.com', 'ixoralyon013@gmail.com');

-- 2. SUPER ADMIN SETUP (ixoralyon013@gmail.com)
INSERT INTO public."user" (id, email, name, schoolid, createdat, updatedat)
VALUES (
  'user-superadmin-001',
  'ixoralyon013@gmail.com',
  'Super Admin',
  'school-elgoodnews-001',
  NOW(),
  NOW()
);

INSERT INTO public.user_role (id, userid, role)
VALUES (
  'role-superadmin-001',
  'user-superadmin-001',
  'SUPER_ADMIN'
);

-- 3. EZEAKO SAMUEL CHIBUEZE SETUP (STUDENT: ELGO-S-00998)
INSERT INTO public."user" (id, email, name, schoolid, createdat, updatedat)
VALUES (
  'user-samuel-00998',
  'samuel012@gmail.com',
  'Ezeako Samuel Chibueze',
  'school-elgoodnews-001',
  NOW(),
  NOW()
);

INSERT INTO public.user_role (id, userid, role)
VALUES (
  'role-samuel-00998',
  'user-samuel-00998',
  'STUDENT'
);

INSERT INTO public.student (
  id,
  userid,
  schoolid,
  firstname,
  lastname,
  dateofbirth,
  class,
  department,
  admissionnumber,
  password,
  registrationstatus,
  subjectsdone,
  createdat,
  updatedat
) VALUES (
  'student-samuel-00998',
  'user-samuel-00998',
  'school-elgoodnews-001',
  'Samuel',
  'Ezeako',
  '2011-04-20',
  'SSS2',
  'COMMERCIAL',
  'ELGO-S-00998',
  'default',
  'ACTIVE',
  '[
    "Mathematics",
    "English Language",
    "Biology",
    "Civic Education",
    "Data Processing",
    "Commerce",
    "Financial Accounting",
    "Economics",
    "Government",
    "Literature in English",
    "Yoruba",
    "Christian Religious Studies",
    "Geography",
    "Business Studies",
    "Insurance",
    "Office Practice",
    "Book Keeping"
  ]'::jsonb,
  NOW(),
  NOW()
);

-- 4. JEREMIAH IDAGHOSA CLEMENT SETUP (STUDENT: ELGO-S-00997)
INSERT INTO public."user" (id, email, name, schoolid, createdat, updatedat)
VALUES (
  'user-jeremiah-00997',
  'sophieadesuwa6@gmail.com',
  'Jeremiah Idaghosa Clement',
  'school-elgoodnews-001',
  NOW(),
  NOW()
);

INSERT INTO public.user_role (id, userid, role)
VALUES (
  'role-jeremiah-00997',
  'user-jeremiah-00997',
  'STUDENT'
);

INSERT INTO public.student (
  id,
  userid,
  schoolid,
  firstname,
  lastname,
  dateofbirth,
  class,
  department,
  admissionnumber,
  password,
  registrationstatus,
  subjectsdone,
  createdat,
  updatedat
) VALUES (
  'student-jeremiah-00997',
  'user-jeremiah-00997',
  'school-elgoodnews-001',
  'Jeremiah',
  'Clement',
  '2015-09-10',
  'JSS1',
  'GENERAL',
  'ELGO-S-00997',
  'default',
  'ACTIVE',
  '[
    "Mathematics",
    "English Studies",
    "Basic Science",
    "Basic Technology",
    "Social Studies",
    "Civic Education",
    "Christian Religious Studies",
    "Business Studies",
    "Computer Studies",
    "French",
    "Yoruba",
    "Cultural and Creative Arts",
    "Physical and Health Education"
  ]'::jsonb,
  NOW(),
  NOW()
);
