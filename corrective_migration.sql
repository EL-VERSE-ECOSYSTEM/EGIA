-- Production SQL Management Script for Supabase / Postgres
BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ============================================================
-- 1. BASE TENANT / CORE TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.school (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name text NOT NULL,
    code text NOT NULL UNIQUE,
    location text NOT NULL,
    registeredclasses jsonb NOT NULL DEFAULT '[]'::jsonb,
    allowparents boolean NOT NULL DEFAULT true,
    adminname text,
    adminphone text,
    adminemail text,
    bankname text,
    accountnumber text,
    accountname text,
    custompaymentlink text,
    paymentstatus text NOT NULL DEFAULT 'PENDING' CHECK (paymentstatus IN ('PENDING','PAID','FAILED','CANCELLED')),
    paymentreference text UNIQUE,
    logo_url text,
    logo_path text,
    logo_uploaded_at timestamptz,
    is_active boolean NOT NULL DEFAULT true,
    createdat timestamptz NOT NULL DEFAULT now(),
    updatedat timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."user" (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email citext NOT NULL UNIQUE,
    name text,
    image text,
    schoolid text REFERENCES public.school(id) ON DELETE SET NULL,
    last_identity_id text,
    last_identity_at timestamptz,
    gender text,
    adminlevel text,
    createdat timestamptz NOT NULL DEFAULT now(),
    updatedat timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_role (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    userid text NOT NULL UNIQUE REFERENCES public."user"(id) ON DELETE CASCADE,
    role text NOT NULL CHECK (role IN (
        'STUDENT','PUPIL','TEACHER','PARENT','SCHOOL_ADMIN','SUPER_ADMIN','ADMIN'
    )),
    createdat timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.parent (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    userid text NOT NULL UNIQUE REFERENCES public."user"(id) ON DELETE CASCADE,
    schoolid text REFERENCES public.school(id) ON DELETE SET NULL,
    firstname text NOT NULL,
    lastname text NOT NULL,
    gender text,
    phonenumber text,
    address text,
    profileimage text,
    facialverificationvideo text,
    occupation text,
    createdat timestamptz NOT NULL DEFAULT now(),
    updatedat timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.parent ADD COLUMN IF NOT EXISTS firstname text;
ALTER TABLE public.parent ADD COLUMN IF NOT EXISTS lastname text;

CREATE TABLE IF NOT EXISTS public.teacher (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    userid text NOT NULL UNIQUE REFERENCES public."user"(id) ON DELETE CASCADE,
    schoolid text REFERENCES public.school(id) ON DELETE SET NULL,
    staffcode text UNIQUE,
    firstname text NOT NULL,
    lastname text NOT NULL,
    phonenumber text,
    gender text,
    type text NOT NULL DEFAULT 'FULL_TIME' CHECK (type IN ('FULL_TIME','PART_TIME','CONTRACT','TEMPORARY')),
    isclassteacher boolean NOT NULL DEFAULT false,
    isparttime boolean NOT NULL DEFAULT false,
    assignedclassid text,
    dayspresent jsonb,
    handlingclasses jsonb,
    teachingsubjects jsonb,
    presentdays jsonb,
    resumptiontime text,
    resumptiondate date,
    bio text,
    applicationletterurl text,
    cvurl text,
    qualification text,
    specialization text,
    profileimage text,
    facialverificationvideo text,
    status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','ACTIVE','SUSPENDED','REJECTED')),
    isactive boolean NOT NULL DEFAULT true,
    createdat timestamptz NOT NULL DEFAULT now(),
    updatedat timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.academic_session (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    schoolid text REFERENCES public.school(id) ON DELETE CASCADE,
    name text NOT NULL,
    startdate date NOT NULL,
    enddate date NOT NULL,
    iscurrent boolean NOT NULL DEFAULT false,
    createdat timestamptz NOT NULL DEFAULT now(),
    updatedat timestamptz NOT NULL DEFAULT now(),
    CHECK (enddate >= startdate)
);

CREATE TABLE IF NOT EXISTS public.term (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    schoolid text REFERENCES public.school(id) ON DELETE CASCADE,
    sessionid text REFERENCES public.academic_session(id) ON DELETE CASCADE,
    name text NOT NULL,
    startdate date NOT NULL,
    enddate date NOT NULL,
    iscurrent boolean NOT NULL DEFAULT false,
    createdat timestamptz NOT NULL DEFAULT now(),
    updatedat timestamptz NOT NULL DEFAULT now(),
    CHECK (enddate >= startdate)
);

CREATE TABLE IF NOT EXISTS public."class" (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    schoolid text REFERENCES public.school(id) ON DELETE CASCADE,
    name text NOT NULL,
    teacherid text REFERENCES public.teacher(id) ON DELETE SET NULL,
    createdat timestamptz NOT NULL DEFAULT now(),
    updatedat timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.student (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    userid text UNIQUE REFERENCES public."user"(id) ON DELETE CASCADE,
    schoolid text REFERENCES public.school(id) ON DELETE SET NULL,
    firstname text NOT NULL,
    middlename text,
    lastname text NOT NULL,
    dateofbirth date,
    dateofresumption date,
    gender text,
    class text NOT NULL,
    arm text,
    department text,
    admissionnumber text UNIQUE,
    parentid text REFERENCES public.parent(id) ON DELETE SET NULL,
    termid text,
    sessionid text,
    profileimage text,
    facialverificationvideo text,
    subjectsdone jsonb,
    isactive boolean NOT NULL DEFAULT true,
    registration_paid boolean NOT NULL DEFAULT false,
    registration_reference text,
    enrollment_type text CHECK (enrollment_type IN ('ADMIN','SELF')),
    registrationstatus text NOT NULL DEFAULT 'WAIVED' CHECK (registrationstatus IN ('WAIVED','PENDING_PAYMENT','ACTIVE','SUSPENDED','WITHDRAWN')),
    createdat timestamptz NOT NULL DEFAULT now(),
    updatedat timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.admission_number_sequences (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    schoolid text NOT NULL UNIQUE REFERENCES public.school(id) ON DELETE CASCADE,
    last_number integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.subject (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name text NOT NULL,
    code text UNIQUE,
    is_active boolean NOT NULL DEFAULT true,
    is_custom boolean NOT NULL DEFAULT false,
    education_levels text[] NOT NULL DEFAULT '{}',
    departments text[] NOT NULL DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.teacher_on_subject (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    teacherid text NOT NULL REFERENCES public.teacher(id) ON DELETE CASCADE,
    subjectid text NOT NULL REFERENCES public.subject(id) ON DELETE CASCADE,
    classid text NOT NULL REFERENCES public."class"(id) ON DELETE CASCADE,
    createdat timestamptz NOT NULL DEFAULT now(),
    UNIQUE (teacherid, subjectid, classid)
);

CREATE TABLE IF NOT EXISTS public.promotion_history (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    studentid text NOT NULL REFERENCES public.student(id) ON DELETE CASCADE,
    fromclass text NOT NULL,
    toclass text NOT NULL,
    type text NOT NULL,
    reason text,
    admincomment text,
    performedby text NOT NULL REFERENCES public."user"(id) ON DELETE RESTRICT,
    createdat timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.school_admin_roles (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    schoolid text NOT NULL REFERENCES public.school(id) ON DELETE CASCADE,
    userid text NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
    level text NOT NULL CHECK (level IN (
        'PRIMARY_ADMIN','VICE_PRINCIPAL_ACADEMICS','VICE_PRINCIPAL_ADMIN',
        'HOD_SCIENCE','HOD_ARTS','HOD_COMMERCIAL'
    )),
    department text,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (schoolid, userid)
);

CREATE TABLE IF NOT EXISTS public.school_registration_application (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    school_id text REFERENCES public.school(id) ON DELETE SET NULL,
    applicant_email text NOT NULL,
    applicant_phone text NOT NULL,
    applicant_name text NOT NULL,
    school_name text NOT NULL,
    school_address text NOT NULL,
    proof_of_address_type text NOT NULL DEFAULT 'ELECTRICITY_BILL',
    proof_of_address_file_url text,
    document_verification_status text NOT NULL DEFAULT 'PENDING',
    payment_status text NOT NULL DEFAULT 'PENDING',
    approval_status text NOT NULL DEFAULT 'PENDING_REVIEW',
    submitted_at timestamptz NOT NULL DEFAULT now(),
    reviewed_by text REFERENCES public."user"(id) ON DELETE SET NULL,
    reviewed_at timestamptz,
    rejection_reason text,
    admin_level text DEFAULT 'PRIMARY_ADMIN',
    registered_classes jsonb,
    allow_parents boolean DEFAULT true,
    payment_reference text UNIQUE,
    logo_url text,
    logo_path text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.system_settings (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    key text NOT NULL UNIQUE,
    value text,
    type text,
    description text,
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. ASSESSMENTS / CBT / RESULTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.assessment (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    schoolid text REFERENCES public.school(id) ON DELETE SET NULL,
    title text NOT NULL,
    description text,
    subjectid text NOT NULL REFERENCES public.subject(id) ON DELETE RESTRICT,
    termid text REFERENCES public.term(id) ON DELETE RESTRICT,
    createdby text NOT NULL REFERENCES public.teacher(id) ON DELETE RESTRICT,
    duration integer NOT NULL CHECK (duration > 0),
    type text NOT NULL CHECK (type IN ('MCQ','FITB','TRUE_FALSE','ESSAY','MIXED')),
    status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending_approval','approved','published','rejected','archived')),
    accesscode text,
    admincomment text,
    passingscore integer NOT NULL DEFAULT 40 CHECK (passingscore >= 0 AND passingscore <= 100),
    totalpoints integer NOT NULL DEFAULT 100 CHECK (totalpoints > 0),
    createdat timestamptz NOT NULL DEFAULT now(),
    updatedat timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.assessment_question (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    assessmentid text NOT NULL REFERENCES public.assessment(id) ON DELETE CASCADE,
    questiontext text NOT NULL,
    questiontype text NOT NULL CHECK (questiontype IN ('MCQ','FITB','TRUE_FALSE','ESSAY')),
    options jsonb,
    correctanswer text,
    imageurl text,
    points integer NOT NULL DEFAULT 1 CHECK (points > 0),
    explanation text,
    "order" integer NOT NULL CHECK ("order" >= 1),
    createdat timestamptz NOT NULL DEFAULT now(),
    updatedat timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.assessment_result (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    schoolid text REFERENCES public.school(id) ON DELETE SET NULL,
    assessmentid text NOT NULL REFERENCES public.assessment(id) ON DELETE CASCADE,
    studentid text NOT NULL REFERENCES public.student(id) ON DELETE CASCADE,
    score numeric(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
    totalquestions integer NOT NULL CHECK (totalquestions >= 0),
    correctanswers integer NOT NULL CHECK (correctanswers >= 0),
    timespent integer NOT NULL CHECK (timespent >= 0),
    status text NOT NULL CHECK (status IN ('SUBMITTED','AUTO_GRADED','UNDER_REVIEW','APPROVED','PUBLISHED','REJECTED')),
    gradedby text REFERENCES public."user"(id) ON DELETE SET NULL,
    assessmentvideo text,
    warningcount integer NOT NULL DEFAULT 0 CHECK (warningcount >= 0),
    proctorlogs jsonb,
    createdat timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.student_answer (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    assessmentresultid text NOT NULL REFERENCES public.assessment_result(id) ON DELETE CASCADE,
    questionid text NOT NULL REFERENCES public.assessment_question(id) ON DELETE CASCADE,
    answertext text,
    iscorrect boolean,
    pointsearned integer,
    createdat timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cbt_sessions (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    assessment_id text NOT NULL REFERENCES public.assessment(id) ON DELETE CASCADE,
    student_id text NOT NULL REFERENCES public.student(id) ON DELETE CASCADE,
    access_code text NOT NULL,
    status text NOT NULL DEFAULT 'ONGOING' CHECK (status IN ('ONGOING','PAUSED','SUBMITTED','CANCELLED','EXPIRED')),
    started_at timestamptz NOT NULL DEFAULT now(),
    ended_at timestamptz,
    warning_count integer NOT NULL DEFAULT 0 CHECK (warning_count >= 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cbt_attempts (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    session_id text NOT NULL REFERENCES public.cbt_sessions(id) ON DELETE CASCADE,
    student_id text NOT NULL REFERENCES public.student(id) ON DELETE CASCADE,
    answers jsonb,
    score numeric(5,2),
    completed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.assessment_logs (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    schoolid text NOT NULL REFERENCES public.school(id) ON DELETE CASCADE,
    assessment_id text REFERENCES public.assessment(id) ON DELETE CASCADE,
    student_id text REFERENCES public.student(id) ON DELETE CASCADE,
    action text NOT NULL,
    metadata jsonb,
    ip_address text,
    user_agent text,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. FEES / PAYMENTS / RECEIPTS / LEDGER
-- ============================================================

CREATE TABLE IF NOT EXISTS public.fee_structure (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    schoolid text REFERENCES public.school(id) ON DELETE CASCADE,
    class text NOT NULL,
    department text,
    feetype text NOT NULL,
    amount numeric(12,2) NOT NULL CHECK (amount > 0),
    dueDate date,
    description text,
    isActive boolean NOT NULL DEFAULT true,
    createdAt timestamptz NOT NULL DEFAULT now(),
    updatedAt timestamptz NOT NULL DEFAULT now(),
    UNIQUE (schoolid, class, department, feetype)
);

CREATE TABLE IF NOT EXISTS public.payment (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    schoolid text REFERENCES public.school(id) ON DELETE SET NULL,
    studentid text NOT NULL REFERENCES public.student(id) ON DELETE CASCADE,
    parentid text REFERENCES public.parent(id) ON DELETE SET NULL,
    termid text,
    amount numeric(12,2) NOT NULL CHECK (amount >= 0),
    feetype text,
    paymentmethod text NOT NULL,
    transactionreference text UNIQUE,
    korapayreference text UNIQUE,
    receipturl text,
    reconciliation_status text NOT NULL DEFAULT 'UNRECONCILED' CHECK (reconciliation_status IN ('UNRECONCILED','RECONCILED','DISPUTED')),
    reconciled_by text REFERENCES public."user"(id) ON DELETE SET NULL,
    reconciled_at timestamptz,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','success','failed','approved','cleared','refunded','cancelled')),
    paymentdate timestamptz,
    paidat timestamptz,
    description text,
    createdat timestamptz NOT NULL DEFAULT now(),
    updatedat timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payment_installment (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    paymentid text NOT NULL REFERENCES public.payment(id) ON DELETE CASCADE,
    amount numeric(12,2) NOT NULL CHECK (amount > 0),
    duedate date NOT NULL,
    paidat timestamptz,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','overdue')),
    installmentnumber integer NOT NULL CHECK (installmentnumber > 0),
    createdat timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transactions (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    reference text NOT NULL UNIQUE,
    amount numeric(12,2) NOT NULL CHECK (amount >= 0),
    currency text NOT NULL DEFAULT 'NGN',
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','success','failed','refunded','cancelled')),
    customer_email text NOT NULL,
    customer_name text,
    description text,
    checkout_url text,
    metadata jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transaction_ledger (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    schoolid text NOT NULL REFERENCES public.school(id) ON DELETE CASCADE,
    userid text REFERENCES public."user"(id) ON DELETE SET NULL,
    studentid text REFERENCES public.student(id) ON DELETE SET NULL,
    type text NOT NULL,
    direction text NOT NULL CHECK (direction IN ('IN','OUT')),
    amount numeric(12,2) NOT NULL CHECK (amount >= 0),
    currency text NOT NULL DEFAULT 'NGN',
    reference text UNIQUE,
    gateway text,
    status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','SUCCESS','FAILED','REVERSED')),
    description text,
    metadata jsonb,
    confirmation_method text CHECK (confirmation_method IN ('KORAPAY_AUTO','MANUAL_UPLOAD','SCHOOL_ACCOUNT')),
    receipt_upload_id text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.webhook_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_key text NOT NULL UNIQUE,
    table_name text NOT NULL,
    event_type text NOT NULL,
    record_id text,
    payload jsonb NOT NULL DEFAULT '{}'::jsonb,
    status text NOT NULL DEFAULT 'processing' CHECK (status IN ('processing','processed','failed')),
    error_message text,
    processed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payment_webhook_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_key text NOT NULL UNIQUE,
    provider text NOT NULL DEFAULT 'KORAPAY',
    reference text,
    event_type text NOT NULL,
    payload jsonb NOT NULL,
    status text NOT NULL DEFAULT 'PROCESSING' CHECK (status IN ('PROCESSING','PROCESSED','FAILED')),
    attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
    error_message text,
    processed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.school_payment_config (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    schoolid text NOT NULL UNIQUE REFERENCES public.school(id) ON DELETE CASCADE,
    use_korapay boolean NOT NULL DEFAULT true,
    bank_name text,
    account_number text,
    account_name text,
    custom_payment_link text,
    instructions text,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT bank_required_if_not_korapay CHECK (
        use_korapay = true OR (use_korapay = false AND account_number IS NOT NULL AND account_name IS NOT NULL)
    )
);

CREATE TABLE IF NOT EXISTS public.payment_receipt_uploads (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    schoolid text NOT NULL REFERENCES public.school(id) ON DELETE CASCADE,
    payment_id text REFERENCES public.payment(id) ON DELETE CASCADE,
    student_id text REFERENCES public.student(id) ON DELETE CASCADE,
    parent_id text REFERENCES public.parent(id) ON DELETE SET NULL,
    uploaded_by text NOT NULL REFERENCES public."user"(id) ON DELETE RESTRICT,
    uploaded_by_role text NOT NULL CHECK (uploaded_by_role IN ('PARENT','SCHOOL_ADMIN')),
    file_url text NOT NULL,
    file_path text NOT NULL,
    file_type text NOT NULL CHECK (file_type IN ('image/png','image/jpeg','application/pdf')),
    file_size_kb integer,
    amount_claimed numeric(12,2),
    payment_reference text,
    status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED')),
    reviewed_by text REFERENCES public."user"(id) ON DELETE SET NULL,
    reviewed_at timestamptz,
    rejection_reason text,
    generated_receipt_url text,
    generated_receipt_path text,
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.teacher_wallet (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    teacherid text NOT NULL UNIQUE REFERENCES public.teacher(id) ON DELETE CASCADE,
    balance numeric(12,2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0),
    salaryamount numeric(12,2) NOT NULL DEFAULT 150000.00,
    salarystatus text NOT NULL DEFAULT 'pending' CHECK (salarystatus IN ('pending','paid','processing','rejected')),
    daily_rate numeric(12,2) NOT NULL DEFAULT 0.00 CHECK (daily_rate >= 0),
    hourly_rate numeric(12,2) NOT NULL DEFAULT 0.00 CHECK (hourly_rate >= 0),
    late_penalty_per_minute numeric(12,2) NOT NULL DEFAULT 0.00,
    early_exit_penalty_per_minute numeric(12,2) NOT NULL DEFAULT 0.00,
    absence_penalty_per_day numeric(12,2) NOT NULL DEFAULT 0.00,
    updatedat timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.teacher_request (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    teacherid text NOT NULL REFERENCES public.teacher(id) ON DELETE CASCADE,
    type text NOT NULL,
    amount numeric(12,2) NOT NULL CHECK (amount >= 0),
    details text,
    phonenumber text NOT NULL,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','paid','cancelled')),
    createdat timestamptz NOT NULL DEFAULT now(),
    updatedat timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 4. LIBRARY / BOOKS / SEARCH
-- ============================================================

CREATE TABLE IF NOT EXISTS public.library_books (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    schoolid text REFERENCES public.school(id) ON DELETE SET NULL,
    isbn text,
    title text NOT NULL,
    subtitle text,
    authors text[] NOT NULL DEFAULT '{}',
    publisher text,
    publication_year integer,
    edition text,
    volume text,
    language text,
    pages integer,
    category text,
    sub_category text,
    description text,
    cover_image_url text,
    file_url text,
    location text,
    total_copies integer NOT NULL DEFAULT 0 CHECK (total_copies >= 0),
    available_copies integer NOT NULL DEFAULT 0 CHECK (available_copies >= 0),
    borrowed_count integer NOT NULL DEFAULT 0 CHECK (borrowed_count >= 0),
    rating numeric(3,2) DEFAULT 0.00 CHECK (rating >= 0 AND rating <= 5),
    rating_count integer NOT NULL DEFAULT 0 CHECK (rating_count >= 0),
    is_digital boolean NOT NULL DEFAULT false,
    class_level text,
    deleted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.library_books ADD COLUMN IF NOT EXISTS schoolid text;

CREATE TABLE IF NOT EXISTS public.library_book_loans (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    bookid text NOT NULL REFERENCES public.library_books(id) ON DELETE CASCADE,
    studentid text REFERENCES public.student(id) ON DELETE SET NULL,
    parentid text REFERENCES public.parent(id) ON DELETE SET NULL,
    borrowed_by text REFERENCES public."user"(id) ON DELETE SET NULL,
    status text NOT NULL DEFAULT 'BORROWED' CHECK (status IN ('BORROWED','RETURNED','OVERDUE','LOST')),
    borrow_date timestamptz NOT NULL DEFAULT now(),
    due_date timestamptz,
    returned_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.library_book_reviews (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    bookid text NOT NULL REFERENCES public.library_books(id) ON DELETE CASCADE,
    userid text NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
    rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review text,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (bookid, userid)
);

CREATE TABLE IF NOT EXISTS public.book_favorites (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    bookid text NOT NULL REFERENCES public.library_books(id) ON DELETE CASCADE,
    userid text NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (bookid, userid)
);

CREATE TABLE IF NOT EXISTS public.search_logs (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    query text NOT NULL,
    results_count integer DEFAULT 0,
    schoolid text REFERENCES public.school(id) ON DELETE SET NULL,
    userid text REFERENCES public."user"(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 5. MESSAGING / NOTIFICATIONS / FCM
-- ============================================================

CREATE TABLE IF NOT EXISTS public.conversation (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    schoolid text REFERENCES public.school(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('DIRECT','GROUP','SCHOOL')),
    name text,
    createdat timestamptz NOT NULL DEFAULT now(),
    updatedat timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.conversation_participant (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    conversationid text NOT NULL REFERENCES public.conversation(id) ON DELETE CASCADE,
    userid text NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
    lastreadat timestamptz,
    joinedat timestamptz NOT NULL DEFAULT now(),
    UNIQUE (conversationid, userid)
);

CREATE TABLE IF NOT EXISTS public.message (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    content text NOT NULL,
    senderid text NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
    conversationid text NOT NULL REFERENCES public.conversation(id) ON DELETE CASCADE,
    schoolid text REFERENCES public.school(id) ON DELETE SET NULL,
    attachments jsonb,
    isread boolean NOT NULL DEFAULT false,
    isdeleted boolean NOT NULL DEFAULT false,
    replytoid text,
    reactions jsonb,
    createdat timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notification (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    userid text NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
    schoolid text REFERENCES public.school(id) ON DELETE CASCADE,
    title text NOT NULL,
    message text NOT NULL,
    type text NOT NULL,
    metadata jsonb,
    isread boolean NOT NULL DEFAULT false,
    actionurl text,
    readat timestamptz,
    createdat timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_fcm_tokens (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id text NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
    token text NOT NULL UNIQUE,
    device_name text,
    device_type text NOT NULL DEFAULT 'web',
    browser text,
    os text,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notification_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id text REFERENCES public."user"(id) ON DELETE SET NULL,
    school_id text REFERENCES public.school(id) ON DELETE SET NULL,
    event_key text,
    title text NOT NULL,
    body text NOT NULL,
    type text NOT NULL,
    data jsonb NOT NULL DEFAULT '{}'::jsonb,
    link text,
    delivered boolean NOT NULL DEFAULT false,
    read_at timestamptz,
    sent_at timestamptz NOT NULL DEFAULT now(),
    metadata jsonb,
    UNIQUE (user_id, event_key)
);

ALTER TABLE public.notification_history ADD COLUMN IF NOT EXISTS event_key text;
ALTER TABLE public.notification_history ADD COLUMN IF NOT EXISTS school_id text;
ALTER TABLE public.notification_history ADD COLUMN IF NOT EXISTS user_id text;

-- ============================================================
-- 6. SUPPORT / DISPUTES / AUDIT
-- ============================================================

CREATE TABLE IF NOT EXISTS public.support_ticket (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    ticketnumber text NOT NULL UNIQUE,
    title text NOT NULL,
    category text NOT NULL,
    priority text NOT NULL CHECK (priority IN ('LOW','MEDIUM','HIGH','URGENT')),
    status text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','IN_PROGRESS','RESOLVED','CLOSED','REOPENED')),
    description text NOT NULL,
    screenshots jsonb,
    userid text NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
    assignedagentid text REFERENCES public."user"(id) ON DELETE SET NULL,
    resolution text,
    satisfaction text,
    resolvedat timestamptz,
    createdat timestamptz NOT NULL DEFAULT now(),
    updatedat timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.support_ticket_replies (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    ticket_id text NOT NULL REFERENCES public.support_ticket(id) ON DELETE CASCADE,
    sender_id text NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
    message text NOT NULL,
    attachments jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.dispute (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    ticketnumber text NOT NULL UNIQUE,
    title text NOT NULL,
    category text NOT NULL,
    priority text NOT NULL CHECK (priority IN ('LOW','MEDIUM','HIGH','URGENT')),
    status text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','IN_PROGRESS','RESOLVED','CLOSED','REOPENED')),
    description text NOT NULL,
    evidence jsonb,
    raisedbyid text NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
    assignedtoid text REFERENCES public."user"(id) ON DELETE SET NULL,
    relatedstudentid text REFERENCES public.student(id) ON DELETE SET NULL,
    relatedpaymentid text REFERENCES public.payment(id) ON DELETE SET NULL,
    relatedassessmentid text REFERENCES public.assessment(id) ON DELETE SET NULL,
    resolution text,
    resolvedby text REFERENCES public."user"(id) ON DELETE SET NULL,
    resolvedat timestamptz,
    escalatedat timestamptz,
    escalatedto text,
    createdat timestamptz NOT NULL DEFAULT now(),
    updatedat timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.dispute_message (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    disputeid text NOT NULL REFERENCES public.dispute(id) ON DELETE CASCADE,
    senderid text NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
    message text NOT NULL,
    attachments jsonb,
    isinternal boolean NOT NULL DEFAULT false,
    createdat timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.invitations (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    school_id text NOT NULL REFERENCES public.school(id) ON DELETE CASCADE,
    email citext,
    phone text,
    role text NOT NULL CHECK (role IN ('TEACHER','PARENT','STUDENT')),
    token_hash text NOT NULL UNIQUE,
    status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','ACCEPTED','EXPIRED','REVOKED')),
    expires_at timestamptz NOT NULL,
    invited_by text REFERENCES public."user"(id) ON DELETE SET NULL,
    accepted_by text REFERENCES public."user"(id) ON DELETE SET NULL,
    accepted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id text REFERENCES public."user"(id) ON DELETE SET NULL,
    school_id text REFERENCES public.school(id) ON DELETE SET NULL,
    action text NOT NULL,
    resource text NOT NULL,
    resource_id text,
    before_state jsonb,
    after_state jsonb,
    details jsonb,
    ip_address inet,
    user_agent text,
    request_id text,
    createdat timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_log ADD COLUMN IF NOT EXISTS actor_user_id text;
ALTER TABLE public.audit_log ADD COLUMN IF NOT EXISTS school_id text;

-- ============================================================
-- 7. ADULT EDUCATION
-- ============================================================

CREATE TABLE IF NOT EXISTS public.adult_education_enrollments (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    parent_id text NOT NULL,
    school_id text REFERENCES public.school(id) ON DELETE SET NULL,
    days_of_week jsonb NOT NULL DEFAULT '[]'::jsonb,
    subject_to_learn text NOT NULL,
    preferred_time text NOT NULL,
    status text NOT NULL DEFAULT 'PENDING_PAYMENT' CHECK (status IN ('PENDING_PAYMENT','ACTIVE','PAID','REJECTED','CANCELLED')),
    registration_paid boolean NOT NULL DEFAULT false,
    weekly_paid_until timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.adult_education_payments (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    parent_id text NOT NULL,
    amount numeric(12,2) NOT NULL CHECK (amount >= 0),
    payment_type text NOT NULL,
    reference text NOT NULL UNIQUE,
    status text NOT NULL DEFAULT 'success' CHECK (status IN ('pending','success','failed','refunded')),
    paid_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.adult_education_classes (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title text NOT NULL,
    description text,
    type text NOT NULL CHECK (type IN ('VIDEO','LIVE','ASSIGNMENT','SESSION')),
    url text,
    content text,
    due_date timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    teacher_id text
);

-- ============================================================
-- 8. TEACHER ATTENDANCE / LEAVE / PAYROLL
-- ============================================================

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
    status text NOT NULL DEFAULT 'PRESENT' CHECK (status IN ('PRESENT','LATE','ABSENT','HALF_DAY','ON_LEAVE','SUSPENDED')),
    late_minutes integer NOT NULL DEFAULT 0 CHECK (late_minutes >= 0),
    early_exit_minutes integer NOT NULL DEFAULT 0 CHECK (early_exit_minutes >= 0),
    overtime_minutes integer NOT NULL DEFAULT 0 CHECK (overtime_minutes >= 0),
    is_manual_override boolean NOT NULL DEFAULT false,
    override_by text REFERENCES public."user"(id) ON DELETE SET NULL,
    override_reason text,
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (teacherid, work_date)
);

CREATE TABLE IF NOT EXISTS public.leave_types (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    schoolid text REFERENCES public.school(id) ON DELETE CASCADE,
    name text NOT NULL,
    code text NOT NULL,
    default_days_per_year integer NOT NULL DEFAULT 12 CHECK (default_days_per_year >= 0),
    is_paid boolean NOT NULL DEFAULT true,
    requires_attachment boolean NOT NULL DEFAULT false,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (schoolid, code)
);

CREATE TABLE IF NOT EXISTS public.teacher_leave_requests (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    schoolid text NOT NULL REFERENCES public.school(id) ON DELETE CASCADE,
    teacherid text NOT NULL REFERENCES public.teacher(id) ON DELETE CASCADE,
    leave_type_id text NOT NULL REFERENCES public.leave_types(id) ON DELETE RESTRICT,
    start_date date NOT NULL,
    end_date date NOT NULL,
    total_days integer NOT NULL CHECK (total_days > 0),
    reason text NOT NULL,
    attachment_url text,
    attachment_path text,
    status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED','CANCELLED')),
    reviewed_by text REFERENCES public."user"(id) ON DELETE SET NULL,
    reviewed_at timestamptz,
    admin_comment text,
    rejection_reason text,
    is_paid boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CHECK (end_date >= start_date)
);

CREATE TABLE IF NOT EXISTS public.teacher_leave_balance (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    schoolid text NOT NULL REFERENCES public.school(id) ON DELETE CASCADE,
    teacherid text NOT NULL REFERENCES public.teacher(id) ON DELETE CASCADE,
    leave_type_id text NOT NULL REFERENCES public.leave_types(id) ON DELETE RESTRICT,
    academic_year text NOT NULL,
    allocated_days integer NOT NULL DEFAULT 0 CHECK (allocated_days >= 0),
    used_days integer NOT NULL DEFAULT 0 CHECK (used_days >= 0),
    pending_days integer NOT NULL DEFAULT 0 CHECK (pending_days >= 0),
    remaining_days integer GENERATED ALWAYS AS (allocated_days - used_days - pending_days) STORED,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (teacherid, leave_type_id, academic_year)
);

CREATE TABLE IF NOT EXISTS public.teacher_salary_deductions (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    schoolid text NOT NULL REFERENCES public.school(id) ON DELETE CASCADE,
    teacherid text NOT NULL REFERENCES public.teacher(id) ON DELETE CASCADE,
    month text NOT NULL,
    deduction_type text NOT NULL CHECK (deduction_type IN ('ABSENCE','LATE','EARLY_EXIT','UNPAID_LEAVE','OTHER')),
    reference_attendance_id text REFERENCES public.teacher_attendance(id) ON DELETE SET NULL,
    amount numeric(12,2) NOT NULL CHECK (amount >= 0),
    reason text,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 9. STUDY VIDEOS / MATERIALS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.study_video (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title text NOT NULL CHECK (length(trim(title)) > 0),
    description text NOT NULL CHECK (length(trim(description)) > 0),
    subject text NOT NULL,
    class_name text NOT NULL,
    video_url text NOT NULL CHECK (video_url ~ '^https?://'),
    duration_minutes integer CHECK (duration_minutes IS NULL OR duration_minutes > 0),
    teacher_id text NOT NULL REFERENCES public.teacher(id) ON DELETE CASCADE,
    is_published boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.study_video_question (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    video_id text NOT NULL REFERENCES public.study_video(id) ON DELETE CASCADE,
    student_id text NOT NULL REFERENCES public.student(id) ON DELETE CASCADE,
    content text NOT NULL CHECK (length(trim(content)) BETWEEN 1 AND 2000),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.study_video_reply (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    question_id text NOT NULL REFERENCES public.study_video_question(id) ON DELETE CASCADE,
    teacher_id text NOT NULL REFERENCES public.teacher(id) ON DELETE CASCADE,
    content text NOT NULL CHECK (length(trim(content)) BETWEEN 1 AND 4000),
    created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 10. REPORTS / REPORT CARD / ABAC / AUTH AUDIT
-- ============================================================

CREATE TABLE IF NOT EXISTS public.report_card (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    studentid text NOT NULL REFERENCES public.student(id) ON DELETE CASCADE,
    studentname text NOT NULL,
    classname text NOT NULL,
    marks jsonb NOT NULL,
    teacherremarks text,
    status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED')),
    adminfeedback text,
    term text,
    session text,
    endorsedat timestamptz,
    createdat timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.abac_policy (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name text NOT NULL UNIQUE,
    description text,
    role text NOT NULL,
    resource text NOT NULL,
    action text NOT NULL,
    conditions jsonb NOT NULL DEFAULT '{}'::jsonb,
    priority integer NOT NULL DEFAULT 0,
    effect text NOT NULL DEFAULT 'ALLOW' CHECK (effect IN ('ALLOW','DENY')),
    createdat timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.login_history (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    userid text REFERENCES public."user"(id) ON DELETE SET NULL,
    schoolid text REFERENCES public.school(id) ON DELETE SET NULL,
    ip_address inet,
    user_agent text,
    success boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 11. UNIQUE INDEXES / PERFORMANCE INDEXES
-- ============================================================

CREATE UNIQUE INDEX IF NOT EXISTS user_email_lower_uq ON public."user"(lower(trim(email)));
CREATE UNIQUE INDEX IF NOT EXISTS school_code_lower_uq ON public.school(lower(trim(code)));
CREATE UNIQUE INDEX IF NOT EXISTS student_admission_lower_uq ON public.student(upper(trim(admissionnumber))) WHERE admissionnumber IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS teacher_staffcode_upper_uq ON public.teacher(upper(trim(staffcode))) WHERE staffcode IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_school ON public."user"(schoolid);
CREATE INDEX IF NOT EXISTS idx_student_school_parent ON public.student(schoolid, parentid);
CREATE INDEX IF NOT EXISTS idx_student_school_class ON public.student(schoolid, class);
CREATE INDEX IF NOT EXISTS idx_teacher_school ON public.teacher(schoolid);
CREATE INDEX IF NOT EXISTS idx_parent_school ON public.parent(schoolid);
CREATE INDEX IF NOT EXISTS idx_subject_name ON public.subject(lower(name));
CREATE INDEX IF NOT EXISTS idx_payment_student ON public.payment(studentid);
CREATE INDEX IF NOT EXISTS idx_cbt_sessions_student ON public.cbt_sessions(student_id, assessment_id);
CREATE INDEX IF NOT EXISTS idx_notification_user ON public.notification("userId");
CREATE INDEX IF NOT EXISTS idx_notification_history_user ON public.notification_history(user_id);
CREATE INDEX IF NOT EXISTS idx_message_conversation ON public.message("conversationId");
CREATE INDEX IF NOT EXISTS idx_support_ticket_user ON public.support_ticket("userId");
CREATE INDEX IF NOT EXISTS idx_dispute_raisedby ON public.dispute("raisedById");
CREATE INDEX IF NOT EXISTS idx_library_search ON public.library_books(title, category, class_level) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_library_books_school ON public.library_books(schoolid, deleted_at) WHERE schoolid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payment_receipt_uploads_school ON public.payment_receipt_uploads(schoolid, status);
CREATE INDEX IF NOT EXISTS idx_student_attendance_day ON public.teacher_attendance(teacherid, work_date);

-- ============================================================
-- 12. USEFUL VIEWS
-- ============================================================

CREATE OR REPLACE VIEW public.student_subject_profile AS
SELECT
    s.id AS student_id,
    s.admissionnumber,
    s.firstname,
    s.lastname,
    s.class,
    jsonb_array_elements_text(COALESCE(s.subjectsdone, '[]'::jsonb)) AS subject_name
FROM public.student s
WHERE COALESCE(s.subjectsdone, '[]'::jsonb) IS NOT NULL;

CREATE OR REPLACE VIEW public.teacher_subject_profile AS
SELECT
    t.id AS teacher_id,
    t.staffcode,
    t.firstname,
    t.lastname,
    jsonb_array_elements_text(COALESCE(t.teachingsubjects, '[]'::jsonb)) AS subject_name
FROM public.teacher t
WHERE COALESCE(t.teachingsubjects, '[]'::jsonb) IS NOT NULL;

CREATE OR REPLACE VIEW public.payment_receipt_chain AS
SELECT
    p.id AS payment_id,
    p.schoolid,
    p.studentid,
    p.amount,
    p.status AS payment_status,
    r.id AS receipt_id,
    r.file_url AS uploaded_file_url,
    r.status AS receipt_status,
    r.generated_receipt_url AS official_receipt_url,
    t.id AS ledger_id,
    t.confirmation_method
FROM public.payment p
LEFT JOIN public.payment_receipt_uploads r ON r.payment_id = p.id
LEFT JOIN public.transaction_ledger t ON t.receipt_upload_id = r.id;

-- ============================================================
-- 13. TRIGGERS / FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_updatedat()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updatedat = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  tbl_name text;
BEGIN
  FOREACH tbl_name IN ARRAY ARRAY[
    'school',
    'user',
    'parent',
    'teacher',
    'academic_session',
    'term',
    'class',
    'student',
    'assessment',
    'assessment_question',
    'payment',
    'payment_installment',
    'transactions',
    'conversation',
    'message',
    'notification',
    'teacher_wallet',
    'teacher_request',
    'report_card',
    'fee_structure'
  ]
  LOOP
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = tbl_name
        AND column_name = 'updatedat'
    ) THEN
      EXECUTE format(
        'DROP TRIGGER IF EXISTS %I ON public.%I',
        'set_updatedat_' || tbl_name,
        tbl_name
      );

      EXECUTE format(
        'CREATE TRIGGER %I
         BEFORE UPDATE ON public.%I
         FOR EACH ROW
         EXECUTE FUNCTION public.set_updatedat()',
        'set_updatedat_' || tbl_name,
        tbl_name
      );
    END IF;
  END LOOP;
END $$;

DO $$
DECLARE
  tbl_name text;
BEGIN
  FOREACH tbl_name IN ARRAY ARRAY[
    'user_fcm_tokens',
    'notification_history',
    'webhook_events',
    'payment_webhook_events',
    'transaction_ledger',
    'payment_receipt_uploads',
    'school_payment_config',
    'school_admin_roles',
    'school_registration_application',
    'adult_education_enrollments',
    'adult_education_classes',
    'teacher_attendance',
    'teacher_leave_requests',
    'teacher_leave_balance',
    'teacher_salary_deductions',
    'study_video',
    'library_books',
    'book_borrowings',
    'support_ticket_replies',
    'support_tickets',
    'dispute_messages',
    'disputes',
    'invitations',
    'audit_log'
  ]
  LOOP
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = tbl_name
        AND column_name = 'updated_at'
    ) THEN
      EXECUTE format(
        'DROP TRIGGER IF EXISTS %I ON public.%I',
        'set_updated_at_' || tbl_name,
        tbl_name
      );

      EXECUTE format(
        'CREATE TRIGGER %I
         BEFORE UPDATE ON public.%I
         FOR EACH ROW
         EXECUTE FUNCTION public.set_updated_at()',
        'set_updated_at_' || tbl_name,
        tbl_name
      );
    END IF;
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.enforce_parent_ward_limit()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.parentid IS NOT NULL AND (TG_OP = 'INSERT' OR NEW.parentid IS DISTINCT FROM OLD.parentid) THEN
        IF (SELECT COUNT(*) FROM public.student WHERE parentid = NEW.parentid AND id <> NEW.id) >= 5 THEN
            RAISE EXCEPTION 'A parent may be linked to at most five wards';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_parent_ward_limit_trigger ON public.student;
CREATE TRIGGER enforce_parent_ward_limit_trigger
BEFORE INSERT OR UPDATE OF parentid
ON public.student
FOR EACH ROW
EXECUTE FUNCTION public.enforce_parent_ward_limit();

-- ============================================================
-- 14. STORAGE BUCKETS & POLICIES
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('school-logos', 'school-logos', true, 2097152, ARRAY['image/png','image/jpeg','image/webp','image/svg+xml']),
  ('school-documents', 'school-documents', true, 10485760, ARRAY['application/pdf','image/png','image/jpeg','image/webp']),
  ('school-receipts', 'school-receipts', false, 5242880, ARRAY['image/png','image/jpeg','application/pdf']),
  ('school-generated-receipts', 'school-generated-receipts', false, 10485760, ARRAY['application/pdf']),
  ('lesson-notes', 'lesson-notes', false, 52428800, ARRAY['application/pdf']),
  ('student-media', 'student-media', false, 52428800, ARRAY['image/png','image/jpeg','image/webp','video/webm','video/mp4']),
  ('teacher-documents', 'teacher-documents', false, 10485760, ARRAY['application/pdf','image/png','image/jpeg'])
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS school_documents_public_read ON storage.objects;
CREATE POLICY school_documents_public_read ON storage.objects FOR SELECT TO public USING (bucket_id = 'school-documents');

DROP POLICY IF EXISTS school_documents_public_insert ON storage.objects;
CREATE POLICY school_documents_public_insert ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'school-documents');

DROP POLICY IF EXISTS school_logos_public_read ON storage.objects;
CREATE POLICY school_logos_public_read ON storage.objects FOR SELECT TO public USING (bucket_id = 'school-logos');

DROP POLICY IF EXISTS school_logos_authenticated_insert ON storage.objects;
CREATE POLICY school_logos_authenticated_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'school-logos' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS school_logos_owner_update ON storage.objects;
CREATE POLICY school_logos_owner_update ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'school-logos' AND owner_id = auth.uid()::text) WITH CHECK (bucket_id = 'school-logos' AND owner_id = auth.uid()::text);

DROP POLICY IF EXISTS school_receipts_authenticated_insert ON storage.objects;
CREATE POLICY school_receipts_authenticated_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'school-receipts' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS school_receipts_owner_read ON storage.objects;
CREATE POLICY school_receipts_owner_read ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'school-receipts' AND owner_id = auth.uid()::text);

DROP POLICY IF EXISTS generated_receipts_service_access ON storage.objects;
CREATE POLICY generated_receipts_service_access ON storage.objects FOR ALL TO service_role USING (bucket_id = 'school-generated-receipts') WITH CHECK (bucket_id = 'school-generated-receipts');

DROP POLICY IF EXISTS lesson_notes_authenticated_read ON storage.objects;
CREATE POLICY lesson_notes_authenticated_read ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'lesson-notes' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS lesson_notes_authenticated_insert ON storage.objects;
CREATE POLICY lesson_notes_authenticated_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'lesson-notes' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS student_media_authenticated_insert ON storage.objects;
CREATE POLICY student_media_authenticated_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id IN ('student-media','teacher-documents') AND auth.uid() IS NOT NULL);

-- ============================================================
-- 15. RLS + GRANTS
-- ============================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

GRANT SELECT ON TABLE public.subject TO authenticated;
GRANT SELECT ON TABLE public.school TO authenticated;
GRANT SELECT ON TABLE public."user" TO authenticated;
GRANT SELECT ON TABLE public.student TO authenticated;
GRANT SELECT ON TABLE public.teacher TO authenticated;
GRANT SELECT ON TABLE public.parent TO authenticated;

ALTER TABLE IF EXISTS public."user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.student ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.teacher ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.parent ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payment ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notification ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notification_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_fcm_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payment_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_role_all_access_on_user ON public."user";
CREATE POLICY service_role_all_access_on_user ON public."user" FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_access_on_student ON public.student;
CREATE POLICY service_role_all_access_on_student ON public.student FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_access_on_teacher ON public.teacher;
CREATE POLICY service_role_all_access_on_teacher ON public.teacher FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_access_on_parent ON public.parent;
CREATE POLICY service_role_all_access_on_parent ON public.parent FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS notification_history_owner_read ON public.notification_history;
CREATE POLICY notification_history_owner_read ON public.notification_history FOR SELECT TO authenticated USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS user_fcm_tokens_owner_read ON public.user_fcm_tokens;
CREATE POLICY user_fcm_tokens_owner_read ON public.user_fcm_tokens FOR SELECT TO authenticated USING (auth.uid()::text = user_id);

-- ============================================================
-- 16. INSERT BASE SUBJECTS & ABAC RULES
-- ============================================================

INSERT INTO public.subject (id, name, code, is_active, is_custom, education_levels, departments)
VALUES
    (gen_random_uuid()::text, 'Mathematics', 'MATH', true, false, ARRAY['PRIMARY','JUNIOR','SENIOR'], ARRAY['GENERAL','SCIENCE','COMMERCIAL']),
    (gen_random_uuid()::text, 'English Studies', 'ENG', true, false, ARRAY['PRIMARY','JUNIOR','SENIOR'], ARRAY['GENERAL']),
    (gen_random_uuid()::text, 'Use of English', 'USE-ENG', true, false, ARRAY['SENIOR'], ARRAY['GENERAL','SCIENCE','ARTS','COMMERCIAL']),
    (gen_random_uuid()::text, 'History', 'HIST', true, false, ARRAY['PRIMARY','JUNIOR','SENIOR'], ARRAY['GENERAL']),
    (gen_random_uuid()::text, 'Security and Citizenship Education', 'SCE', true, false, ARRAY['PRIMARY','JUNIOR'], ARRAY['GENERAL']),
    (gen_random_uuid()::text, 'French', 'FRENCH', true, false, ARRAY['PRIMARY','JUNIOR'], ARRAY['GENERAL']),
    (gen_random_uuid()::text, 'Basic Science', 'BSC', true, false, ARRAY['PRIMARY','JUNIOR'], ARRAY['GENERAL']),
    (gen_random_uuid()::text, 'Biology', 'BIO', true, false, ARRAY['SENIOR'], ARRAY['GENERAL','SCIENCE']),
    (gen_random_uuid()::text, 'Physics', 'PHY', true, false, ARRAY['SENIOR'], ARRAY['SCIENCE']),
    (gen_random_uuid()::text, 'Chemistry', 'CHEM', true, false, ARRAY['SENIOR'], ARRAY['SCIENCE']),
    (gen_random_uuid()::text, 'Agricultural Science', 'AGRIC', true, false, ARRAY['SENIOR'], ARRAY['SCIENCE']),
    (gen_random_uuid()::text, 'Geography', 'GEO', true, false, ARRAY['SENIOR'], ARRAY['SCIENCE']),
    (gen_random_uuid()::text, 'Government', 'GOV', true, false, ARRAY['SENIOR'], ARRAY['ARTS','COMMERCIAL']),
    (gen_random_uuid()::text, 'Literature in English', 'LIT', true, false, ARRAY['SENIOR'], ARRAY['ARTS']),
    (gen_random_uuid()::text, 'Commerce', 'COMM', true, false, ARRAY['SENIOR'], ARRAY['COMMERCIAL']),
    (gen_random_uuid()::text, 'Financial Accounting', 'ACC', true, false, ARRAY['SENIOR'], ARRAY['COMMERCIAL']),
    (gen_random_uuid()::text, 'Physical and Health Education', 'PHE', true, false, ARRAY['PRIMARY','JUNIOR','SENIOR'], ARRAY['GENERAL']),
    (gen_random_uuid()::text, 'Business Studies', 'BUS', true, false, ARRAY['JUNIOR'], ARRAY['GENERAL']),
    (gen_random_uuid()::text, 'Yoruba', 'YORUBA', true, false, ARRAY['PRIMARY','JUNIOR','SENIOR'], ARRAY['GENERAL','ARTS']),
    (gen_random_uuid()::text, 'Computer Studies', 'COMP', true, false, ARRAY['PRIMARY','JUNIOR','SENIOR'], ARRAY['GENERAL','SCIENCE']),
    (gen_random_uuid()::text, 'Civic Education', 'CIVIC', true, false, ARRAY['PRIMARY','JUNIOR','SENIOR'], ARRAY['GENERAL'])
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.abac_policy (id, name, description, role, resource, action, conditions, priority, effect)
VALUES
    (gen_random_uuid()::text, 'super_admin_full_access', 'Super admin full access', 'SUPER_ADMIN', '*', '*', '{}'::jsonb, 100, 'ALLOW'),
    (gen_random_uuid()::text, 'school_admin_school_access', 'School admin access within school tenant', 'SCHOOL_ADMIN', '*', '*', '{"user.schoolId":"resource.schoolId"}'::jsonb, 90, 'ALLOW'),
    (gen_random_uuid()::text, 'teacher_assessment_manage', 'Teachers manage assessments', 'TEACHER', 'assessment', '*', '{}'::jsonb, 80, 'ALLOW'),
    (gen_random_uuid()::text, 'student_own_results', 'Students read own results', 'STUDENT', 'result', 'read', '{}'::jsonb, 70, 'ALLOW'),
    (gen_random_uuid()::text, 'parent_children_results', 'Parents read children results', 'PARENT', 'result', 'read', '{}'::jsonb, 70, 'ALLOW')
ON CONFLICT (name) DO NOTHING;

COMMIT;
