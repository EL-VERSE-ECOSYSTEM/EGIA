-- EL GOODNEWS ACADEMY: Canonical Complete Supabase SQL Schema
-- Full setup including multi-tenant school tenancy, RBAC, ABAC policies, CBT exam codes, support & disputes, adult education, realtime publications, and triggers.

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
drop table if exists public.lesson_notes cascade;
drop table if exists public.book_tag_relations cascade;
drop table if exists public.book_tags cascade;
drop table if exists public.book_categories cascade;
drop table if exists public.books cascade;
drop table if exists public.library_books cascade;
drop table if exists public.attendance_records cascade;
drop table if exists public.attendance cascade;
drop table if exists public.support_ticket_replies cascade;
drop table if exists public.support_ticket cascade;
drop table if exists public.support_tickets cascade;
drop table if exists public.dispute_message cascade;
drop table if exists public.dispute_messages cascade;
drop table if exists public.dispute cascade;
drop table if exists public.disputes cascade;
drop table if exists public.announcements cascade;
drop table if exists public.notification cascade;
drop table if exists public.notifications cascade;
drop table if exists public.user_fcm_tokens cascade;
drop table if exists public.notification_history cascade;
drop table if exists public.message cascade;
drop table if exists public.messages cascade;
drop table if exists public.conversation_participant cascade;
drop table if exists public.conversation_participants cascade;
drop table if exists public.conversation cascade;
drop table if exists public.conversations cascade;
drop table if exists public.study_video_reply cascade;
drop table if exists public.study_video_question cascade;
drop table if exists public.study_video cascade;
drop table if exists public.transactions cascade;
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
  "logo_url" text,
  "logo_path" text,
  "logo_uploaded_at" timestamptz,
  "createdat" timestamptz not null default now(),
  "updatedat" timestamptz not null default now()
);

create table if not exists public.school_registration_application (
  id text primary key default gen_random_uuid()::text,
  school_id text references public.school(id) on delete set null,
  applicant_email text not null,
  applicant_phone text not null,
  applicant_name text not null,
  school_name text not null,
  school_address text not null,
  proof_of_address_type text not null default 'ELECTRICITY_BILL',
  proof_of_address_file_url text,
  document_verification_status text not null default 'PENDING',
  payment_status text not null default 'PENDING',
  approval_status text not null default 'PENDING_REVIEW',
  submitted_at timestamptz not null default now(),
  reviewed_by text,
  reviewed_at timestamptz,
  rejection_reason text,
  admin_level text default 'PRIMARY_ADMIN',
  registered_classes jsonb,
  allow_parents boolean default true,
  payment_reference text unique,
  logo_url text,
  logo_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- CORE ACCOUNTS AND PROFILES -------------------------------------------------
create table public."user" (
  "id" text primary key,
  "email" text not null unique,
  "name" text,
  "image" text,
  "schoolid" text references public."school"("id") on delete cascade,
  "password" text,
  "last_identity_id" text,
  "last_identity_at" timestamptz,
  "gender" text,
  "adminlevel" text,
  "createdat" timestamptz not null default now(),
  "updatedat" timestamptz not null default now()
);

create table public."user_role" (
  "id" text primary key,
  "userid" text not null unique references public."user"("id") on delete cascade,
  "role" text not null, -- STUDENT, PUPIL, TEACHER, PARENT, SCHOOL_ADMIN, SUPER_ADMIN
  "createdat" timestamptz not null default now()
);

create table public."parent" (
  "id" text primary key,
  "userid" text not null unique references public."user"("id") on delete cascade,
  "schoolid" text references public."school"("id") on delete set null,
  "firstname" text not null,
  "lastname" text not null,
  "gender" text,
  "phonenumber" text,
  "address" text,
  "profileimage" text,
  "facialverificationvideo" text,
  "occupation" text,
  "password" text default 'default',
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
  "phonenumber" text,
  "gender" text,
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
  "password" text default 'default',
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
  "registration_paid" boolean default false,
  "registration_reference" text,
  "enrollment_type" text check (enrollment_type in ('ADMIN', 'SELF')),
  "registrationstatus" text not null default 'WAIVED',
  "password" text default 'default',
  "createdat" timestamptz not null default now(),
  "updatedat" timestamptz not null default now()
);

create table if not exists public.admission_number_sequences (
  id text primary key default gen_random_uuid()::text,
  schoolid text not null references public.school(id) on delete cascade,
  last_number integer not null default 0,
  created_at timestamptz not null default now(),
  unique (schoolid)
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

-- ASSESSMENTS & CBT EXAM CODES ---------------------------------------------------------
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
  "accesscode" text, -- Exam Code / Access Code required to launch test
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
  "imageUrl" text,
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

create table public."cbt_sessions" (
  "id" text primary key,
  "assessment_id" text not null references public."assessment"("id") on delete cascade,
  "student_id" text not null references public."student"("id") on delete cascade,
  "access_code" text not null,
  "status" text not null default 'ONGOING',
  "started_at" timestamptz not null default now(),
  "ended_at" timestamptz,
  "warning_count" integer default 0
);

create table public."cbt_attempts" (
  "id" text primary key,
  "session_id" text not null references public."cbt_sessions"("id") on delete cascade,
  "student_id" text not null references public."student"("id") on delete cascade,
  "answers" jsonb,
  "score" numeric(5,2),
  "completed_at" timestamptz
);

create table public."attendance" (
  "id" text primary key,
  "studentId" text not null references public."student"("id"),
  "classId" text not null references public."class"("id"),
  "date" date not null, "status" text not null, "remarks" text, "recordedBy" text, "recordedAt" timestamptz not null default now()
);

-- FEES & PAYMENTS -----------------------------------------------------------
create table public."fee_structure" (
  "id" text primary key, "schoolid" text references public.school(id) on delete cascade, "class" text not null, "department" text, "feeType" text not null,
  "amount" numeric(12,2) not null, "dueDate" date, "description" text, "isActive" boolean default true,
  "createdAt" timestamptz not null default now(), "updatedAt" timestamptz not null default now(),
  unique ("schoolid", "class", "department", "feeType")
);

create table public."payment" (
  "id" text primary key,
  "schoolid" text references public."school"("id") on delete set null,
  "studentid" text not null references public."student"("id"),
  "parentid" text, "termid" text, "amount" numeric(12,2) not null, "feetype" text, "paymentmethod" text not null,
  "transactionreference" text unique, "korapayreference" text unique, "receipturl" text,
  "reconciliation_status" text default 'UNRECONCILED' check (reconciliation_status in ('UNRECONCILED', 'RECONCILED', 'DISPUTED')),
  "reconciled_by" text references public."user"("id"),
  "reconciled_at" timestamptz,
  "status" text default 'pending',
  "paymentdate" timestamptz, "paidat" timestamptz, "description" text,
  "createdat" timestamptz not null default now(), "updatedat" timestamptz not null default now()
);


create table if not exists public.assessment_logs (
  id text primary key default gen_random_uuid()::text,
  schoolid text not null references public.school(id) on delete cascade,
  assessment_id text references public.assessment(id) on delete cascade,
  student_id text references public.student(id) on delete cascade,
  action text not null,
  metadata jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create table if not exists public.transaction_ledger (
  id text primary key default gen_random_uuid()::text,
  schoolid text not null references public.school(id) on delete cascade,
  user_id text references public.user(id),
  student_id text references public.student(id),
  type text not null,
  direction text not null check (direction in ('IN', 'OUT')),
  amount numeric(12,2) not null,
  currency text default 'NGN',
  reference text unique,
  gateway text,
  status text default 'PENDING',
  description text,
  metadata jsonb,
  confirmation_method text check (confirmation_method in ('KORAPAY_AUTO','MANUAL_UPLOAD','SCHOOL_ACCOUNT')),
  receipt_upload_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- SCHOOL PAYMENT CONFIGURATION & RECEIPT UPLOADS
create table if not exists public.school_payment_config (
  id text primary key default gen_random_uuid()::text,
  schoolid text not null unique references public.school(id) on delete cascade,
  use_korapay boolean not null default true,
  bank_name text,
  account_number text,
  account_name text,
  custom_payment_link text,
  instructions text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bank_required_if_not_korapay check (
    use_korapay = true
    or (use_korapay = false and account_number is not null and account_name is not null)
  )
);
create index if not exists idx_school_payment_config_school on public.school_payment_config(schoolid);

create table if not exists public.payment_receipt_uploads (
  id text primary key default gen_random_uuid()::text,
  schoolid text not null references public.school(id) on delete cascade,
  payment_id text references public.payment(id) on delete cascade,
  student_id text references public.student(id) on delete cascade,
  parent_id text references public.parent(id) on delete set null,
  uploaded_by text not null references public.user(id),
  uploaded_by_role text not null check (uploaded_by_role in ('PARENT','SCHOOL_ADMIN')),
  file_url text not null,
  file_path text not null,
  file_type text not null check (file_type in ('image/png','image/jpeg','application/pdf')),
  file_size_kb integer,
  amount_claimed numeric(12,2),
  payment_reference text,
  status text not null default 'PENDING' check (status in ('PENDING','APPROVED','REJECTED')),
  reviewed_by text references public.user(id),
  reviewed_at timestamptz,
  rejection_reason text,
  generated_receipt_url text,
  generated_receipt_path text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_receipt_uploads_school on public.payment_receipt_uploads(schoolid, status);
create index if not exists idx_receipt_uploads_student on public.payment_receipt_uploads(student_id);

alter table public.transaction_ledger
  add constraint fk_transaction_ledger_receipt_upload
  foreign key (receipt_upload_id) references public.payment_receipt_uploads(id) on delete set null;

create or replace view public.payment_receipt_chain as
select
  p.id as payment_id,
  p.schoolid,
  p.studentid,
  p.amount,
  p.status as payment_status,
  r.id as receipt_id,
  r.file_url as uploaded_file_url,
  r.status as receipt_status,
  r.generated_receipt_url as official_receipt_url,
  t.id as ledger_id,
  t.confirmation_method
from public.payment p
left join public.payment_receipt_uploads r on r.payment_id = p.id
left join public.transaction_ledger t on t.receipt_upload_id = r.id;

create table if not exists public.school_admin_roles (
  id text primary key default gen_random_uuid()::text,
  schoolid text not null references public.school(id) on delete cascade,
  userid text not null references public.user(id) on delete cascade,
  level text not null check (level in (
    'PRIMARY_ADMIN', 'VICE_PRINCIPAL_ACADEMICS', 'VICE_PRINCIPAL_ADMIN',
    'HOD_SCIENCE', 'HOD_ARTS', 'HOD_COMMERCIAL'
  )),
  department text,
  is_active boolean default true,
  created_at timestamptz not null default now(),
  unique (schoolid, userid)
);

create table public."payment_installment" (
  "id" text primary key,
  "paymentId" text not null references public."payment"("id"),
  "amount" numeric(12,2) not null, "dueDate" date not null, "paidAt" timestamptz, "status" text default 'pending', "installmentNumber" integer not null,
  "createdAt" timestamptz not null default now()
);

create table public."transactions" (
  "id" text primary key,
  "reference" text not null unique,
  "amount" numeric(12,2) not null,
  "currency" text not null default 'NGN',
  "status" text not null default 'pending',
  "customer_email" text not null,
  "customer_name" text,
  "description" text,
  "checkout_url" text,
  "metadata" jsonb,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

-- COMMUNICATION, NOTIFICATIONS & FCM -----------------------------------------
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

create table public."user_fcm_tokens" (
  "id" text primary key,
  "user_id" text not null references public."user"("id") on delete cascade,
  "token" text not null unique,
  "device_name" text,
  "device_type" text default 'web',
  "browser" text,
  "os" text,
  "is_active" boolean not null default true,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

create table public."notification_history" (
  "id" text primary key,
  "user_id" text references public."user"("id") on delete set null,
  "title" text not null,
  "body" text not null,
  "type" text not null,
  "data" jsonb,
  "sent_at" timestamptz not null default now(),
  "delivered" boolean not null default false,
  "read_at" timestamptz,
  "link" text,
  "metadata" jsonb
);

-- DISPUTE AND SUPPORT TICKETS ------------------------------------------------
create table public."dispute" (
  "id" text primary key,
  "ticketNumber" text not null unique,
  "title" text not null,
  "category" text not null,
  "priority" text not null,
  "status" text default 'OPEN',
  "description" text not null,
  "evidence" jsonb,
  "raisedById" text not null references public."user"("id") on delete cascade,
  "assignedToId" text,
  "relatedStudentId" text,
  "relatedPaymentId" text,
  "relatedAssessmentId" text,
  "resolution" text,
  "resolvedBy" text,
  "resolvedAt" timestamptz,
  "escalatedAt" timestamptz,
  "escalatedTo" text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table public."dispute_message" (
  "id" text primary key,
  "disputeId" text not null references public."dispute"("id") on delete cascade,
  "senderId" text not null references public."user"("id") on delete cascade,
  "message" text not null,
  "attachments" jsonb,
  "isInternal" boolean default false,
  "createdAt" timestamp default now()
);

create table public."support_ticket" (
  "id" text primary key,
  "ticketNumber" text not null unique,
  "title" text not null,
  "category" text not null,
  "priority" text not null,
  "status" text default 'OPEN',
  "description" text not null,
  "screenshots" jsonb,
  "userId" text not null references public."user"("id") on delete cascade,
  "assignedAgentId" text,
  "resolution" text,
  "satisfaction" text,
  "resolvedAt" timestamptz,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table public."support_ticket_replies" (
  "id" text primary key,
  "ticket_id" text not null references public."support_ticket"("id") on delete cascade,
  "sender_id" text not null references public."user"("id") on delete cascade,
  "message" text not null,
  "attachments" jsonb,
  "created_at" timestamptz not null default now()
);

-- DISCIPLINARY RECORDS -------------------------------------------------------
create table if not exists public."disciplinary_records" (
  "id" uuid primary key default gen_random_uuid(),
  "student_id" text not null,
  "reported_by_id" text not null,
  "incident_date" date not null default current_date,
  "incident_type" text not null,
  "description" text not null,
  "sanction" text,
  "status" text not null default 'PENDING',
  "notes" text,
  "resolved_at" timestamptz,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

-- STUDENT GIFTS --------------------------------------------------------------
create table if not exists public."student_gifts" (
  "id" text primary key default gen_random_uuid()::text,
  "schoolid" text references public."school"("id") on delete set null,
  "student_id" text not null references public."student"("id") on delete cascade,
  "title" text not null,
  "reason" text,
  "amount" numeric(12,2) not null default 0.00,
  "status" text not null default 'AVAILABLE',
  "received_at" timestamptz not null default now(),
  "expires_at" timestamptz not null,
  "created_at" timestamptz not null default now()
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
  "daily_rate" numeric(12,2) default 0,
  "hourly_rate" numeric(12,2) default 0,
  "late_penalty_per_minute" numeric(12,2) default 0,
  "early_exit_penalty_per_minute" numeric(12,2) default 0,
  "absence_penalty_per_day" numeric(12,2) default 0,
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

-- ABAC POLICIES & AUDIT LOGS -------------------------------------------------
create table public."abac_policy" (
  "id" text primary key,
  "name" text not null unique,
  "description" text,
  "role" text not null, -- STUDENT, PUPIL, TEACHER, PARENT, SCHOOL_ADMIN, SUPER_ADMIN
  "resource" text not null,
  "action" text not null,
  "conditions" jsonb not null,
  "priority" integer default 0,
  "effect" text not null default 'ALLOW',
  "createdAt" timestamp default now()
);

create table public."audit_log" (
  "id" text primary key,
  "userId" text not null references public."user"("id") on delete cascade,
  "action" text not null,
  "resource" text not null,
  "resourceId" text,
  "details" jsonb,
  "ipAddress" text,
  "userAgent" text,
  "createdAt" timestamptz not null default now()
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
  public."user_role",
  public."school_registration_application",
  public."student",
  public."teacher",
  public."parent",
  public."assessment",
  public."assessment_result",
  public."payment",
  public."report_card",
  public."conversation",
  public."message",
  public."notification",
  public."adult_education_enrollments",
  public."dispute",
  public."support_ticket";

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

-- SEED DEFAULT ABAC POLICIES ----------------------------------------------------
insert into public."abac_policy" ("id", "name", "description", "role", "resource", "action", "conditions", "priority", "effect") values
  (gen_random_uuid()::text, 'super_admin_full_access', 'Super Admin full access to all resources', 'SUPER_ADMIN', '*', '*', '{}'::jsonb, 100, 'ALLOW'),
  (gen_random_uuid()::text, 'school_admin_school_access', 'School Admin access within school tenant', 'SCHOOL_ADMIN', '*', '*', '{"user.schoolId":"resource.schoolId"}'::jsonb, 90, 'ALLOW'),
  (gen_random_uuid()::text, 'teacher_assessment_manage', 'Teachers manage CBT assessments', 'TEACHER', 'assessment', '*', '{}'::jsonb, 80, 'ALLOW'),
  (gen_random_uuid()::text, 'teacher_results_grade', 'Teachers grade assessment results', 'TEACHER', 'result', 'grade', '{}'::jsonb, 80, 'ALLOW'),
  (gen_random_uuid()::text, 'student_results_view', 'Students view their own assessment results', 'STUDENT', 'result', 'read', '{"user.id":"resource.userId"}'::jsonb, 70, 'ALLOW'),
  (gen_random_uuid()::text, 'pupil_results_view', 'Pupils view their own assessment results', 'PUPIL', 'result', 'read', '{"user.id":"resource.userId"}'::jsonb, 70, 'ALLOW'),
  (gen_random_uuid()::text, 'parent_children_results_view', 'Parents view their children results and payments', 'PARENT', 'result', 'read', '{}'::jsonb, 70, 'ALLOW')
on conflict (name) do nothing;

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

-- =====================================================================
-- TEACHER ATTENDANCE, LEAVE MANAGEMENT, SALARY DEDUCTION & ADMIN CONFIG TABLES
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.teacher_attendance (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  schoolid text NOT NULL REFERENCES public.school(id) ON DELETE CASCADE,
  teacherid text NOT NULL REFERENCES public.teacher(id) ON DELETE CASCADE,
  work_date date NOT NULL,
  clock_in_at timestamptz,
  clock_out_at timestamptz,
  clock_in_ip inet,
  clock_out_ip inet,
  clock_in_device text,
  clock_out_device text,
  clock_in_lat numeric(10,7),
  clock_in_lng numeric(10,7),
  clock_out_lat numeric(10,7),
  clock_out_lng numeric(10,7),
  total_minutes integer,
  status text NOT NULL DEFAULT 'PRESENT'
    CHECK (status IN ('PRESENT','LATE','ABSENT','HALF_DAY','ON_LEAVE','SUSPENDED')),
  late_minutes integer DEFAULT 0,
  early_exit_minutes integer DEFAULT 0,
  overtime_minutes integer DEFAULT 0,
  is_manual_override boolean DEFAULT false,
  override_by text REFERENCES public.user(id),
  override_reason text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (teacherid, work_date)
);

CREATE INDEX IF NOT EXISTS idx_teacher_attendance_school_date
  ON public.teacher_attendance(schoolid, work_date DESC);
CREATE INDEX IF NOT EXISTS idx_teacher_attendance_teacher
  ON public.teacher_attendance(teacherid, work_date DESC);
CREATE INDEX IF NOT EXISTS idx_teacher_attendance_status
  ON public.teacher_attendance(schoolid, status);

CREATE TABLE IF NOT EXISTS public.leave_types (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  schoolid text REFERENCES public.school(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text NOT NULL,
  default_days_per_year integer NOT NULL DEFAULT 12,
  is_paid boolean NOT NULL DEFAULT true,
  requires_attachment boolean DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (schoolid, code)
);

CREATE INDEX IF NOT EXISTS idx_leave_types_school ON public.leave_types(schoolid);

CREATE TABLE IF NOT EXISTS public.teacher_leave_requests (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  schoolid text NOT NULL REFERENCES public.school(id) ON DELETE CASCADE,
  teacherid text NOT NULL REFERENCES public.teacher(id) ON DELETE CASCADE,
  leave_type_id text NOT NULL REFERENCES public.leave_types(id),
  start_date date NOT NULL,
  end_date date NOT NULL,
  total_days integer NOT NULL,
  reason text NOT NULL,
  attachment_url text,
  attachment_path text,
  status text NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING','APPROVED','REJECTED','CANCELLED')),
  reviewed_by text REFERENCES public.user(id),
  reviewed_at timestamptz,
  admin_comment text,
  rejection_reason text,
  is_paid boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT leave_dates_valid CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_leave_requests_school
  ON public.teacher_leave_requests(schoolid, status, start_date DESC);
CREATE INDEX IF NOT EXISTS idx_leave_requests_teacher
  ON public.teacher_leave_requests(teacherid, status);

CREATE TABLE IF NOT EXISTS public.teacher_leave_balance (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  schoolid text NOT NULL REFERENCES public.school(id) ON DELETE CASCADE,
  teacherid text NOT NULL REFERENCES public.teacher(id) ON DELETE CASCADE,
  leave_type_id text NOT NULL REFERENCES public.leave_types(id),
  academic_year text NOT NULL,
  allocated_days integer NOT NULL DEFAULT 0,
  used_days integer NOT NULL DEFAULT 0,
  pending_days integer NOT NULL DEFAULT 0,
  remaining_days integer GENERATED ALWAYS AS
    (allocated_days - used_days - pending_days) STORED,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (teacherid, leave_type_id, academic_year)
);

CREATE INDEX IF NOT EXISTS idx_leave_balance_teacher
  ON public.teacher_leave_balance(teacherid, academic_year);

CREATE TABLE IF NOT EXISTS public.teacher_salary_deductions (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  schoolid text NOT NULL REFERENCES public.school(id) ON DELETE CASCADE,
  teacherid text NOT NULL REFERENCES public.teacher(id) ON DELETE CASCADE,
  month text NOT NULL,
  deduction_type text NOT NULL
    CHECK (deduction_type IN ('ABSENCE','LATE','EARLY_EXIT','UNPAID_LEAVE','OTHER')),
  reference_attendance_id text REFERENCES public.teacher_attendance(id),
  reference_leave_id text REFERENCES public.teacher_leave_requests(id),
  amount numeric(12,2) NOT NULL,
  reason text,
  applied_by text REFERENCES public.user(id),
  applied_at timestamptz NOT NULL DEFAULT now(),
  reversed boolean DEFAULT false,
  reversed_by text REFERENCES public.user(id),
  reversed_at timestamptz,
  reversal_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_salary_deductions_school_month
  ON public.teacher_salary_deductions(schoolid, month DESC);
CREATE INDEX IF NOT EXISTS idx_salary_deductions_teacher
  ON public.teacher_salary_deductions(teacherid, month DESC);

CREATE TABLE IF NOT EXISTS public.school_attendance_config (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  schoolid text NOT NULL UNIQUE REFERENCES public.school(id) ON DELETE CASCADE,
  work_start_time time NOT NULL DEFAULT '08:00:00',
  work_end_time time NOT NULL DEFAULT '16:00:00',
  late_threshold_minutes integer NOT NULL DEFAULT 10,
  early_exit_threshold_minutes integer NOT NULL DEFAULT 10,
  half_day_minutes integer NOT NULL DEFAULT 180,
  auto_absent_if_no_clockin boolean DEFAULT true,
  require_selfie boolean DEFAULT false,
  require_location boolean DEFAULT false,
  auto_deduct_absence boolean DEFAULT false,
  auto_deduct_late boolean DEFAULT false,
  auto_deduct_early_exit boolean DEFAULT false,
  unpaid_leave_deduction boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- SEED DEFAULT LEAVE TYPES
INSERT INTO public.leave_types (id, schoolid, name, code, default_days_per_year, is_paid, requires_attachment)
VALUES
  (gen_random_uuid()::text, NULL, 'Sick Leave',        'SICK',    12, true,  true),
  (gen_random_uuid()::text, NULL, 'Annual Leave',      'ANNUAL',  20, true,  false),
  (gen_random_uuid()::text, NULL, 'Maternity Leave',   'MATERNITY', 90, true, true),
  (gen_random_uuid()::text, NULL, 'Paternity Leave',   'PATERNITY', 14, true, true),
  (gen_random_uuid()::text, NULL, 'Casual Leave',      'CASUAL',   5, true,  false),
  (gen_random_uuid()::text, NULL, 'Compassionate Leave','COMPASSIONATE', 7, true, true),
  (gen_random_uuid()::text, NULL, 'Study Leave',       'STUDY',    30, false, true),
  (gen_random_uuid()::text, NULL, 'Unpaid Leave',      'UNPAID',   30, false, false)
ON CONFLICT (schoolid, code) DO NOTHING;

-- RLS POLICIES FOR NEW TABLES
ALTER TABLE public.teacher_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_leave_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_salary_deductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_attendance_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS teacher_attendance_read ON public.teacher_attendance;
CREATE POLICY teacher_attendance_read ON public.teacher_attendance
FOR SELECT USING (
  (auth.jwt() ->> 'role') = 'SUPER_ADMIN'
  OR (schoolid = (auth.jwt() ->> 'school_id')
      AND (
        (auth.jwt() ->> 'role') = 'SCHOOL_ADMIN'
        OR teacherid IN (
          SELECT id FROM public.teacher WHERE userid = (auth.jwt() ->> 'sub')
        )
      ))
);

DROP POLICY IF EXISTS teacher_attendance_write ON public.teacher_attendance;
CREATE POLICY teacher_attendance_write ON public.teacher_attendance
FOR INSERT WITH CHECK (
  schoolid = (auth.jwt() ->> 'school_id')
  AND (
    (auth.jwt() ->> 'role') = 'SCHOOL_ADMIN'
    OR teacherid IN (
      SELECT id FROM public.teacher WHERE userid = (auth.jwt() ->> 'sub')
    )
  )
);

DROP POLICY IF EXISTS teacher_attendance_update ON public.teacher_attendance;
CREATE POLICY teacher_attendance_update ON public.teacher_attendance
FOR UPDATE USING (
  (auth.jwt() ->> 'role') = 'SUPER_ADMIN'
  OR (schoolid = (auth.jwt() ->> 'school_id')
      AND (auth.jwt() ->> 'admin_level') = 'PRIMARY_ADMIN')
);

DROP POLICY IF EXISTS leave_requests_read ON public.teacher_leave_requests;
CREATE POLICY leave_requests_read ON public.teacher_leave_requests
FOR SELECT USING (
  (auth.jwt() ->> 'role') = 'SUPER_ADMIN'
  OR (schoolid = (auth.jwt() ->> 'school_id')
      AND (
        (auth.jwt() ->> 'role') = 'SCHOOL_ADMIN'
        OR teacherid IN (
          SELECT id FROM public.teacher WHERE userid = (auth.jwt() ->> 'sub')
        )
      ))
);

DROP POLICY IF EXISTS leave_requests_teacher_insert ON public.teacher_leave_requests;
CREATE POLICY leave_requests_teacher_insert ON public.teacher_leave_requests
FOR INSERT WITH CHECK (
  schoolid = (auth.jwt() ->> 'school_id')
  AND teacherid IN (
    SELECT id FROM public.teacher WHERE userid = (auth.jwt() ->> 'sub')
  )
);

DROP POLICY IF EXISTS leave_requests_admin_review ON public.teacher_leave_requests;
CREATE POLICY leave_requests_admin_review ON public.teacher_leave_requests
FOR UPDATE USING (
  (auth.jwt() ->> 'role') = 'SUPER_ADMIN'
  OR (schoolid = (auth.jwt() ->> 'school_id')
      AND (auth.jwt() ->> 'admin_level') IN ('PRIMARY_ADMIN', 'SCHOOL_ADMIN'))
);

DROP POLICY IF EXISTS salary_deductions_read ON public.teacher_salary_deductions;
CREATE POLICY salary_deductions_read ON public.teacher_salary_deductions
FOR SELECT USING (
  (auth.jwt() ->> 'role') = 'SUPER_ADMIN'
  OR (schoolid = (auth.jwt() ->> 'school_id')
      AND (
        (auth.jwt() ->> 'role') = 'SCHOOL_ADMIN'
        OR teacherid IN (
          SELECT id FROM public.teacher WHERE userid = (auth.jwt() ->> 'sub')
        )
      ))
);

DROP POLICY IF EXISTS salary_deductions_write ON public.teacher_salary_deductions;
CREATE POLICY salary_deductions_write ON public.teacher_salary_deductions
FOR ALL USING (
  (auth.jwt() ->> 'role') = 'SUPER_ADMIN'
  OR (schoolid = (auth.jwt() ->> 'school_id')
      AND (auth.jwt() ->> 'admin_level') = 'PRIMARY_ADMIN')
);

DROP POLICY IF EXISTS leave_types_read ON public.leave_types;
CREATE POLICY leave_types_read ON public.leave_types
FOR SELECT USING (
  schoolid IS NULL
  OR (auth.jwt() ->> 'role') = 'SUPER_ADMIN'
  OR schoolid = (auth.jwt() ->> 'school_id')
);

DROP POLICY IF EXISTS leave_types_write ON public.leave_types;
CREATE POLICY leave_types_write ON public.leave_types
FOR ALL USING (
  (auth.jwt() ->> 'role') = 'SUPER_ADMIN'
  OR (schoolid = (auth.jwt() ->> 'school_id')
      AND (auth.jwt() ->> 'admin_level') = 'PRIMARY_ADMIN')
);

DROP POLICY IF EXISTS attendance_config_read ON public.school_attendance_config;
CREATE POLICY attendance_config_read ON public.school_attendance_config
FOR SELECT USING (
  (auth.jwt() ->> 'role') = 'SUPER_ADMIN'
  OR schoolid = (auth.jwt() ->> 'school_id')
);

DROP POLICY IF EXISTS attendance_config_write ON public.school_attendance_config;
CREATE POLICY attendance_config_write ON public.school_attendance_config
FOR ALL USING (
  (auth.jwt() ->> 'role') = 'SUPER_ADMIN'
  OR (schoolid = (auth.jwt() ->> 'school_id')
      AND (auth.jwt() ->> 'admin_level') = 'PRIMARY_ADMIN')
);

DROP POLICY IF EXISTS leave_balance_read ON public.teacher_leave_balance;
CREATE POLICY leave_balance_read ON public.teacher_leave_balance
FOR SELECT USING (
  (auth.jwt() ->> 'role') = 'SUPER_ADMIN'
  OR (schoolid = (auth.jwt() ->> 'school_id')
      AND (
        (auth.jwt() ->> 'role') = 'SCHOOL_ADMIN'
        OR teacherid IN (
          SELECT id FROM public.teacher WHERE userid = (auth.jwt() ->> 'sub')
        )
      ))
);

DROP POLICY IF EXISTS leave_balance_write ON public.teacher_leave_balance;
CREATE POLICY leave_balance_write ON public.teacher_leave_balance
FOR ALL USING (
  (auth.jwt() ->> 'role') = 'SUPER_ADMIN'
  OR (schoolid = (auth.jwt() ->> 'school_id')
      AND (auth.jwt() ->> 'admin_level') IN ('PRIMARY_ADMIN', 'SCHOOL_ADMIN'))
);

-- FUNCTIONS FOR LEAVE & AUTOMATION
CREATE OR REPLACE FUNCTION public.auto_mark_absent_teachers()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_today date := current_date;
  v_teacher record;
  v_school record;
BEGIN
  FOR v_school IN SELECT id FROM public.school LOOP
    FOR v_teacher IN
      SELECT id, schoolid FROM public.teacher
      WHERE schoolid = v_school.id
        AND isactive = true
        AND NOT EXISTS (
          SELECT 1 FROM public.teacher_attendance
          WHERE teacherid = teacher.id AND work_date = v_today
        )
    LOOP
      INSERT INTO public.teacher_attendance (
        schoolid, teacherid, work_date, status
      ) VALUES (
        v_teacher.schoolid, v_teacher.id, v_today, 'ABSENT'
      );
    END LOOP;
  END LOOP;
END; $$;

CREATE OR REPLACE FUNCTION public.increment_pending_leave(
  p_teacher_id text, p_leave_type_id text, p_days integer
) RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  v_school_id text;
  v_year text;
  v_default_days integer := 12;
BEGIN
  SELECT schoolid INTO v_school_id FROM public.teacher WHERE id = p_teacher_id;
  v_year := to_char(now(), 'YYYY') || '/' || to_char(now() + interval '1 year', 'YYYY');

  SELECT default_days_per_year INTO v_default_days FROM public.leave_types WHERE id = p_leave_type_id;
  IF v_default_days IS NULL THEN v_default_days := 12; END IF;

  INSERT INTO public.teacher_leave_balance (
    schoolid, teacherid, leave_type_id, academic_year, allocated_days, used_days, pending_days
  ) VALUES (
    v_school_id, p_teacher_id, p_leave_type_id, v_year, v_default_days, 0, p_days
  )
  ON CONFLICT (teacherid, leave_type_id, academic_year)
  DO UPDATE SET
    pending_days = public.teacher_leave_balance.pending_days + p_days,
    updated_at = now();
END; $$;

CREATE OR REPLACE FUNCTION public.finalize_approved_leave(
  p_teacher_id text, p_leave_type_id text, p_days integer
) RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  v_year text;
BEGIN
  v_year := to_char(now(), 'YYYY') || '/' || to_char(now() + interval '1 year', 'YYYY');
  UPDATE public.teacher_leave_balance
  SET pending_days = GREATEST(pending_days - p_days, 0),
      used_days = used_days + p_days,
      updated_at = now()
  WHERE teacherid = p_teacher_id
    AND leave_type_id = p_leave_type_id
    AND academic_year = v_year;
END; $$;

CREATE OR REPLACE FUNCTION public.release_pending_leave(
  p_teacher_id text, p_leave_type_id text, p_days integer
) RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  v_year text;
BEGIN
  v_year := to_char(now(), 'YYYY') || '/' || to_char(now() + interval '1 year', 'YYYY');
  UPDATE public.teacher_leave_balance
  SET pending_days = GREATEST(pending_days - p_days, 0),
      updated_at = now()
  WHERE teacherid = p_teacher_id
    AND leave_type_id = p_leave_type_id
    AND academic_year = v_year;
END; $$;

CREATE OR REPLACE FUNCTION public.compute_monthly_deductions(
  p_school_id text,
  p_month text
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_teacher record;
  v_absent_count integer;
  v_late_count integer;
  v_early_count integer;
  v_unpaid_leave_days integer;
  v_wallet record;
  v_deduction numeric(12,2);
BEGIN
  FOR v_teacher IN
    SELECT id FROM public.teacher WHERE schoolid = p_school_id AND isactive = true
  LOOP
    SELECT * INTO v_wallet FROM public.teacher_wallet WHERE "teacherId" = v_teacher.id;
    IF v_wallet IS NULL THEN CONTINUE; END IF;

    SELECT count(*) INTO v_absent_count FROM public.teacher_attendance
    WHERE teacherid = v_teacher.id
      AND to_char(work_date, 'YYYY-MM') = p_month
      AND status = 'ABSENT';

    SELECT count(*) INTO v_late_count FROM public.teacher_attendance
    WHERE teacherid = v_teacher.id
      AND to_char(work_date, 'YYYY-MM') = p_month
      AND status = 'LATE';

    SELECT count(*) INTO v_early_count FROM public.teacher_attendance
    WHERE teacherid = v_teacher.id
      AND to_char(work_date, 'YYYY-MM') = p_month
      AND early_exit_minutes > 0;

    SELECT coalesce(sum(total_days), 0) INTO v_unpaid_leave_days
    FROM public.teacher_leave_requests
    WHERE teacherid = v_teacher.id
      AND status = 'APPROVED'
      AND is_paid = false
      AND to_char(start_date, 'YYYY-MM') = p_month;

    IF v_absent_count > 0 AND COALESCE(v_wallet.absence_penalty_per_day, 0) > 0 THEN
      v_deduction := v_absent_count * v_wallet.absence_penalty_per_day;
      INSERT INTO public.teacher_salary_deductions (
        schoolid, teacherid, month, deduction_type, amount, reason
      ) VALUES (
        p_school_id, v_teacher.id, p_month, 'ABSENCE', v_deduction,
        v_absent_count || ' day(s) absent'
      );
    END IF;

    IF v_late_count > 0 AND COALESCE(v_wallet.late_penalty_per_minute, 0) > 0 THEN
      v_deduction := v_late_count * v_wallet.late_penalty_per_minute * 10;
      INSERT INTO public.teacher_salary_deductions (
        schoolid, teacherid, month, deduction_type, amount, reason
      ) VALUES (
        p_school_id, v_teacher.id, p_month, 'LATE', v_deduction,
        v_late_count || ' late arrival(s)'
      );
    END IF;

    IF v_unpaid_leave_days > 0 AND COALESCE(v_wallet.daily_rate, 0) > 0 THEN
      v_deduction := v_unpaid_leave_days * v_wallet.daily_rate;
      INSERT INTO public.teacher_salary_deductions (
        schoolid, teacherid, month, deduction_type, amount, reason
      ) VALUES (
        p_school_id, v_teacher.id, p_month, 'UNPAID_LEAVE', v_deduction,
        v_unpaid_leave_days || ' unpaid leave day(s)'
      );
    END IF;

  END LOOP;
END; $$;

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
  claims jsonb;
  v_school_id text;
  v_role text;
  v_admin_level text;
  v_department text;
BEGIN
  SELECT schoolid INTO v_school_id
    FROM public.user WHERE id = (event->>'user_id');

  SELECT role INTO v_role
    FROM public.user_role WHERE userid = (event->>'user_id');

  SELECT level, department INTO v_admin_level, v_department
    FROM public.school_admin_roles
    WHERE userid = (event->>'user_id') AND is_active = true
    LIMIT 1;

  claims := event->'claims';
  claims := jsonb_set(claims, '{school_id}',   to_jsonb(v_school_id));
  claims := jsonb_set(claims, '{role}',        to_jsonb(v_role));
  claims := jsonb_set(claims, '{admin_level}', to_jsonb(COALESCE(v_admin_level, 'NONE')));
  claims := jsonb_set(claims, '{department}',  to_jsonb(COALESCE(v_department, 'NONE')));

  RETURN jsonb_set(event, '{claims}', claims);
END; $$;

-- ADD ALL NEW TABLES TO SUPABASE REALTIME PUBLICATION
ALTER PUBLICATION supabase_realtime ADD TABLE public.teacher_attendance;
ALTER PUBLICATION supabase_realtime ADD TABLE public.teacher_leave_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.teacher_leave_balance;
ALTER PUBLICATION supabase_realtime ADD TABLE public.teacher_salary_deductions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.school_attendance_config;
ALTER PUBLICATION supabase_realtime ADD TABLE public.leave_types;
ALTER PUBLICATION supabase_realtime ADD TABLE public.school_admin_roles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.disciplinary_records;
ALTER PUBLICATION supabase_realtime ADD TABLE public.academic_session;
ALTER PUBLICATION supabase_realtime ADD TABLE public.term;
ALTER PUBLICATION supabase_realtime ADD TABLE public.teacher_wallet;
ALTER PUBLICATION supabase_realtime ADD TABLE public.teacher_request;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cbt_attempts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_gifts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.fee_structure;
ALTER PUBLICATION supabase_realtime ADD TABLE public.school_payment_config;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_receipt_uploads;

-- Additional developer tables
create table if not exists public.invitations (
  id text primary key,
  school_id text not null references public.school(id) on delete cascade,
  email text,
  phone text,
  role text not null,
  token text not null unique,
  status text not null default 'PENDING',
  expires_at timestamp with time zone not null,
  invited_by text,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.assessment_schedule (
  id text primary key,
  assessment_id text not null references public.assessment(id) on delete cascade,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  class_id text,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.timetables (
  id text primary key default gen_random_uuid()::text,
  school_id text references public.school(id) on delete cascade,
  class_id text,
  class_name text not null,
  day_of_week text not null,
  period_number integer not null default 1,
  start_time text not null,
  end_time text not null,
  subject_name text not null,
  teacher_name text,
  room text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_timetables_class on public.timetables(class_name, day_of_week);

create table if not exists public.library_books (
  id text primary key,
  isbn text unique,
  title text not null,
  subtitle text,
  authors jsonb,
  author text,
  publisher text,
  publication_year integer,
  edition text,
  volume text,
  language text default 'English',
  pages integer,
  category text,
  sub_category text,
  description text,
  total_copies integer default 1,
  available_copies integer default 1,
  cover_image_url text,
  file_url text,
  location text,
  content text,
  subject text,
  class_level text,
  keywords jsonb,
  is_digital boolean default false,
  rating numeric,
  rating_count integer default 0,
  borrowed_count integer default 0,
  deleted_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

create table if not exists public.tournament_scores (
  id text primary key,
  school_id text not null references public.school(id) on delete cascade,
  student_id text not null references public.user(id) on delete cascade,
  game_type text not null,
  points integer not null default 0,
  is_win boolean not null default false,
  created_at timestamp with time zone default now()
);

create index if not exists idx_tournament_scores_school_id on public.tournament_scores(school_id);
create index if not exists idx_tournament_scores_student_id on public.tournament_scores(student_id);

create table if not exists public.otp_records (
  id text primary key,
  email text not null unique,
  hash text not null,
  attempts integer not null default 0,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone default now()
);

create index if not exists idx_otp_records_email on public.otp_records(email);

create table if not exists public.book_borrowings (
  id text primary key,
  book_id text not null references public.library_books(id) on delete cascade,
  user_id text,
  student_id text,
  borrow_date timestamp with time zone not null default now(),
  due_date timestamp with time zone not null,
  return_date timestamp with time zone,
  fine_amount numeric(12,2) default 0.00,
  status text not null default 'BORROWED',
  created_at timestamp with time zone not null default now()
);

create table if not exists public.student_badges (
  id text primary key,
  student_id text not null references public.student(id) on delete cascade,
  badge_name text not null,
  badge_type text not null,
  reason text,
  awarded_at timestamp with time zone not null default now()
);

create table if not exists public.payment_webhook_logs (
  id text primary key,
  reference text not null,
  event_type text not null,
  payload jsonb,
  status text not null default 'PROCESSED',
  created_at timestamp with time zone not null default now()
);

create table if not exists public.faq_articles (
  id text primary key,
  title text not null,
  category text not null,
  content text not null,
  keywords jsonb,
  is_published boolean not null default true,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.lesson_notes (
  id text primary key,
  school_id text references public.school(id) on delete set null,
  teacher_id text,
  title text not null,
  subject text not null,
  class_level text not null,
  author text not null,
  category text default 'Lesson Notes',
  content text,
  description text,
  file_url text,
  storage_path text,
  file_size text,
  is_pdf boolean default false,
  is_digital boolean default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Initialize lesson-notes Supabase Storage Bucket in SQL
-- Initialize Supabase Storage Buckets in SQL
create table if not exists public.nigerian_banks (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  code text not null unique,
  slug text,
  nibss_code text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_nigerian_banks_code on public.nigerian_banks(code);
create index if not exists idx_nigerian_banks_name on public.nigerian_banks(name);

alter table public.nigerian_banks enable row level security;

drop policy if exists nigerian_banks_read on public.nigerian_banks;
create policy nigerian_banks_read on public.nigerian_banks for select using (true);

drop policy if exists nigerian_banks_write on public.nigerian_banks;
create policy nigerian_banks_write on public.nigerian_banks for all using ((auth.jwt() ->> 'role') = 'SUPER_ADMIN');

insert into public.nigerian_banks (name, code, slug, nibss_code) values
('Access Bank',                        '044', 'access-bank',                  '000014'),
('Citibank Nigeria',                   '023', 'citibank-nigeria',             '000009'),
('Ecobank Nigeria',                    '050', 'ecobank-nigeria',              '000010'),
('Fidelity Bank',                      '070', 'fidelity-bank',                '000007'),
('First Bank of Nigeria',              '011', 'first-bank-of-nigeria',        '000016'),
('First City Monument Bank (FCMB)',    '214', 'fcmb',                         '000003'),
('Guaranty Trust Bank (GTBank)',       '058', 'guaranty-trust-bank',          '000013'),
('Heritage Bank',                      '030', 'heritage-bank',                '000020'),
('Keystone Bank',                      '082', 'keystone-bank',                '000002'),
('Polaris Bank',                       '076', 'polaris-bank',                 '000008'),
('Providus Bank',                      '101', 'providus-bank',                '000023'),
('Stanbic IBTC Bank',                  '221', 'stanbic-ibtc-bank',            '000012'),
('Standard Chartered Bank',            '068', 'standard-chartered-bank',      '000021'),
('Sterling Bank',                      '232', 'sterling-bank',                '000001'),
('SunTrust Bank',                      '100', 'suntrust-bank',                '000022'),
('Union Bank of Nigeria',              '032', 'union-bank',                   '000018'),
('United Bank for Africa (UBA)',       '033', 'uba',                          '000004'),
('Unity Bank',                         '215', 'unity-bank',                   '000011'),
('Wema Bank',                          '035', 'wema-bank',                    '000017'),
('Zenith Bank',                        '057', 'zenith-bank',                  '000015'),
('Jaiz Bank',                          '301', 'jaiz-bank',                    '000006'),
('Taj Bank',                           '302', 'taj-bank',                     '000026'),
('Lotus Bank',                         '303', 'lotus-bank',                   '000029'),
('Premium Trust Bank',                 '105', 'premium-trust-bank',           '000031'),
('Signature Bank',                     '106', 'signature-bank',               '000034'),
('Globus Bank',                        '103', 'globus-bank',                  '000027'),
('Parallex Bank',                      '104', 'parallex-bank',                '000030'),
('Optimus Bank',                       '107', 'optimus-bank',                 '000036'),
('Kuda Bank',                          '50211', 'kuda-bank',                  '090267'),
('OPay',                               '999992', 'opay',                      '100004'),
('PalmPay',                            '999991', 'palmpay',                   '100033'),
('Moniepoint MFB',                     '50515', 'moniepoint',                 '090405'),
('Carbon',                             '565', 'carbon',                       '100026'),
('V Bank',                             '566', 'v-bank',                       '100030'),
('Rubies MFB',                         '125', 'rubies-mfb',                   '090175'),
('Sparkle Microfinance Bank',          '51310', 'sparkle',                    '090328'),
('Fairmoney Microfinance Bank',        '51318', 'fairmoney',                  '090551'),
('Mintyn Bank',                        '50304', 'mintyn-bank',                '090281'),
('9 Payment Service Bank (9PSB)',      '120001', '9psb',                      '120001'),
('MoMo Payment Service Bank',          '120003', 'momo-psb',                  '120003'),
('SmartCash Payment Service Bank',     '120004', 'smartcash-psb',             '120004'),
('Hope Payment Service Bank',          '120002', 'hope-psb',                  '120002')
on conflict (code) do update set name = excluded.name, slug = excluded.slug, nibss_code = excluded.nibss_code, is_active = true;

insert into storage.buckets (id, name, public)
values
  ('lesson-notes', 'lesson-notes', true),
  ('school-cvs', 'school-cvs', false),
  ('school-data', 'school-data', false),
  ('school-logos', 'school-logos', true),
  ('school-receipts', 'school-receipts', false),
  ('school-generated-receipts', 'school-generated-receipts', false),
  ('leave-attachments', 'leave-attachments', false)
on conflict (id) do nothing;

drop policy if exists school_logos_public_select on storage.objects;
create policy school_logos_public_select on storage.objects
for select using (bucket_id = 'school-logos');

drop policy if exists school_logos_public_insert on storage.objects;
create policy school_logos_public_insert on storage.objects
for insert with check (bucket_id = 'school-logos');

drop policy if exists leave_attachments_tenant on storage.objects;
create policy leave_attachments_tenant on storage.objects
for all using (
  bucket_id = 'leave-attachments'
  AND (
    (auth.jwt() ->> 'role') = 'SUPER_ADMIN'
    OR (storage.foldername(name))[1] = (auth.jwt() ->> 'school_id')
  )
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

CREATE TABLE IF NOT EXISTS public.class_comments (
    id text DEFAULT gen_random_uuid()::text NOT NULL PRIMARY KEY,
    resource_type text NOT NULL,
    resource_id text NOT NULL,
    user_id text NOT NULL REFERENCES public.user(id) ON DELETE CASCADE,
    user_name text NOT NULL,
    user_role text NOT NULL,
    user_image text,
    content text NOT NULL,
    parent_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ===== SUPABASE JOB QUEUE & SERVERLESS WORKER ENGINE =====
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_status') THEN
    CREATE TYPE job_status AS ENUM ('pending', 'running', 'completed', 'failed', 'dead');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.jobs (
  id              BIGSERIAL PRIMARY KEY,
  queue           TEXT NOT NULL DEFAULT 'default',
  type            TEXT NOT NULL,
  payload         JSONB NOT NULL DEFAULT '{}'::jsonb,
  status          job_status NOT NULL DEFAULT 'pending',
  priority        SMALLINT NOT NULL DEFAULT 100,
  attempts        SMALLINT NOT NULL DEFAULT 0,
  max_attempts    SMALLINT NOT NULL DEFAULT 5,
  run_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  locked_by       TEXT,
  locked_until    TIMESTAMPTZ,
  last_error      TEXT,
  idempotency_key TEXT UNIQUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updatedAt      TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS jobs_claim_idx ON public.jobs (queue, priority, run_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS jobs_running_idx ON public.jobs (locked_until) WHERE status = 'running';
CREATE INDEX IF NOT EXISTS jobs_type_status_idx ON public.jobs (type, status);
CREATE INDEX IF NOT EXISTS jobs_created_idx ON public.jobs (created_at DESC);

CREATE OR REPLACE FUNCTION public.enqueue_job(
  p_type           TEXT,
  p_payload        JSONB,
  p_queue          TEXT    DEFAULT 'default',
  p_priority       SMALLINT DEFAULT 100,
  p_run_at         TIMESTAMPTZ DEFAULT now(),
  p_max_attempts   SMALLINT DEFAULT 5,
  p_idempotency_key TEXT DEFAULT NULL
) RETURNS BIGINT
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_id BIGINT;
BEGIN
  IF p_idempotency_key IS NOT NULL THEN
    INSERT INTO public.jobs (type, payload, queue, priority, run_at, max_attempts, idempotency_key)
    VALUES (p_type, p_payload, p_queue, p_priority, p_run_at, p_max_attempts, p_idempotency_key)
    ON CONFLICT (idempotency_key) DO NOTHING
    RETURNING id INTO v_id;
    IF v_id IS NOT NULL THEN RETURN v_id; END IF;
    SELECT id INTO v_id FROM public.jobs WHERE idempotency_key = p_idempotency_key;
    RETURN v_id;
  END IF;

  INSERT INTO public.jobs (type, payload, queue, priority, run_at, max_attempts)
  VALUES (p_type, p_payload, p_queue, p_priority, p_run_at, p_max_attempts)
  RETURNING id INTO v_id;
  RETURN v_id;
END; $$;

CREATE OR REPLACE FUNCTION public.claim_jobs(
  p_queue         TEXT,
  p_worker_id     TEXT,
  p_batch_size    INT DEFAULT 5,
  p_lease_seconds INT DEFAULT 90
) RETURNS SETOF public.jobs
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  UPDATE public.jobs j
  SET status       = 'running',
      locked_by    = p_worker_id,
      locked_until = now() + make_interval(secs => p_lease_seconds),
      attempts     = j.attempts + 1,
      updatedAt   = now()
  FROM (
    SELECT id FROM public.jobs
    WHERE queue   = p_queue
      AND status  = 'pending'
      AND run_at <= now()
    ORDER BY priority ASC, run_at ASC
    LIMIT p_batch_size
    FOR UPDATE SKIP LOCKED
  ) c
  WHERE j.id = c.id
  RETURNING j.*;
END; $$;

CREATE OR REPLACE FUNCTION public.complete_job(
  p_job_id BIGINT, p_worker_id TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_count INT;
BEGIN
  UPDATE public.jobs
  SET status = 'completed', completed_at = now(),
      locked_by = NULL, locked_until = NULL, updatedAt = now()
  WHERE id = p_job_id AND locked_by = p_worker_id AND status = 'running';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count > 0;
END; $$;

CREATE OR REPLACE FUNCTION public.fail_job(
  p_job_id BIGINT, p_worker_id TEXT, p_error TEXT
) RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_job public.jobs; v_status job_status; v_backoff INTERVAL;
BEGIN
  SELECT * INTO v_job FROM public.jobs
    WHERE id = p_job_id AND locked_by = p_worker_id AND status = 'running';
  IF NOT FOUND THEN RETURN 'not_owner'; END IF;

  IF v_job.attempts >= v_job.max_attempts THEN
    v_status := 'dead'; v_backoff := INTERVAL '0';
  ELSE
    v_status := 'pending';
    v_backoff := make_interval(secs => LEAST(3600, (30 * power(2, v_job.attempts))::int));
  END IF;

  UPDATE public.jobs
  SET status = v_status, last_error = p_error,
      run_at = now() + v_backoff,
      locked_by = NULL, locked_until = NULL, updatedAt = now()
  WHERE id = p_job_id;
  RETURN v_status::TEXT;
END; $$;

CREATE OR REPLACE FUNCTION public.reap_stuck_jobs()
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_count INT;
BEGIN
  UPDATE public.jobs
  SET status = CASE WHEN attempts >= max_attempts THEN 'dead'::job_status ELSE 'pending'::job_status END,
      run_at = now() + INTERVAL '30 seconds',
      locked_by = NULL, locked_until = NULL,
      last_error = 'lease expired', updatedAt = now()
  WHERE status = 'running' AND locked_until < now();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END; $$;
