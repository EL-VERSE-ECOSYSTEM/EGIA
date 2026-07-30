-- ====================================================================
-- EL GOODNEWS INT'L ACADEMY - COMPREHENSIVE PRODUCTION DATABASE SCHEMA
-- ====================================================================
-- This schema represents all entities, tables, constraints, relations,
-- and auditing logs required to run the EL GOODNEWS Academy platform.
-- Compatible with PostgreSQL (Neon / Supabase).
-- ====================================================================

-- ===== CAMEL CASE AND LEGACY ENHANCED SCHEMAS =====

CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash character varying NOT NULL,
  full_name character varying NOT NULL,
  role character varying NOT NULL,
  phone character varying,
  avatar_url text,
  is_active boolean DEFAULT true,
  is_verified boolean DEFAULT false,
  email_verified_at timestamp without time zone,
  last_login_at timestamp without time zone,
  last_login_ip inet,
  two_factor_secret character varying,
  two_factor_enabled boolean DEFAULT false,
  password_reset_token character varying,
  password_reset_expires timestamp without time zone,
  remember_token character varying,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamp without time zone,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.students (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  admission_number character varying NOT NULL UNIQUE,
  first_name character varying NOT NULL,
  last_name character varying NOT NULL,
  middle_name character varying,
  date_of_birth date,
  gender character varying,
  blood_group character varying,
  religion character varying,
  nationality character varying DEFAULT 'Nigerian'::character varying,
  state_of_origin character varying,
  lga character varying,
  home_address text,
  current_class character varying NOT NULL,
  class_arm character varying,
  admission_date date DEFAULT CURRENT_DATE,
  graduation_date date,
  is_graduated boolean DEFAULT false,
  current_session character varying,
  profile_photo text,
  emergency_contact_name character varying,
  emergency_contact_phone character varying,
  medical_info text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamp without time zone,
  CONSTRAINT students_pkey PRIMARY KEY (id),
  CONSTRAINT students_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE IF NOT EXISTS public.teachers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  staff_id character varying NOT NULL UNIQUE,
  first_name character varying NOT NULL,
  last_name character varying NOT NULL,
  qualification character varying,
  specialization character varying,
  date_of_employment date,
  date_of_birth date,
  gender character varying,
  phone_alternative character varying,
  home_address text,
  is_class_teacher boolean DEFAULT false,
  class_teacher_of character varying,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamp without time zone,
  CONSTRAINT teachers_pkey PRIMARY KEY (id),
  CONSTRAINT teachers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE IF NOT EXISTS public.parents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  occupation character varying,
  home_address text,
  office_address text,
  emergency_contact_name character varying,
  emergency_contact_phone character varying,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamp without time zone,
  CONSTRAINT parents_pkey PRIMARY KEY (id),
  CONSTRAINT parents_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE IF NOT EXISTS public.parent_students (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  parent_id uuid NOT NULL,
  student_id uuid NOT NULL,
  is_guardian boolean DEFAULT false,
  relationship character varying,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT parent_students_pkey PRIMARY KEY (id),
  CONSTRAINT parent_students_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.parents(id),
  CONSTRAINT parent_students_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id)
);

CREATE TABLE IF NOT EXISTS public.admins (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  admin_code character varying NOT NULL UNIQUE,
  department character varying,
  position character varying,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamp without time zone,
  CONSTRAINT admins_pkey PRIMARY KEY (id),
  CONSTRAINT admins_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE IF NOT EXISTS public.academic_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_current boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT academic_sessions_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.terms (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  term_name character varying NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_current boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT terms_pkey PRIMARY KEY (id),
  CONSTRAINT terms_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.academic_sessions(id)
);

CREATE TABLE IF NOT EXISTS public.classes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  level integer,
  category character varying,
  sort_order integer,
  is_active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT classes_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.class_arms (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL,
  arm_name character varying NOT NULL,
  capacity integer DEFAULT 40,
  class_teacher_id uuid,
  is_active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT class_arms_pkey PRIMARY KEY (id),
  CONSTRAINT class_arms_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id),
  CONSTRAINT class_arms_class_teacher_id_fkey FOREIGN KEY (class_teacher_id) REFERENCES public.teachers(id)
);

CREATE TABLE IF NOT EXISTS public.student_class_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  class_arm_id uuid NOT NULL,
  session_id uuid NOT NULL,
  term_id uuid NOT NULL,
  is_current boolean DEFAULT true,
  assigned_date date DEFAULT CURRENT_DATE,
  promoted_from uuid,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT student_class_assignments_pkey PRIMARY KEY (id),
  CONSTRAINT student_class_assignments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id),
  CONSTRAINT student_class_assignments_class_arm_id_fkey FOREIGN KEY (class_arm_id) REFERENCES public.class_arms(id),
  CONSTRAINT student_class_assignments_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.academic_sessions(id),
  CONSTRAINT student_class_assignments_term_id_fkey FOREIGN KEY (term_id) REFERENCES public.terms(id)
);

CREATE TABLE IF NOT EXISTS public.subjects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  code character varying NOT NULL UNIQUE,
  description text,
  category character varying,
  is_active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT subjects_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.class_subjects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  class_arm_id uuid NOT NULL,
  subject_id uuid NOT NULL,
  teacher_id uuid NOT NULL,
  is_compulsory boolean DEFAULT true,
  weekly_hours integer DEFAULT 4,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT class_subjects_pkey PRIMARY KEY (id),
  CONSTRAINT class_subjects_class_arm_id_fkey FOREIGN KEY (class_arm_id) REFERENCES public.class_arms(id),
  CONSTRAINT class_subjects_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id),
  CONSTRAINT class_subjects_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers(id)
);

CREATE TABLE IF NOT EXISTS public.timetables (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  class_arm_id uuid NOT NULL,
  subject_id uuid NOT NULL,
  teacher_id uuid NOT NULL,
  day_of_week integer NOT NULL,
  start_time time without time zone NOT NULL,
  end_time time without time zone NOT NULL,
  session_id uuid NOT NULL,
  term_id uuid NOT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT timetables_pkey PRIMARY KEY (id),
  CONSTRAINT timetables_class_arm_id_fkey FOREIGN KEY (class_arm_id) REFERENCES public.class_arms(id),
  CONSTRAINT timetables_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id),
  CONSTRAINT timetables_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers(id),
  CONSTRAINT timetables_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.academic_sessions(id),
  CONSTRAINT timetables_term_id_fkey FOREIGN KEY (term_id) REFERENCES public.terms(id)
);

CREATE TABLE IF NOT EXISTS public.assessments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title character varying NOT NULL,
  description text,
  type character varying NOT NULL,
  term_id uuid NOT NULL,
  session_id uuid NOT NULL,
  subject_id uuid NOT NULL,
  class_arm_id uuid NOT NULL,
  teacher_id uuid NOT NULL,
  total_score numeric NOT NULL,
  passing_score numeric,
  duration_minutes integer,
  is_published boolean DEFAULT false,
  published_at timestamp without time zone,
  due_date timestamp without time zone,
  instructions text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamp without time zone,
  CONSTRAINT assessments_pkey PRIMARY KEY (id),
  CONSTRAINT assessments_term_id_fkey FOREIGN KEY (term_id) REFERENCES public.terms(id),
  CONSTRAINT assessments_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.academic_sessions(id),
  CONSTRAINT assessments_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id),
  CONSTRAINT assessments_class_arm_id_fkey FOREIGN KEY (class_arm_id) REFERENCES public.class_arms(id),
  CONSTRAINT assessments_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers(id)
);

CREATE TABLE IF NOT EXISTS public.questions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL,
  question_text text NOT NULL,
  question_type character varying NOT NULL,
  options jsonb,
  correct_answer jsonb NOT NULL,
  explanation text,
  points numeric DEFAULT 1,
  order_number integer,
  image_url text,
  metadata jsonb,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT questions_pkey PRIMARY KEY (id),
  CONSTRAINT questions_assessment_id_fkey FOREIGN KEY (assessment_id) REFERENCES public.assessments(id)
);

CREATE TABLE IF NOT EXISTS public.fitb_answers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL,
  blank_position integer NOT NULL,
  correct_answer text NOT NULL,
  case_sensitive boolean DEFAULT false,
  partial_credit boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fitb_answers_pkey PRIMARY KEY (id),
  CONSTRAINT fitb_answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id)
);

CREATE TABLE IF NOT EXISTS public.results (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  assessment_id uuid NOT NULL,
  score numeric,
  percentage numeric,
  grade character varying,
  answers jsonb,
  feedback text,
  started_at timestamp without time zone,
  submitted_at timestamp without time zone,
  is_graded boolean DEFAULT false,
  graded_at timestamp without time zone,
  graded_by uuid,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamp without time zone,
  CONSTRAINT results_pkey PRIMARY KEY (id),
  CONSTRAINT results_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id),
  CONSTRAINT results_assessment_id_fkey FOREIGN KEY (assessment_id) REFERENCES public.assessments(id),
  CONSTRAINT results_graded_by_fkey FOREIGN KEY (graded_by) REFERENCES public.users(id)
);

CREATE TABLE IF NOT EXISTS public.cbt_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL,
  class_arm_id uuid NOT NULL,
  start_time timestamp without time zone NOT NULL,
  end_time timestamp without time zone NOT NULL,
  duration_minutes integer NOT NULL,
  allow_navigation boolean DEFAULT false,
  show_results boolean DEFAULT true,
  randomize_questions boolean DEFAULT false,
  randomize_options boolean DEFAULT false,
  is_active boolean DEFAULT false,
  ip_restrictions text[],
  proctoring_enabled boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT cbt_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT cbt_sessions_assessment_id_fkey FOREIGN KEY (assessment_id) REFERENCES public.assessments(id),
  CONSTRAINT cbt_sessions_class_arm_id_fkey FOREIGN KEY (class_arm_id) REFERENCES public.class_arms(id)
);

CREATE TABLE IF NOT EXISTS public.cbt_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  student_id uuid NOT NULL,
  status character varying DEFAULT 'NOT_STARTED',
  answers jsonb,
  score numeric,
  percentage numeric,
  started_at timestamp without time zone,
  submitted_at timestamp without time zone,
  time_spent integer,
  device_info jsonb,
  ip_address inet,
  tab_switch_count integer DEFAULT 0,
  screenshot_taken boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT cbt_attempts_pkey PRIMARY KEY (id),
  CONSTRAINT cbt_attempts_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.cbt_sessions(id),
  CONSTRAINT cbt_attempts_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id)
);

CREATE TABLE IF NOT EXISTS public.fee_structures (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  class_arm_id uuid NOT NULL,
  term_id uuid NOT NULL,
  fee_type character varying NOT NULL,
  amount numeric NOT NULL,
  is_mandatory boolean DEFAULT true,
  due_date date,
  late_fee numeric,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamp without time zone,
  CONSTRAINT fee_structures_pkey PRIMARY KEY (id),
  CONSTRAINT fee_structures_class_arm_id_fkey FOREIGN KEY (class_arm_id) REFERENCES public.class_arms(id),
  CONSTRAINT fee_structures_term_id_fkey FOREIGN KEY (term_id) REFERENCES public.terms(id)
);

CREATE TABLE IF NOT EXISTS public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  parent_id uuid NOT NULL,
  student_id uuid NOT NULL,
  fee_structure_id uuid,
  amount numeric NOT NULL,
  amount_paid numeric,
  balance numeric,
  reference character varying NOT NULL UNIQUE,
  korapay_transaction_id character varying,
  korapay_payment_link text,
  status character varying DEFAULT 'PENDING',
  payment_method character varying,
  payment_date timestamp without time zone,
  currency character varying DEFAULT 'NGN'::character varying,
  metadata jsonb,
  receipt_url text,
  notes text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamp without time zone,
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.parents(id),
  CONSTRAINT payments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id),
  CONSTRAINT payments_fee_structure_id_fkey FOREIGN KEY (fee_structure_id) REFERENCES public.fee_structures(id)
);

CREATE TABLE IF NOT EXISTS public.payment_installments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL,
  due_date date NOT NULL,
  amount_due numeric NOT NULL,
  amount_paid numeric DEFAULT 0,
  status character varying DEFAULT 'PENDING',
  paid_at timestamp without time zone,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT payment_installments_pkey PRIMARY KEY (id),
  CONSTRAINT payment_installments_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payments(id)
);

CREATE TABLE IF NOT EXISTS public.payment_webhook_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  transaction_id character varying,
  event_type character varying,
  payload jsonb,
  processed boolean DEFAULT false,
  error_message text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT payment_webhook_logs_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  type character varying NOT NULL,
  title character varying,
  created_by uuid,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT conversations_pkey PRIMARY KEY (id),
  CONSTRAINT conversations_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);

CREATE TABLE IF NOT EXISTS public.conversation_participants (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  user_id uuid NOT NULL,
  last_read_at timestamp without time zone,
  joined_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT conversation_participants_pkey PRIMARY KEY (id),
  CONSTRAINT conversation_participants_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id),
  CONSTRAINT conversation_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  attachments jsonb,
  is_read boolean DEFAULT false,
  is_deleted boolean DEFAULT false,
  reply_to_id uuid,
  reactions jsonb,
  metadata jsonb,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamp without time zone,
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id),
  CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id),
  CONSTRAINT messages_reply_to_id_fkey FOREIGN KEY (reply_to_id) REFERENCES public.messages(id)
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title character varying NOT NULL,
  message text NOT NULL,
  type character varying,
  data jsonb,
  is_read boolean DEFAULT false,
  read_at timestamp without time zone,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title character varying NOT NULL,
  content text NOT NULL,
  author_id uuid NOT NULL,
  target_roles text[],
  target_classes text[],
  is_published boolean DEFAULT true,
  published_at timestamp without time zone,
  expires_at timestamp without time zone,
  pinned boolean DEFAULT false,
  attachments jsonb,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT announcements_pkey PRIMARY KEY (id),
  CONSTRAINT announcements_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id)
);

CREATE TABLE IF NOT EXISTS public.disputes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ticket_number character varying NOT NULL UNIQUE,
  title character varying NOT NULL,
  category character varying NOT NULL,
  priority character varying DEFAULT 'MEDIUM',
  status character varying DEFAULT 'OPEN',
  description text NOT NULL,
  evidence jsonb,
  raised_by_id uuid NOT NULL,
  assigned_to_id uuid,
  related_student_id uuid,
  related_payment_id uuid,
  related_assessment_id uuid,
  resolution text,
  resolved_at timestamp without time zone,
  escalated_at timestamp without time zone,
  escalated_to character varying,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamp without time zone,
  CONSTRAINT disputes_pkey PRIMARY KEY (id),
  CONSTRAINT disputes_raised_by_id_fkey FOREIGN KEY (raised_by_id) REFERENCES public.users(id),
  CONSTRAINT disputes_assigned_to_id_fkey FOREIGN KEY (assigned_to_id) REFERENCES public.users(id),
  CONSTRAINT disputes_related_student_id_fkey FOREIGN KEY (related_student_id) REFERENCES public.students(id),
  CONSTRAINT disputes_related_payment_id_fkey FOREIGN KEY (related_payment_id) REFERENCES public.payments(id),
  CONSTRAINT disputes_related_assessment_id_fkey FOREIGN KEY (related_assessment_id) REFERENCES public.assessments(id)
);

CREATE TABLE IF NOT EXISTS public.dispute_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  dispute_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  message text NOT NULL,
  attachments jsonb,
  is_internal boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT dispute_messages_pkey PRIMARY KEY (id),
  CONSTRAINT dispute_messages_dispute_id_fkey FOREIGN KEY (dispute_id) REFERENCES public.disputes(id),
  CONSTRAINT dispute_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id)
);

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ticket_number character varying NOT NULL UNIQUE,
  title character varying NOT NULL,
  category character varying NOT NULL,
  priority character varying DEFAULT 'MEDIUM',
  status character varying DEFAULT 'OPEN',
  description text NOT NULL,
  screenshots jsonb,
  user_id uuid NOT NULL,
  assigned_agent_id uuid,
  resolution text,
  satisfaction_rating integer CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
  resolved_at timestamp without time zone,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamp without time zone,
  CONSTRAINT support_tickets_pkey PRIMARY KEY (id),
  CONSTRAINT support_tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT support_tickets_assigned_agent_id_fkey FOREIGN KEY (assigned_agent_id) REFERENCES public.users(id)
);

CREATE TABLE IF NOT EXISTS public.support_ticket_replies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL,
  user_id uuid NOT NULL,
  message text NOT NULL,
  attachments jsonb,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT support_ticket_replies_pkey PRIMARY KEY (id),
  CONSTRAINT support_ticket_replies_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.support_tickets(id),
  CONSTRAINT support_ticket_replies_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE IF NOT EXISTS public.attendance_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  class_arm_id uuid NOT NULL,
  subject_id uuid,
  date date NOT NULL,
  status character varying NOT NULL,
  time_in time without time zone,
  time_out time without time zone,
  marked_by_id uuid NOT NULL,
  note text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT attendance_records_pkey PRIMARY KEY (id),
  CONSTRAINT attendance_records_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id),
  CONSTRAINT attendance_records_class_arm_id_fkey FOREIGN KEY (class_arm_id) REFERENCES public.class_arms(id),
  CONSTRAINT attendance_records_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id),
  CONSTRAINT attendance_records_marked_by_id_fkey FOREIGN KEY (marked_by_id) REFERENCES public.users(id)
);

CREATE TABLE IF NOT EXISTS public.learning_materials (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title character varying NOT NULL,
  description text,
  type character varying,
  subject_id uuid,
  class_arm_id uuid,
  teacher_id uuid NOT NULL,
  file_url text,
  duration_minutes integer,
  is_published boolean DEFAULT false,
  uploaded_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT learning_materials_pkey PRIMARY KEY (id),
  CONSTRAINT learning_materials_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id),
  CONSTRAINT learning_materials_class_arm_id_fkey FOREIGN KEY (class_arm_id) REFERENCES public.class_arms(id),
  CONSTRAINT learning_materials_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers(id)
);

CREATE TABLE IF NOT EXISTS public.library_books (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  isbn character varying UNIQUE,
  title character varying NOT NULL,
  author character varying,
  publisher character varying,
  publication_year integer,
  category character varying,
  total_copies integer DEFAULT 1,
  available_copies integer DEFAULT 1,
  location character varying,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT library_books_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.book_borrowings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL,
  student_id uuid NOT NULL,
  borrowed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  due_date date NOT NULL,
  returned_at timestamp without time zone,
  status character varying DEFAULT 'BORROWED'::character varying,
  fine_amount numeric,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT book_borrowings_pkey PRIMARY KEY (id),
  CONSTRAINT book_borrowings_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.library_books(id),
  CONSTRAINT book_borrowings_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id)
);

CREATE TABLE IF NOT EXISTS public.disciplinary_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  reported_by_id uuid NOT NULL,
  incident_date date NOT NULL,
  incident_type character varying,
  description text NOT NULL,
  sanction character varying,
  status character varying DEFAULT 'PENDING'::character varying,
  resolved_at timestamp without time zone,
  notes text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT disciplinary_records_pkey PRIMARY KEY (id),
  CONSTRAINT disciplinary_records_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id),
  CONSTRAINT disciplinary_records_reported_by_id_fkey FOREIGN KEY (reported_by_id) REFERENCES public.users(id)
);

CREATE TABLE IF NOT EXISTS public.permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL UNIQUE,
  resource character varying NOT NULL,
  action character varying NOT NULL,
  description text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT permissions_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  role character varying NOT NULL,
  permission_id uuid NOT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT role_permissions_pkey PRIMARY KEY (id),
  CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id)
);

CREATE TABLE IF NOT EXISTS public.user_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  permission_id uuid NOT NULL,
  granted boolean DEFAULT true,
  expires_at timestamp without time zone,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT user_permissions_pkey PRIMARY KEY (id),
  CONSTRAINT user_permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT user_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id)
);

CREATE TABLE IF NOT EXISTS public.abac_policies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL UNIQUE,
  description text,
  role character varying,
  resource character varying NOT NULL,
  action character varying NOT NULL,
  conditions jsonb,
  priority integer DEFAULT 0,
  effect character varying DEFAULT 'ALLOW'::character varying,
  is_active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT abac_policies_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  action character varying NOT NULL,
  resource character varying NOT NULL,
  resource_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE IF NOT EXISTS public.login_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  login_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  ip_address inet,
  user_agent text,
  success boolean DEFAULT true,
  failure_reason text,
  CONSTRAINT login_history_pkey PRIMARY KEY (id),
  CONSTRAINT login_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE IF NOT EXISTS public.system_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  key character varying NOT NULL UNIQUE,
  value text,
  type character varying,
  description text,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT system_settings_pkey PRIMARY KEY (id)
);

-- ===== DRIZZLE SCHEMA ALIGNED TABLES =====

CREATE TABLE IF NOT EXISTS public.user (
  id text NOT NULL,
  email text NOT NULL UNIQUE,
  name text,
  image text,
  createdAt timestamp with time zone NOT NULL DEFAULT now(),
  updatedAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.parent (
  id text NOT NULL,
  userId text NOT NULL UNIQUE,
  firstName text NOT NULL,
  lastName text NOT NULL,
  phoneNumber text,
  address text,
  profileImage text,
  facialVerificationVideo text,
  createdAt timestamp with time zone NOT NULL DEFAULT now(),
  updatedAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT parent_pkey PRIMARY KEY (id),
  CONSTRAINT parent_userId_fkey FOREIGN KEY (userId) REFERENCES public.user(id)
);

CREATE TABLE IF NOT EXISTS public.student (
  id text NOT NULL,
  userId text UNIQUE,
  firstName text NOT NULL,
  lastName text NOT NULL,
  dateOfBirth date,
  gender text,
  class text NOT NULL,
  arm text,
  department text,
  admissionNumber text UNIQUE,
  parentId text,
  termId text,
  sessionId text,
  profileImage text,
  facialVerificationVideo text,
  isActive boolean DEFAULT true,
  password text DEFAULT 'default',
  createdAt timestamp with time zone NOT NULL DEFAULT now(),
  updatedAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT student_pkey PRIMARY KEY (id),
  CONSTRAINT student_userId_fkey FOREIGN KEY (userId) REFERENCES public.user(id),
  CONSTRAINT student_parentId_fkey FOREIGN KEY (parentId) REFERENCES public.parent(id)
);

CREATE TABLE IF NOT EXISTS public.teacher (
  id text NOT NULL,
  userId text NOT NULL UNIQUE,
  staffCode text UNIQUE,
  firstName text NOT NULL,
  lastName text NOT NULL,
  type text DEFAULT 'FULL_TIME'::text,
  isClassTeacher boolean DEFAULT false,
  assignedClassId text,
  daysPresent jsonb,
  applicationLetterUrl text,
  cvUrl text,
  qualification text,
  specialization text,
  profileImage text,
  facialVerificationVideo text,
  status text DEFAULT 'PENDING'::text,
  isActive boolean DEFAULT true,
  createdAt timestamp with time zone NOT NULL DEFAULT now(),
  updatedAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT teacher_pkey PRIMARY KEY (id),
  CONSTRAINT teacher_userId_fkey FOREIGN KEY (userId) REFERENCES public.user(id)
);

CREATE TABLE IF NOT EXISTS public.academic_session (
  id text NOT NULL,
  name text NOT NULL,
  startDate date NOT NULL,
  endDate date NOT NULL,
  isCurrent boolean DEFAULT false,
  CONSTRAINT academic_session_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.term (
  id text NOT NULL,
  sessionId text NOT NULL,
  name text NOT NULL,
  startDate date NOT NULL,
  endDate date NOT NULL,
  isCurrent boolean DEFAULT false,
  CONSTRAINT term_pkey PRIMARY KEY (id),
  CONSTRAINT term_sessionId_fkey FOREIGN KEY (sessionId) REFERENCES public.academic_session(id)
);

CREATE TABLE IF NOT EXISTS public.class (
  id text NOT NULL,
  name text NOT NULL,
  teacherId text,
  CONSTRAINT class_pkey PRIMARY KEY (id),
  CONSTRAINT class_teacherId_fkey FOREIGN KEY (teacherId) REFERENCES public.teacher(id)
);

CREATE TABLE IF NOT EXISTS public.subject (
  id text NOT NULL,
  name text NOT NULL,
  code text UNIQUE,
  CONSTRAINT subject_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.teacher_on_subject (
  id text NOT NULL,
  teacherId text NOT NULL,
  subjectId text NOT NULL,
  classId text NOT NULL,
  CONSTRAINT teacher_on_subject_pkey PRIMARY KEY (id),
  CONSTRAINT teacher_on_subject_teacherId_fkey FOREIGN KEY (teacherId) REFERENCES public.teacher(id),
  CONSTRAINT teacher_on_subject_subjectId_fkey FOREIGN KEY (subjectId) REFERENCES public.subject(id),
  CONSTRAINT teacher_on_subject_classId_fkey FOREIGN KEY (classId) REFERENCES public.class(id)
);

CREATE TABLE IF NOT EXISTS public.promotion_history (
  id text NOT NULL,
  studentId text NOT NULL,
  fromClass text NOT NULL,
  toClass text NOT NULL,
  type text NOT NULL,
  reason text,
  adminComment text,
  performedBy text NOT NULL,
  createdAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT promotion_history_pkey PRIMARY KEY (id),
  CONSTRAINT promotion_history_studentId_fkey FOREIGN KEY (studentId) REFERENCES public.student(id),
  CONSTRAINT promotion_history_performedBy_fkey FOREIGN KEY (performedBy) REFERENCES public.user(id)
);

CREATE TABLE IF NOT EXISTS public.assessment (
  id text NOT NULL,
  title text NOT NULL,
  description text,
  subjectId text NOT NULL,
  termId text NOT NULL,
  createdBy text NOT NULL,
  duration integer NOT NULL,
  type text NOT NULL,
  status text DEFAULT 'draft'::text,
  passingScore integer DEFAULT 40,
  totalPoints integer DEFAULT 100,
  createdAt timestamp with time zone NOT NULL DEFAULT now(),
  updatedAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT assessment_pkey PRIMARY KEY (id),
  CONSTRAINT assessment_subjectId_fkey FOREIGN KEY (subjectId) REFERENCES public.subject(id),
  CONSTRAINT assessment_termId_fkey FOREIGN KEY (termId) REFERENCES public.term(id),
  CONSTRAINT assessment_createdBy_fkey FOREIGN KEY (createdBy) REFERENCES public.teacher(id)
);

CREATE TABLE IF NOT EXISTS public.assessment_question (
  id text NOT NULL,
  assessmentId text NOT NULL,
  questionText text NOT NULL,
  questionType text NOT NULL,
  options jsonb,
  correctAnswer text,
  points integer DEFAULT 1,
  explanation text,
  "order" integer NOT NULL,
  CONSTRAINT assessment_question_pkey PRIMARY KEY (id),
  CONSTRAINT assessment_question_assessmentId_fkey FOREIGN KEY (assessmentId) REFERENCES public.assessment(id)
);

CREATE TABLE IF NOT EXISTS public.assessment_result (
  id text NOT NULL,
  assessmentId text NOT NULL,
  studentId text NOT NULL,
  score numeric NOT NULL,
  totalQuestions integer NOT NULL,
  correctAnswers integer NOT NULL,
  timeSpent integer NOT NULL,
  status text NOT NULL,
  gradedBy text,
  assessmentVideo text,
  warningCount integer DEFAULT 0,
  proctorLogs jsonb,
  createdAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT assessment_result_pkey PRIMARY KEY (id),
  CONSTRAINT assessment_result_assessmentId_fkey FOREIGN KEY (assessmentId) REFERENCES public.assessment(id),
  CONSTRAINT assessment_result_studentId_fkey FOREIGN KEY (studentId) REFERENCES public.student(id)
);

CREATE TABLE IF NOT EXISTS public.student_answer (
  id text NOT NULL,
  assessmentResultId text NOT NULL,
  questionId text NOT NULL,
  answerText text,
  isCorrect boolean,
  pointsEarned integer,
  createdAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT student_answer_pkey PRIMARY KEY (id),
  CONSTRAINT student_answer_assessmentResultId_fkey FOREIGN KEY (assessmentResultId) REFERENCES public.assessment_result(id)
);

CREATE TABLE IF NOT EXISTS public.attendance (
  id text NOT NULL,
  studentId text NOT NULL,
  classId text NOT NULL,
  date date NOT NULL,
  status text NOT NULL,
  remarks text,
  recordedBy text,
  recordedAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT attendance_pkey PRIMARY KEY (id),
  CONSTRAINT attendance_studentId_fkey FOREIGN KEY (studentId) REFERENCES public.student(id),
  CONSTRAINT attendance_classId_fkey FOREIGN KEY (classId) REFERENCES public.class(id)
);

CREATE TABLE IF NOT EXISTS public.fee_structure (
  id text NOT NULL,
  class text NOT NULL,
  department text,
  feeType text NOT NULL,
  amount numeric NOT NULL,
  dueDate date,
  description text,
  isActive boolean DEFAULT true,
  createdAt timestamp with time zone NOT NULL DEFAULT now(),
  updatedAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT fee_structure_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.payment (
  id text NOT NULL,
  studentId text NOT NULL,
  parentId text,
  termId text,
  amount numeric NOT NULL,
  feeType text,
  paymentMethod text NOT NULL,
  transactionReference text UNIQUE,
  korapayReference text UNIQUE,
  receiptUrl text,
  status text DEFAULT 'pending'::text,
  paymentDate timestamp with time zone,
  paidAt timestamp with time zone,
  description text,
  createdAt timestamp with time zone NOT NULL DEFAULT now(),
  updatedAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT payment_pkey PRIMARY KEY (id),
  CONSTRAINT payment_studentId_fkey FOREIGN KEY (studentId) REFERENCES public.student(id)
);

CREATE TABLE IF NOT EXISTS public.payment_installment (
  id text NOT NULL,
  paymentId text NOT NULL,
  amount numeric NOT NULL,
  dueDate date NOT NULL,
  paidAt timestamp with time zone,
  status text DEFAULT 'pending'::text,
  installmentNumber integer NOT NULL,
  createdAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT payment_installment_pkey PRIMARY KEY (id),
  CONSTRAINT payment_installment_paymentId_fkey FOREIGN KEY (paymentId) REFERENCES public.payment(id)
);

CREATE TABLE IF NOT EXISTS public.conversation (
  id text NOT NULL,
  type text NOT NULL,
  name text,
  createdAt timestamp without time zone DEFAULT now(),
  updatedAt timestamp without time zone DEFAULT now(),
  CONSTRAINT conversation_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.conversation_participant (
  id text NOT NULL,
  conversationId text NOT NULL,
  userId text NOT NULL,
  lastReadAt timestamp without time zone,
  joinedAt timestamp without time zone DEFAULT now(),
  CONSTRAINT conversation_participant_pkey PRIMARY KEY (id),
  CONSTRAINT conversation_participant_conversationId_fkey FOREIGN KEY (conversationId) REFERENCES public.conversation(id),
  CONSTRAINT conversation_participant_userId_fkey FOREIGN KEY (userId) REFERENCES public.user(id)
);

CREATE TABLE IF NOT EXISTS public.message (
  id text NOT NULL,
  content text NOT NULL,
  senderId text NOT NULL,
  conversationId text NOT NULL,
  attachments jsonb,
  isRead boolean DEFAULT false,
  isDeleted boolean DEFAULT false,
  replyToId text,
  reactions jsonb,
  createdAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT message_pkey PRIMARY KEY (id),
  CONSTRAINT message_senderId_fkey FOREIGN KEY (senderId) REFERENCES public.user(id),
  CONSTRAINT message_conversationId_fkey FOREIGN KEY (conversationId) REFERENCES public.conversation(id)
);

CREATE TABLE IF NOT EXISTS public.notification (
  id text NOT NULL,
  userId text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL,
  metadata jsonb,
  isRead boolean DEFAULT false,
  actionUrl text,
  readAt timestamp with time zone,
  createdAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT notification_pkey PRIMARY KEY (id),
  CONSTRAINT notification_userId_fkey FOREIGN KEY (userId) REFERENCES public.user(id)
);

CREATE TABLE IF NOT EXISTS public.dispute (
  id text NOT NULL,
  ticketNumber text NOT NULL UNIQUE,
  title text NOT NULL,
  category text NOT NULL,
  priority text NOT NULL,
  status text DEFAULT 'OPEN'::text,
  description text NOT NULL,
  evidence jsonb,
  raisedById text NOT NULL,
  assignedToId text,
  relatedStudentId text,
  relatedPaymentId text,
  relatedAssessmentId text,
  resolution text,
  resolvedBy text,
  resolvedAt timestamp with time zone,
  escalatedAt timestamp with time zone,
  escalatedTo text,
  createdAt timestamp with time zone NOT NULL DEFAULT now(),
  updatedAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT dispute_pkey PRIMARY KEY (id),
  CONSTRAINT dispute_raisedById_fkey FOREIGN KEY (raisedById) REFERENCES public.user(id)
);

CREATE TABLE IF NOT EXISTS public.dispute_message (
  id text NOT NULL,
  disputeId text NOT NULL,
  senderId text NOT NULL,
  message text NOT NULL,
  attachments jsonb,
  isInternal boolean DEFAULT false,
  createdAt timestamp without time zone DEFAULT now(),
  CONSTRAINT dispute_message_pkey PRIMARY KEY (id),
  CONSTRAINT dispute_message_disputeId_fkey FOREIGN KEY (disputeId) REFERENCES public.dispute(id),
  CONSTRAINT dispute_message_senderId_fkey FOREIGN KEY (senderId) REFERENCES public.user(id)
);

CREATE TABLE IF NOT EXISTS public.support_ticket (
  id text NOT NULL,
  ticketNumber text NOT NULL UNIQUE,
  title text NOT NULL,
  category text NOT NULL,
  priority text NOT NULL,
  status text DEFAULT 'OPEN'::text,
  description text NOT NULL,
  screenshots jsonb,
  userId text NOT NULL,
  assignedAgentId text,
  resolution text,
  satisfaction text,
  resolvedAt timestamp with time zone,
  createdAt timestamp with time zone NOT NULL DEFAULT now(),
  updatedAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT support_ticket_pkey PRIMARY KEY (id),
  CONSTRAINT support_ticket_userId_fkey FOREIGN KEY (userId) REFERENCES public.user(id)
);

CREATE TABLE IF NOT EXISTS public.abac_policy (
  id text NOT NULL,
  name text NOT NULL UNIQUE,
  description text,
  role text NOT NULL,
  resource text NOT NULL,
  action text NOT NULL,
  conditions jsonb NOT NULL,
  priority integer DEFAULT 0,
  effect text NOT NULL,
  createdAt timestamp without time zone DEFAULT now(),
  CONSTRAINT abac_policy_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.audit_log (
  id text NOT NULL,
  userId text NOT NULL,
  action text NOT NULL,
  resource text NOT NULL,
  resourceId text,
  details jsonb,
  ipAddress text,
  userAgent text,
  createdAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT audit_log_pkey PRIMARY KEY (id),
  CONSTRAINT audit_log_userId_fkey FOREIGN KEY (userId) REFERENCES public.user(id)
);

CREATE TABLE IF NOT EXISTS public.report_card (
  id text NOT NULL,
  studentId text NOT NULL,
  studentName text NOT NULL,
  className text NOT NULL,
  marks jsonb NOT NULL,
  teacherRemarks text,
  status text DEFAULT 'PENDING'::text,
  adminFeedback text,
  term text,
  session text,
  endorsedAt timestamp with time zone,
  createdAt timestamp with time zone DEFAULT now(),
  CONSTRAINT report_card_pkey PRIMARY KEY (id)
);
