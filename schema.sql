-- EL GOODNEWS ACADEMY: canonical Supabase schema
-- WARNING: this is a clean-install script.  It deletes every object in the
-- public schema, including all application data.  It does not touch auth.*.
-- The explicit drops cover the legacy/plural schema supplied for the school;
-- DROP SCHEMA then also clears app tables, views, triggers, functions and types.
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
drop table if exists public.notifications cascade;
drop table if exists public.messages cascade;
drop table if exists public.conversation_participants cascade;
drop table if exists public.conversations cascade;
drop table if exists public.payment_webhook_logs cascade;
drop table if exists public.payment_installments cascade;
drop table if exists public.payments cascade;
drop table if exists public.fee_structures cascade;
drop table if exists public.cbt_attempts cascade;
drop table if exists public.cbt_sessions cascade;
drop table if exists public.results cascade;
drop table if exists public.fitb_answers cascade;
drop table if exists public.questions cascade;
drop table if exists public.assessments cascade;
drop table if exists public.timetables cascade;
drop table if exists public.class_subjects cascade;
drop table if exists public.subjects cascade;
drop table if exists public.student_class_assignments cascade;
drop table if exists public.class_arms cascade;
drop table if exists public.classes cascade;
drop table if exists public.terms cascade;
drop table if exists public.academic_sessions cascade;
drop table if exists public.admins cascade;
drop table if exists public.parent_students cascade;
drop table if exists public.parents cascade;
drop table if exists public.teachers cascade;
drop table if exists public.students cascade;
drop table if exists public.users cascade;
drop table if exists public.promotion_history cascade;
drop table if exists public.permissions cascade;
drop table if exists public.role_permissions cascade;
drop table if exists public.user_permissions cascade;
drop table if exists public.abac_policies cascade;
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

-- Core accounts and profiles -------------------------------------------------
create table public."user" (
  "id" text primary key, "email" text not null unique, "name" text, "image" text,
  "createdat" timestamptz not null default now(), "updatedat" timestamptz not null default now()
);
create table public."user_role" (
  "id" text primary key, "userid" text not null unique references public."user"("id") on delete cascade,
  "role" text not null, "createdat" timestamptz not null default now()
);
create table public."parent" (
  "id" text primary key, "userid" text not null unique references public."user"("id") on delete cascade,
  "firstname" text not null, "lastname" text not null, "phonenumber" text, "address" text,
  "profileimage" text, "facialverificationvideo" text, "occupation" text,
  "createdat" timestamptz not null default now(), "updatedat" timestamptz not null default now()
);
create table public."teacher" (
  "id" text primary key, "userid" text not null unique references public."user"("id") on delete cascade,
  "staffcode" text unique, "firstname" text not null, "lastname" text not null,
  "type" text default 'FULL_TIME', "isclassteacher" boolean default false, "isparttime" boolean default false,
  "assignedclassid" text, "dayspresent" jsonb, "handlingclasses" jsonb, "teachingsubjects" jsonb,
  "presentdays" jsonb, "resumptiontime" text, "resumptiondate" date, "bio" text,
  "applicationletterurl" text, "cvurl" text, "qualification" text, "specialization" text,
  "profileimage" text, "facialverificationvideo" text, "status" text default 'PENDING',
  "isactive" boolean default true, "createdat" timestamptz not null default now(),
  "updatedat" timestamptz not null default now(),
  constraint teacher_teachingsubjects_array check ("teachingsubjects" is null or jsonb_typeof("teachingsubjects") = 'array'),
  constraint teacher_handlingclasses_array check ("handlingclasses" is null or jsonb_typeof("handlingclasses") = 'array')
);
create table public."academic_session" (
  "id" text primary key, "name" text not null, "startDate" date not null, "endDate" date not null,
  "isCurrent" boolean default false
);
create table public."term" (
  "id" text primary key, "sessionId" text not null references public."academic_session"("id"),
  "name" text not null, "startDate" date not null, "endDate" date not null, "isCurrent" boolean default false
);
create table public."class" (
  "id" text primary key, "name" text not null,
  "teacherId" text references public."teacher"("id")
);
create table public."student" (
  "id" text primary key, "userid" text unique references public."user"("id") on delete cascade,
  "firstname" text not null, "middlename" text, "lastname" text not null, "dateofbirth" date,
  "dateofresumption" date, "gender" text, "class" text not null, "arm" text, "department" text,
  "admissionnumber" text unique, "parentid" text references public."parent"("id") on delete set null,
  "termid" text, "sessionid" text, "profileimage" text, "facialverificationvideo" text,
  "subjectsdone" jsonb, "isactive" boolean default true, "registrationstatus" text not null default 'WAIVED',
  "password" text default 'default', "createdat" timestamptz not null default now(),
  "updatedat" timestamptz not null default now(),
  constraint student_subjectsdone_array check ("subjectsdone" is null or jsonb_typeof("subjectsdone") = 'array'),
  constraint student_registration_status_valid check ("registrationstatus" in ('WAIVED', 'PENDING_PAYMENT', 'ACTIVE'))
);

-- Academics ------------------------------------------------------------------
create table public."subject" (
  "id" text primary key, "name" text not null, "code" text unique, "is_active" boolean not null default true,
  "is_custom" boolean not null default false, "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);
create unique index subject_name_lower_unique on public."subject" (lower(trim("name")));
create table public."teacher_on_subject" (
  "id" text primary key, "teacherId" text not null references public."teacher"("id"),
  "subjectId" text not null references public."subject"("id"), "classId" text not null references public."class"("id"),
  unique ("teacherId", "subjectId", "classId")
);
create table public."promotion_history" (
  "id" text primary key, "studentId" text not null references public."student"("id"), "fromClass" text not null,
  "toClass" text not null, "type" text not null, "reason" text, "adminComment" text,
  "performedBy" text not null references public."user"("id"), "createdAt" timestamptz not null default now()
);
create table public."student_session_subject" (
  "id" text primary key default gen_random_uuid()::text,
  "student_id" text not null references public."student"("id") on delete cascade,
  "session_id" text, "subject_id" text not null references public."subject"("id") on delete restrict,
  "selection_source" text not null default 'CATALOGUE' check ("selection_source" in ('CATALOGUE', 'MANUAL')),
  "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now()
);
create unique index student_session_subject_unique on public."student_session_subject" ("student_id", coalesce("session_id", ''), "subject_id");
create index student_session_subject_student_session_idx on public."student_session_subject" ("student_id", "session_id");
create table public."teacher_subject_registration" (
  "id" text primary key default gen_random_uuid()::text,
  "teacher_id" text not null references public."teacher"("id") on delete cascade,
  "session_id" text, "subject_id" text not null references public."subject"("id") on delete restrict,
  "selection_source" text not null default 'CATALOGUE' check ("selection_source" in ('CATALOGUE', 'MANUAL')),
  "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now()
);
create unique index teacher_subject_registration_unique on public."teacher_subject_registration" ("teacher_id", coalesce("session_id", ''), "subject_id");
create index teacher_subject_registration_teacher_session_idx on public."teacher_subject_registration" ("teacher_id", "session_id");

-- Assessments, attendance and payments --------------------------------------
create table public."assessment" (
  "id" text primary key, "title" text not null, "description" text, "subjectId" text not null references public."subject"("id"),
  "termId" text not null references public."term"("id"), "createdBy" text not null references public."teacher"("id"),
  "duration" integer not null, "type" text not null, "status" text default 'draft', "accesscode" text,
  "passingScore" integer default 40, "totalPoints" integer default 100,
  "createdAt" timestamptz not null default now(), "updatedAt" timestamptz not null default now()
);
create table public."assessment_question" (
  "id" text primary key, "assessmentId" text not null references public."assessment"("id") on delete cascade,
  "questionText" text not null, "questionType" text not null, "options" jsonb, "correctAnswer" text,
  "points" integer default 1, "explanation" text, "order" integer not null
);
create table public."assessment_result" (
  "id" text primary key, "assessmentId" text not null references public."assessment"("id"),
  "studentId" text not null references public."student"("id"), "score" numeric(5,2) not null,
  "totalQuestions" integer not null, "correctAnswers" integer not null, "timeSpent" integer not null,
  "status" text not null, "gradedBy" text, "assessmentVideo" text, "warningCount" integer default 0,
  "proctorLogs" jsonb, "createdAt" timestamptz not null default now()
);
create table public."student_answer" (
  "id" text primary key, "assessmentResultId" text not null references public."assessment_result"("id") on delete cascade,
  "questionId" text not null references public."assessment_question"("id"), "answerText" text,
  "isCorrect" boolean, "pointsEarned" integer, "createdAt" timestamptz not null default now()
);
create table public."attendance" (
  "id" text primary key, "studentId" text not null references public."student"("id"),
  "classId" text not null references public."class"("id"), "date" date not null, "status" text not null,
  "remarks" text, "recordedBy" text, "recordedAt" timestamptz not null default now()
);
create table public."fee_structure" (
  "id" text primary key, "class" text not null, "department" text, "feeType" text not null,
  "amount" numeric(12,2) not null, "dueDate" date, "description" text, "isActive" boolean default true,
  "createdAt" timestamptz not null default now(), "updatedAt" timestamptz not null default now(),
  unique ("class", "department", "feeType")
);
create table public."payment" (
  "id" text primary key, "studentid" text not null references public."student"("id"), "parentid" text,
  "termid" text, "amount" numeric(12,2) not null, "feetype" text, "paymentmethod" text not null,
  "transactionreference" text unique, "korapayreference" text unique, "receipturl" text, "status" text default 'pending',
  "paymentdate" timestamptz, "paidat" timestamptz, "description" text,
  "createdat" timestamptz not null default now(), "updatedat" timestamptz not null default now()
);
create table public."payment_installment" (
  "id" text primary key, "paymentId" text not null references public."payment"("id"), "amount" numeric(12,2) not null,
  "dueDate" date not null, "paidAt" timestamptz, "status" text default 'pending', "installmentNumber" integer not null,
  "createdAt" timestamptz not null default now()
);

-- Communication, support and administration ---------------------------------
create table public."conversation" ("id" text primary key, "type" text not null, "name" text, "createdAt" timestamp default now(), "updatedAt" timestamp default now());
create table public."conversation_participant" (
  "id" text primary key, "conversationId" text not null references public."conversation"("id"),
  "userId" text not null references public."user"("id"), "lastReadAt" timestamp, "joinedAt" timestamp default now()
);
create table public."message" (
  "id" text primary key, "content" text not null, "senderId" text not null references public."user"("id") on delete cascade,
  "conversationId" text not null references public."conversation"("id") on delete cascade, "attachments" jsonb,
  "isRead" boolean default false, "isDeleted" boolean default false, "replyToId" text, "reactions" jsonb,
  "createdAt" timestamptz not null default now()
);
create table public."notification" (
  "id" text primary key, "userId" text not null references public."user"("id") on delete cascade,
  "title" text not null, "message" text not null, "type" text not null, "metadata" jsonb, "isRead" boolean default false,
  "actionUrl" text, "readAt" timestamptz, "createdAt" timestamptz not null default now()
);
create table public."dispute" (
  "id" text primary key, "ticketNumber" text not null unique, "title" text not null, "category" text not null,
  "priority" text not null, "status" text default 'OPEN', "description" text not null, "evidence" jsonb,
  "raisedById" text not null references public."user"("id") on delete cascade, "assignedToId" text,
  "relatedStudentId" text, "relatedPaymentId" text, "relatedAssessmentId" text, "resolution" text,
  "resolvedBy" text, "resolvedAt" timestamptz, "escalatedAt" timestamptz, "escalatedTo" text,
  "createdAt" timestamptz not null default now(), "updatedAt" timestamptz not null default now()
);
create table public."dispute_message" (
  "id" text primary key, "disputeId" text not null references public."dispute"("id"),
  "senderId" text not null references public."user"("id"), "message" text not null, "attachments" jsonb,
  "isInternal" boolean default false, "createdAt" timestamp default now()
);
create table public."support_ticket" (
  "id" text primary key, "ticketNumber" text not null unique, "title" text not null, "category" text not null,
  "priority" text not null, "status" text default 'OPEN', "description" text not null, "screenshots" jsonb,
  "userId" text not null references public."user"("id"), "assignedAgentId" text, "resolution" text,
  "satisfaction" text, "resolvedAt" timestamptz, "createdAt" timestamptz not null default now(), "updatedAt" timestamptz not null default now()
);
create table public."abac_policy" (
  "id" text primary key, "name" text not null unique, "description" text, "role" text not null, "resource" text not null,
  "action" text not null, "conditions" jsonb not null, "priority" integer default 0, "effect" text not null, "createdAt" timestamp default now()
);
create table public."audit_log" (
  "id" text primary key, "userId" text not null references public."user"("id") on delete cascade, "action" text not null,
  "resource" text not null, "resourceId" text, "details" jsonb, "ipAddress" text, "userAgent" text,
  "createdAt" timestamptz not null default now()
);
create table public."report_card" (
  "id" text primary key, "studentId" text not null, "studentName" text not null, "className" text not null,
  "marks" jsonb not null, "teacherRemarks" text, "status" text default 'PENDING', "adminFeedback" text,
  "term" text, "session" text, "endorsedAt" timestamp, "createdAt" timestamp default now()
);

-- Teacher finance, library and video learning --------------------------------
create table public."teacher_wallet" (
  "id" text primary key, "teacherId" text not null unique references public."teacher"("id"),
  "balance" numeric(12,2) default 0.00, "salaryAmount" numeric(12,2) default 150000.00,
  "salaryStatus" text default 'pending', "updatedAt" timestamptz not null default now()
);
create table public."teacher_request" (
  "id" text primary key, "teacherId" text not null references public."teacher"("id"), "type" text not null,
  "amount" numeric(12,2) not null, "details" text, "phoneNumber" text not null, "status" text default 'pending',
  "createdAt" timestamptz not null default now(), "updatedAt" timestamptz not null default now()
);
create table public."library_books" (
  "id" text primary key, "isbn" text unique, "title" text not null, "subtitle" text, "authors" jsonb, "author" text,
  "publisher" text, "publication_year" integer, "edition" text, "volume" text, "language" text default 'English',
  "pages" integer, "category" text, "sub_category" text, "description" text, "total_copies" integer default 1,
  "available_copies" integer default 1, "cover_image_url" text, "file_url" text, "location" text, "content" text,
  "subject" text, "class_level" text, "keywords" jsonb, "is_digital" boolean default false, "rating" numeric,
  "rating_count" integer default 0, "borrowed_count" integer default 0, "deleted_at" timestamp, "created_at" timestamp default now()
);
create index library_books_search_idx on public."library_books" using gin (to_tsvector('english', coalesce("title", '') || ' ' || coalesce("content", '') || ' ' || coalesce("author", '')));
create table public."book_import_logs" (
  "id" text primary key, "filename" text not null, "total_records" integer default 0, "inserted" integer default 0,
  "updated" integer default 0, "skipped" integer default 0, "failed" integer default 0, "errors" jsonb,
  "status" text default 'PENDING', "completed_at" timestamp, "created_at" timestamp default now()
);
create table public."study_video" (
  "id" text primary key, "title" text not null, "description" text not null, "subject" text not null,
  "class_name" text not null, "video_url" text not null, "duration_minutes" integer,
  "teacher_id" text not null references public."teacher"("id") on delete cascade, "is_published" boolean not null default true,
  "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now()
);
create table public."study_video_question" (
  "id" text primary key, "video_id" text not null references public."study_video"("id") on delete cascade,
  "student_id" text not null references public."student"("id") on delete cascade, "content" text not null,
  "created_at" timestamptz not null default now()
);
create table public."study_video_reply" (
  "id" text primary key, "question_id" text not null references public."study_video_question"("id") on delete cascade,
  "teacher_id" text not null references public."teacher"("id") on delete cascade, "content" text not null,
  "created_at" timestamptz not null default now()
);
create table public."video_sessions" (
  "id" text primary key, "title" text not null, "description" text, "teacherid" text not null references public."teacher"("id"),
  "classid" text, "subjectid" text, "starttime" timestamptz not null, "endtime" timestamptz,
  "meetingurl" text, "status" text default 'SCHEDULED', "createdat" timestamptz not null default now()
);

-- Subject catalogue, registration and profile synchronisation ----------------
create or replace function public.set_subject_timestamp() returns trigger language plpgsql as $$
begin new."updated_at" = now(); return new; end; $$;
create trigger student_session_subject_timestamp before update on public."student_session_subject" for each row execute function public.set_subject_timestamp();
create trigger teacher_subject_registration_timestamp before update on public."teacher_subject_registration" for each row execute function public.set_subject_timestamp();

create or replace function public.find_or_create_subject(p_name text, p_is_manual boolean default false)
returns text language plpgsql security definer set search_path = public as $$
declare v_name text := nullif(trim(p_name), ''); v_id text;
begin
  if v_name is null or char_length(v_name) > 100 then raise exception 'A subject name of 1-100 characters is required'; end if;
  select "id" into v_id from public."subject" where lower(trim("name")) = lower(v_name) limit 1;
  if v_id is not null then return v_id; end if;
  insert into public."subject" ("id", "name", "is_custom") values (gen_random_uuid()::text, v_name, p_is_manual)
  on conflict do nothing returning "id" into v_id;
  if v_id is null then select "id" into v_id from public."subject" where lower(trim("name")) = lower(v_name) limit 1; end if;
  return v_id;
end; $$;

create or replace function public.refresh_student_subject_cache(p_student_id text) returns void language plpgsql security definer set search_path = public as $$
declare v_session_id text;
begin
  select "sessionid" into v_session_id from public."student" where "id" = p_student_id;
  perform set_config('egia.subject_cache_refresh', 'on', true);
  update public."student" s set "subjectsdone" = coalesce((select jsonb_agg(x."name" order by lower(x."name"), x."name") from (
    select distinct subj."name" from public."student_session_subject" ss join public."subject" subj on subj."id" = ss."subject_id"
    where ss."student_id" = p_student_id and ss."session_id" is not distinct from v_session_id) x), '[]'::jsonb), "updatedat" = now()
  where s."id" = p_student_id;
  perform set_config('egia.subject_cache_refresh', 'off', true);
end; $$;
create or replace function public.refresh_teacher_subject_cache(p_teacher_id text) returns void language plpgsql security definer set search_path = public as $$
begin
  perform set_config('egia.subject_cache_refresh', 'on', true);
  update public."teacher" t set "teachingsubjects" = coalesce((select jsonb_agg(x."name" order by lower(x."name"), x."name") from (
    select distinct subj."name" from public."teacher_subject_registration" ts join public."subject" subj on subj."id" = ts."subject_id" where ts."teacher_id" = p_teacher_id) x), '[]'::jsonb), "updatedat" = now()
  where t."id" = p_teacher_id;
  perform set_config('egia.subject_cache_refresh', 'off', true);
end; $$;
create or replace function public.sync_student_subject_cache() returns trigger language plpgsql security definer set search_path = public as $$
declare v_name text; v_subject_id text;
begin
  if pg_trigger_depth() > 1 or coalesce(current_setting('egia.subject_cache_refresh', true), 'off') = 'on' then return new; end if;
  delete from public."student_session_subject" where "student_id" = new."id" and "session_id" is not distinct from new."sessionid";
  for v_name in select distinct trim(value #>> '{}') from jsonb_array_elements(coalesce(new."subjectsdone", '[]'::jsonb)) value where jsonb_typeof(value) = 'string' and nullif(trim(value #>> '{}'), '') is not null loop
    v_subject_id := public.find_or_create_subject(v_name, true);
    insert into public."student_session_subject" ("student_id", "session_id", "subject_id", "selection_source") values (new."id", new."sessionid", v_subject_id, 'MANUAL') on conflict do nothing;
  end loop; return new;
end; $$;
create or replace function public.sync_teacher_subject_cache() returns trigger language plpgsql security definer set search_path = public as $$
declare v_name text; v_subject_id text;
begin
  if pg_trigger_depth() > 1 or coalesce(current_setting('egia.subject_cache_refresh', true), 'off') = 'on' then return new; end if;
  delete from public."teacher_subject_registration" where "teacher_id" = new."id";
  for v_name in select distinct trim(value #>> '{}') from jsonb_array_elements(coalesce(new."teachingsubjects", '[]'::jsonb)) value where jsonb_typeof(value) = 'string' and nullif(trim(value #>> '{}'), '') is not null loop
    v_subject_id := public.find_or_create_subject(v_name, true);
    insert into public."teacher_subject_registration" ("teacher_id", "subject_id", "selection_source") values (new."id", v_subject_id, 'MANUAL') on conflict do nothing;
  end loop; return new;
end; $$;
create or replace function public.refresh_subject_profile_cache() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_table_name = 'student_session_subject' then perform public.refresh_student_subject_cache(case when tg_op = 'DELETE' then old."student_id" else new."student_id" end);
  else perform public.refresh_teacher_subject_cache(case when tg_op = 'DELETE' then old."teacher_id" else new."teacher_id" end); end if;
  if tg_op = 'DELETE' then return old; end if; return new;
end; $$;
create trigger student_subject_cache_to_rows after insert or update of "subjectsdone" on public."student" for each row execute function public.sync_student_subject_cache();
create trigger teacher_subject_cache_to_rows after insert or update of "teachingsubjects" on public."teacher" for each row execute function public.sync_teacher_subject_cache();
create trigger student_subject_rows_to_cache after insert or update or delete on public."student_session_subject" for each row execute function public.refresh_subject_profile_cache();
create trigger teacher_subject_rows_to_cache after insert or update or delete on public."teacher_subject_registration" for each row execute function public.refresh_subject_profile_cache();

create or replace function public.search_subject_catalogue(p_query text default '') returns table (id text, name text, code text, is_custom boolean)
language sql stable security invoker set search_path = public as $$
  select "id", "name", "code", "is_custom" from public."subject" where "is_active" and
  (nullif(trim(p_query), '') is null or "name" ilike '%' || trim(p_query) || '%') order by lower("name"), "name" limit 50;
$$;
create or replace function public.set_student_session_subjects(p_student_id text, p_session_id text, p_subject_ids text[] default '{}', p_manual_subject_names text[] default '{}')
returns void language plpgsql security definer set search_path = public as $$
declare v_name text; v_subject_id text;
begin
  if not exists (select 1 from public."student" where "id" = p_student_id) then raise exception 'Student not found'; end if;
  if exists (select 1 from unnest(coalesce(p_subject_ids, '{}')) as x(id) left join public."subject" s on s."id" = x.id where s."id" is null) then raise exception 'One or more selected subjects do not exist'; end if;
  delete from public."student_session_subject" where "student_id" = p_student_id and "session_id" is not distinct from p_session_id;
  insert into public."student_session_subject" ("student_id", "session_id", "subject_id", "selection_source") select p_student_id, p_session_id, x.id, 'CATALOGUE' from unnest(coalesce(p_subject_ids, '{}')) as x(id) on conflict do nothing;
  foreach v_name in array coalesce(p_manual_subject_names, '{}') loop v_subject_id := public.find_or_create_subject(v_name, true); insert into public."student_session_subject" ("student_id", "session_id", "subject_id", "selection_source") values (p_student_id, p_session_id, v_subject_id, 'MANUAL') on conflict do nothing; end loop;
  perform public.refresh_student_subject_cache(p_student_id);
end; $$;
create or replace function public.set_teacher_subjects(p_teacher_id text, p_session_id text default null, p_subject_ids text[] default '{}', p_manual_subject_names text[] default '{}')
returns void language plpgsql security definer set search_path = public as $$
declare v_name text; v_subject_id text;
begin
  if not exists (select 1 from public."teacher" where "id" = p_teacher_id) then raise exception 'Teacher not found'; end if;
  if exists (select 1 from unnest(coalesce(p_subject_ids, '{}')) as x(id) left join public."subject" s on s."id" = x.id where s."id" is null) then raise exception 'One or more selected subjects do not exist'; end if;
  delete from public."teacher_subject_registration" where "teacher_id" = p_teacher_id and "session_id" is not distinct from p_session_id;
  insert into public."teacher_subject_registration" ("teacher_id", "session_id", "subject_id", "selection_source") select p_teacher_id, p_session_id, x.id, 'CATALOGUE' from unnest(coalesce(p_subject_ids, '{}')) as x(id) on conflict do nothing;
  foreach v_name in array coalesce(p_manual_subject_names, '{}') loop v_subject_id := public.find_or_create_subject(v_name, true); insert into public."teacher_subject_registration" ("teacher_id", "session_id", "subject_id", "selection_source") values (p_teacher_id, p_session_id, v_subject_id, 'MANUAL') on conflict do nothing; end loop;
  perform public.refresh_teacher_subject_cache(p_teacher_id);
end; $$;
create or replace view public."student_subject_profile" with (security_invoker = true) as
select ss."student_id", s."admissionnumber", s."firstname", s."lastname", s."class", subj."name" as "subject_name", s."userid", ss."session_id", subj."id" as "subject_id", ss."selection_source"
from public."student_session_subject" ss join public."student" s on s."id" = ss."student_id" join public."subject" subj on subj."id" = ss."subject_id";
create or replace view public."teacher_subject_profile" with (security_invoker = true) as
select ts."teacher_id", t."staffcode", t."firstname", t."lastname", subj."name" as "subject_name", t."userid", ts."session_id", subj."id" as "subject_id", ts."selection_source"
from public."teacher_subject_registration" ts join public."teacher" t on t."id" = ts."teacher_id" join public."subject" subj on subj."id" = ts."subject_id";

alter table public."subject" enable row level security;
create policy subject_catalogue_read on public."subject" for select using ("is_active" = true);
revoke all on function public.find_or_create_subject(text, boolean) from public;
revoke all on function public.set_student_session_subjects(text, text, text[], text[]) from public;
revoke all on function public.set_teacher_subjects(text, text, text[], text[]) from public;
grant execute on function public.find_or_create_subject(text, boolean) to service_role;
grant execute on function public.set_student_session_subjects(text, text, text[], text[]) to service_role;
grant execute on function public.set_teacher_subjects(text, text, text[], text[]) to service_role;

insert into public."subject" ("id", "name", "code") values
  (gen_random_uuid()::text, 'Mathematics', 'MATH'),
  (gen_random_uuid()::text, 'English Language', 'ENG'),
  (gen_random_uuid()::text, 'Basic Science', 'BSC');

-- Supplemental school operations schema (legacy/plural API) -----------------
-- These tables preserve the full operations model supplied by the school.
-- Type names are prefixed with academy_ because public.user_role is already an
-- application table (PostgreSQL tables and types cannot share that name).
create type public.academy_user_role as enum ('ADMIN','TEACHER','PARENT','STUDENT');
create type public.academy_term_type as enum ('FIRST','SECOND','THIRD');
create type public.academy_assessment_type as enum ('WEEKEND_QUIZ','MID_TERM','EXAMINATION');
create type public.academy_payment_status as enum ('PENDING','COMPLETED','FAILED','REFUNDED','PARTIAL');
create type public.academy_dispute_status as enum ('OPEN','UNDER_REVIEW','INVESTIGATING','AWAITING_RESPONSE','MEDIATION','ESCALATED','RESOLVED','DISMISSED','APPEALED');
create type public.academy_dispute_priority as enum ('LOW','MEDIUM','HIGH','URGENT');
create type public.academy_dispute_category as enum ('PAYMENT_DISCREPANCY','RESULT_DISPUTE','ATTENDANCE_DISPUTE','TEACHER_CONDUCT','STUDENT_CONDUCT','BULLYING_COMPLAINT','FACILITY_COMPLAINT','TRANSPORT_ISSUE','OTHER');
create type public.academy_support_category as enum ('TECHNICAL_ISSUE','LOGIN_PROBLEM','CBT_ISSUE','PAYMENT_ERROR','RESULT_ACCESS','MATERIAL_ACCESS','FEATURE_REQUEST','BUG_REPORT','ACCOUNT_MANAGEMENT','OTHER');
create type public.academy_attendance_status as enum ('PRESENT','ABSENT','LATE','EXCUSED');
create type public.academy_message_type as enum ('INDIVIDUAL','GROUP','BROADCAST','ANNOUNCEMENT');
create type public.academy_cbt_status as enum ('NOT_STARTED','IN_PROGRESS','SUBMITTED','GRADED','EXPIRED');
create type public.academy_question_type as enum ('MULTIPLE_CHOICE_SINGLE','MULTIPLE_CHOICE_MULTIPLE','FILL_IN_THE_BLANK','TRUE_FALSE','MATCHING','ORDERING','NUMERIC','SHORT_ANSWER');
create type public.academy_book_status as enum ('AVAILABLE','BORROWED','LOST','DAMAGED','RESTORING');

create table public.users (
  id uuid primary key default gen_random_uuid(), email citext not null unique, password_hash varchar(255) not null,
  full_name varchar(255) not null, role public.academy_user_role not null, phone varchar(20), avatar_url text,
  is_active boolean default true, is_verified boolean default false, email_verified_at timestamp, last_login_at timestamp,
  last_login_ip inet, two_factor_secret varchar(255), two_factor_enabled boolean default false,
  password_reset_token varchar(255), password_reset_expires timestamp, remember_token varchar(100),
  created_at timestamp default current_timestamp, updated_at timestamp default current_timestamp, deleted_at timestamp
);
create table public.students (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id) on delete cascade,
  admission_number varchar(20) unique not null, first_name varchar(100) not null, last_name varchar(100) not null,
  middle_name varchar(100), date_of_birth date, gender varchar(10), blood_group varchar(5), religion varchar(50),
  nationality varchar(50) default 'Nigerian', state_of_origin varchar(50), lga varchar(50), home_address text,
  current_class varchar(20) not null, class_arm varchar(5), admission_date date default current_date,
  graduation_date date, is_graduated boolean default false, current_session varchar(20), profile_photo text,
  emergency_contact_name varchar(255), emergency_contact_phone varchar(20), medical_info text,
  created_at timestamp default current_timestamp, updated_at timestamp default current_timestamp, deleted_at timestamp
);
create table public.teachers (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id) on delete cascade,
  staff_id varchar(50) unique not null, first_name varchar(100) not null, last_name varchar(100) not null,
  qualification varchar(255), specialization varchar(100), date_of_employment date, date_of_birth date, gender varchar(10),
  phone_alternative varchar(20), home_address text, is_class_teacher boolean default false, class_teacher_of varchar(20),
  created_at timestamp default current_timestamp, updated_at timestamp default current_timestamp, deleted_at timestamp
);
create table public.parents (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id) on delete cascade,
  occupation varchar(255), home_address text, office_address text, emergency_contact_name varchar(255),
  emergency_contact_phone varchar(20), created_at timestamp default current_timestamp, updated_at timestamp default current_timestamp, deleted_at timestamp
);
create table public.parent_students (
  id uuid primary key default gen_random_uuid(), parent_id uuid not null references public.parents(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade, is_guardian boolean default false,
  relationship varchar(50), created_at timestamp default current_timestamp, unique(parent_id, student_id)
);
create table public.admins (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id) on delete cascade,
  admin_code varchar(50) unique not null, department varchar(100), position varchar(100),
  created_at timestamp default current_timestamp, updated_at timestamp default current_timestamp, deleted_at timestamp
);
create table public.academic_sessions (
  id uuid primary key default gen_random_uuid(), name varchar(50) not null, start_date date not null, end_date date not null,
  is_current boolean default false, is_active boolean default true, created_at timestamp default current_timestamp, updated_at timestamp default current_timestamp
);
create table public.terms (
  id uuid primary key default gen_random_uuid(), session_id uuid not null references public.academic_sessions(id) on delete cascade,
  term_name public.academy_term_type not null, start_date date not null, end_date date not null, is_current boolean default false,
  is_active boolean default true, created_at timestamp default current_timestamp, updated_at timestamp default current_timestamp, unique(session_id, term_name)
);
create table public.classes (
  id uuid primary key default gen_random_uuid(), name varchar(20) not null, level integer, category varchar(20), sort_order integer,
  is_active boolean default true, created_at timestamp default current_timestamp, updated_at timestamp default current_timestamp
);
create table public.class_arms (
  id uuid primary key default gen_random_uuid(), class_id uuid not null references public.classes(id) on delete cascade,
  arm_name varchar(5) not null, capacity integer default 40, class_teacher_id uuid references public.teachers(id),
  is_active boolean default true, created_at timestamp default current_timestamp, unique(class_id, arm_name)
);
create table public.student_class_assignments (
  id uuid primary key default gen_random_uuid(), student_id uuid not null references public.students(id) on delete cascade,
  class_arm_id uuid not null references public.class_arms(id) on delete cascade, session_id uuid not null references public.academic_sessions(id),
  term_id uuid not null references public.terms(id), is_current boolean default true, assigned_date date default current_date,
  promoted_from uuid, created_at timestamp default current_timestamp
);
create table public.subjects (
  id uuid primary key default gen_random_uuid(), name varchar(100) not null, code varchar(20) unique not null, description text,
  category varchar(50), education_level varchar(20), department varchar(50), is_active boolean default true,
  created_at timestamp default current_timestamp, updated_at timestamp default current_timestamp
);
create table public.class_subjects (
  id uuid primary key default gen_random_uuid(), class_arm_id uuid not null references public.class_arms(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade, teacher_id uuid not null references public.teachers(id),
  is_compulsory boolean default true, weekly_hours integer default 4, created_at timestamp default current_timestamp, unique(class_arm_id, subject_id)
);
create table public.timetables (
  id uuid primary key default gen_random_uuid(), class_arm_id uuid not null references public.class_arms(id) on delete cascade,
  subject_id uuid not null references public.subjects(id), teacher_id uuid not null references public.teachers(id), day_of_week integer not null,
  start_time time not null, end_time time not null, session_id uuid not null references public.academic_sessions(id),
  term_id uuid not null references public.terms(id), created_at timestamp default current_timestamp, updated_at timestamp default current_timestamp
);
create table public.assessments (
  id uuid primary key default gen_random_uuid(), title varchar(255) not null, description text, type public.academy_assessment_type not null,
  term_id uuid not null references public.terms(id), session_id uuid not null references public.academic_sessions(id),
  subject_id uuid not null references public.subjects(id), class_arm_id uuid not null references public.class_arms(id),
  teacher_id uuid not null references public.teachers(id), total_score numeric(10,2) not null, passing_score numeric(10,2), duration_minutes integer,
  is_published boolean default false, published_at timestamp, due_date timestamp, instructions text,
  created_at timestamp default current_timestamp, updated_at timestamp default current_timestamp, deleted_at timestamp
);
create table public.questions (
  id uuid primary key default gen_random_uuid(), assessment_id uuid not null references public.assessments(id) on delete cascade,
  question_text text not null, question_type public.academy_question_type not null, options jsonb, correct_answer jsonb not null,
  explanation text, points numeric(5,2) default 1, order_number integer, image_url text, metadata jsonb,
  created_at timestamp default current_timestamp, updated_at timestamp default current_timestamp
);
create table public.fitb_answers (
  id uuid primary key default gen_random_uuid(), question_id uuid not null references public.questions(id) on delete cascade,
  blank_position integer not null, correct_answer text not null, case_sensitive boolean default false, partial_credit boolean default false,
  created_at timestamp default current_timestamp
);
create table public.results (
  id uuid primary key default gen_random_uuid(), student_id uuid not null references public.students(id) on delete cascade,
  assessment_id uuid not null references public.assessments(id) on delete cascade, score numeric(10,2), percentage numeric(5,2), grade varchar(5),
  answers jsonb, feedback text, started_at timestamp, submitted_at timestamp, is_graded boolean default false, graded_at timestamp,
  graded_by uuid references public.users(id), created_at timestamp default current_timestamp, updated_at timestamp default current_timestamp,
  deleted_at timestamp, unique(student_id, assessment_id)
);
create table public.cbt_sessions (
  id uuid primary key default gen_random_uuid(), assessment_id uuid not null references public.assessments(id),
  class_arm_id uuid not null references public.class_arms(id), start_time timestamp not null, end_time timestamp not null,
  duration_minutes integer not null, allow_navigation boolean default false, show_results boolean default true,
  randomize_questions boolean default false, randomize_options boolean default false, is_active boolean default false,
  ip_restrictions text[], proctoring_enabled boolean default false, created_at timestamp default current_timestamp, updated_at timestamp default current_timestamp
);
create table public.cbt_attempts (
  id uuid primary key default gen_random_uuid(), session_id uuid not null references public.cbt_sessions(id),
  student_id uuid not null references public.students(id), status public.academy_cbt_status default 'NOT_STARTED', answers jsonb,
  score numeric(10,2), percentage numeric(5,2), started_at timestamp, submitted_at timestamp, time_spent integer,
  device_info jsonb, ip_address inet, tab_switch_count integer default 0, screenshot_taken boolean default false,
  created_at timestamp default current_timestamp, updated_at timestamp default current_timestamp, unique(session_id, student_id)
);
create table public.fee_structures (
  id uuid primary key default gen_random_uuid(), class_arm_id uuid not null references public.class_arms(id), term_id uuid not null references public.terms(id),
  fee_type varchar(100) not null, amount numeric(15,2) not null, is_mandatory boolean default true, due_date date, late_fee numeric(15,2),
  description text, is_active boolean default true, created_at timestamp default current_timestamp, updated_at timestamp default current_timestamp, deleted_at timestamp
);
create table public.payments (
  id uuid primary key default gen_random_uuid(), parent_id uuid not null references public.parents(id), student_id uuid not null references public.students(id),
  fee_structure_id uuid references public.fee_structures(id), amount numeric(15,2) not null, amount_paid numeric(15,2), balance numeric(15,2),
  reference varchar(100) unique not null, korapay_transaction_id varchar(100), korapay_payment_link text,
  status public.academy_payment_status default 'PENDING', payment_method varchar(50), payment_date timestamp, currency varchar(3) default 'NGN',
  metadata jsonb, receipt_url text, notes text, created_at timestamp default current_timestamp, updated_at timestamp default current_timestamp, deleted_at timestamp
);
create table public.payment_installments (
  id uuid primary key default gen_random_uuid(), payment_id uuid not null references public.payments(id), due_date date not null,
  amount_due numeric(15,2) not null, amount_paid numeric(15,2) default 0, installment_number integer not null,
  status public.academy_payment_status default 'PENDING', paid_at timestamp, created_at timestamp default current_timestamp, updated_at timestamp default current_timestamp
);
create table public.payment_webhook_logs (
  id uuid primary key default gen_random_uuid(), transaction_id varchar(100), event_type varchar(100), payload jsonb,
  processed boolean default false, error_message text, created_at timestamp default current_timestamp
);
create table public.conversations (
  id uuid primary key default gen_random_uuid(), type public.academy_message_type not null, title varchar(255),
  created_by uuid references public.users(id), created_at timestamp default current_timestamp, updated_at timestamp default current_timestamp
);
create table public.conversation_participants (
  id uuid primary key default gen_random_uuid(), conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade, last_read_at timestamp, joined_at timestamp default current_timestamp,
  unique(conversation_id, user_id)
);
create table public.messages (
  id uuid primary key default gen_random_uuid(), conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.users(id), content text not null, attachments jsonb, is_read boolean default false,
  is_deleted boolean default false, reply_to_id uuid references public.messages(id), reactions jsonb, metadata jsonb,
  created_at timestamp default current_timestamp, deleted_at timestamp
);
create table public.notifications (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id) on delete cascade,
  title varchar(255) not null, message text not null, type varchar(50), data jsonb, is_read boolean default false,
  read_at timestamp, created_at timestamp default current_timestamp
);
create table public.announcements (
  id uuid primary key default gen_random_uuid(), title varchar(255) not null, content text not null,
  author_id uuid not null references public.users(id), target_roles public.academy_user_role[], target_classes uuid[],
  is_published boolean default true, published_at timestamp, expires_at timestamp, pinned boolean default false,
  attachments jsonb, created_at timestamp default current_timestamp, updated_at timestamp default current_timestamp
);
create table public.disputes (
  id uuid primary key default gen_random_uuid(), ticket_number varchar(20) unique not null, title varchar(255) not null,
  category public.academy_dispute_category not null, priority public.academy_dispute_priority default 'MEDIUM',
  status public.academy_dispute_status default 'OPEN', description text not null, evidence jsonb,
  raised_by_id uuid not null references public.users(id), assigned_to_id uuid references public.users(id),
  related_student_id uuid references public.students(id), related_payment_id uuid references public.payments(id),
  related_assessment_id uuid references public.assessments(id), resolution text, resolved_at timestamp, escalated_at timestamp,
  escalated_to varchar(100), created_at timestamp default current_timestamp, updated_at timestamp default current_timestamp, deleted_at timestamp
);
create table public.dispute_messages (
  id uuid primary key default gen_random_uuid(), dispute_id uuid not null references public.disputes(id) on delete cascade,
  sender_id uuid not null references public.users(id), message text not null, attachments jsonb, is_internal boolean default false,
  created_at timestamp default current_timestamp
);
create table public.support_tickets (
  id uuid primary key default gen_random_uuid(), ticket_number varchar(20) unique not null, title varchar(255) not null,
  category public.academy_support_category not null, priority public.academy_dispute_priority default 'MEDIUM', status varchar(50) default 'OPEN',
  description text not null, screenshots jsonb, user_id uuid not null references public.users(id), assigned_agent_id uuid references public.users(id),
  resolution text, satisfaction_rating integer check (satisfaction_rating between 1 and 5), resolved_at timestamp,
  created_at timestamp default current_timestamp, updated_at timestamp default current_timestamp, deleted_at timestamp
);
create table public.support_ticket_replies (
  id uuid primary key default gen_random_uuid(), ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  user_id uuid not null references public.users(id), message text not null, attachments jsonb, created_at timestamp default current_timestamp
);
create table public.attendance_records (
  id uuid primary key default gen_random_uuid(), student_id uuid not null references public.students(id),
  class_arm_id uuid not null references public.class_arms(id), subject_id uuid references public.subjects(id), date date not null,
  status public.academy_attendance_status not null, time_in time, time_out time, marked_by_id uuid not null references public.users(id),
  note text, created_at timestamp default current_timestamp, updated_at timestamp default current_timestamp, unique nulls not distinct(student_id, date, subject_id)
);
create table public.books (
  id uuid primary key default gen_random_uuid(), isbn varchar(20) unique, title varchar(500) not null, subtitle varchar(500),
  authors text[] not null, publisher varchar(255), publication_year integer, edition varchar(50), volume varchar(50), language varchar(50) default 'English',
  pages integer, category varchar(100), sub_category varchar(100), keywords text[], description text, table_of_contents jsonb,
  cover_image_url text, file_url text, physical_location varchar(255), total_copies integer default 1, available_copies integer default 1,
  borrowed_count integer default 0, rating numeric(3,2) default 0, rating_count integer default 0, status public.academy_book_status default 'AVAILABLE',
  is_digital boolean default false, is_published boolean default true, subject_id uuid references public.subjects(id), class_level varchar(20),
  search_vector tsvector, created_at timestamp default current_timestamp, updated_at timestamp default current_timestamp, deleted_at timestamp
);
create index books_title_trgm_idx on public.books using gin (title gin_trgm_ops);
create index books_search_vector_idx on public.books using gin (search_vector);
create table public.book_categories (
  id uuid primary key default gen_random_uuid(), name varchar(100) not null, parent_id uuid references public.book_categories(id),
  description text, icon varchar(50), search_boost integer default 1, created_at timestamp default current_timestamp, updated_at timestamp default current_timestamp
);
create table public.book_tags (id uuid primary key default gen_random_uuid(), name varchar(50) unique not null, created_at timestamp default current_timestamp);
create table public.book_tag_relations (book_id uuid not null references public.books(id) on delete cascade, tag_id uuid not null references public.book_tags(id) on delete cascade, primary key(book_id, tag_id));
create table public.book_borrowings (
  id uuid primary key default gen_random_uuid(), book_id uuid not null references public.books(id), student_id uuid not null references public.students(id),
  borrowed_at timestamp default current_timestamp, due_date date not null, returned_at timestamp, status varchar(20) default 'BORROWED',
  fine_amount numeric(10,2) default 0, extension_count integer default 0, last_extension_at timestamp, notes text,
  created_at timestamp default current_timestamp, updated_at timestamp default current_timestamp
);
create table public.book_requests (
  id uuid primary key default gen_random_uuid(), book_id uuid references public.books(id), student_id uuid not null references public.students(id),
  title varchar(500) not null, author varchar(255), isbn varchar(20), reason text, priority varchar(20) default 'MEDIUM',
  status varchar(20) default 'PENDING', admin_notes text, created_at timestamp default current_timestamp, updated_at timestamp default current_timestamp
);
create table public.reading_history (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id), book_id uuid not null references public.books(id),
  pages_read integer default 0, last_read_at timestamp default current_timestamp, reading_time integer default 0, bookmark_page integer,
  completed boolean default false, rating integer check(rating between 1 and 5), review text,
  created_at timestamp default current_timestamp, updated_at timestamp default current_timestamp, unique(user_id, book_id)
);
create table public.book_reviews (
  id uuid primary key default gen_random_uuid(), book_id uuid not null references public.books(id), user_id uuid not null references public.users(id),
  rating integer not null check(rating between 1 and 5), review text, helpful_count integer default 0,
  created_at timestamp default current_timestamp, updated_at timestamp default current_timestamp
);
create table public.search_logs (
  id uuid primary key default gen_random_uuid(), user_id uuid references public.users(id), query text not null, results_count integer,
  filters jsonb, ip_address inet, user_agent text, created_at timestamp default current_timestamp
);
-- App uses a text-id import log; this keeps that contract while adding the
-- legacy audit columns rather than creating a conflicting second table.
alter table public."book_import_logs" add column "performed_by" uuid references public.users(id);
create table public.book_favorites (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id), book_id uuid not null references public.books(id),
  created_at timestamp default current_timestamp, unique(user_id, book_id)
);
create table public.learning_materials (
  id uuid primary key default gen_random_uuid(), title varchar(255) not null, description text, type varchar(50),
  subject_id uuid references public.subjects(id), class_arm_id uuid references public.class_arms(id), teacher_id uuid not null references public.teachers(id),
  file_url text, duration_minutes integer, is_published boolean default false, uploaded_at timestamp default current_timestamp,
  created_at timestamp default current_timestamp, updated_at timestamp default current_timestamp
);
create table public.disciplinary_records (
  id uuid primary key default gen_random_uuid(), student_id uuid not null references public.students(id), reported_by_id uuid not null references public.users(id),
  incident_date date not null, incident_type varchar(100), description text not null, sanction varchar(255), status varchar(50) default 'PENDING',
  resolved_at timestamp, notes text, created_at timestamp default current_timestamp, updated_at timestamp default current_timestamp
);
create table public.permissions (id uuid primary key default gen_random_uuid(), name varchar(100) unique not null, resource varchar(100) not null, action varchar(50) not null, description text, created_at timestamp default current_timestamp);
create table public.role_permissions (id uuid primary key default gen_random_uuid(), role public.academy_user_role not null, permission_id uuid not null references public.permissions(id), created_at timestamp default current_timestamp, unique(role, permission_id));
create table public.user_permissions (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id), permission_id uuid not null references public.permissions(id), granted boolean default true, expires_at timestamp, created_at timestamp default current_timestamp, unique(user_id, permission_id));
create table public.abac_policies (
  id uuid primary key default gen_random_uuid(), name varchar(100) unique not null, description text, role public.academy_user_role,
  resource varchar(100) not null, action varchar(50) not null, conditions jsonb, priority integer default 0, effect varchar(10) default 'ALLOW',
  is_active boolean default true, created_at timestamp default current_timestamp, updated_at timestamp default current_timestamp
);
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(), user_id uuid references public.users(id), action varchar(100) not null, resource varchar(100) not null,
  resource_id uuid, old_values jsonb, new_values jsonb, ip_address inet, user_agent text, created_at timestamp default current_timestamp
);
create table public.login_history (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id), login_at timestamp default current_timestamp,
  ip_address inet, user_agent text, success boolean default true, failure_reason text
);
create table public.system_settings (
  id uuid primary key default gen_random_uuid(), key varchar(100) unique not null, value text, type varchar(50), description text, updated_at timestamp default current_timestamp
);

-- The app's text-ID promotion_history remains canonical.  The following
-- compatibility columns allow the supplied UUID academic model to record the
-- same event without a second table of the same name.
alter table public."promotion_history"
  add column "legacy_student_id" uuid references public.students(id),
  add column "from_arm" varchar(5), add column "to_arm" varchar(5),
  add column "legacy_session_id" uuid references public.academic_sessions(id),
  add column "legacy_term_id" uuid references public.terms(id),
  add column "approved_by" uuid references public.users(id);

create or replace function public.update_legacy_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = current_timestamp; return new; end; $$;
create trigger users_updated_at before update on public.users for each row execute function public.update_legacy_updated_at();
create trigger students_updated_at before update on public.students for each row execute function public.update_legacy_updated_at();
create trigger teachers_updated_at before update on public.teachers for each row execute function public.update_legacy_updated_at();
create trigger books_updated_at before update on public.books for each row execute function public.update_legacy_updated_at();
create or replace function public.book_search_vector_update() returns trigger language plpgsql as $$
begin
  new.search_vector := setweight(to_tsvector('english', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.subtitle, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(array_to_string(new.authors, ' '), '')), 'B') ||
    setweight(to_tsvector('english', coalesce(new.description, '')), 'D');
  return new;
end; $$;
create trigger books_search_vector before insert or update on public.books for each row execute function public.book_search_vector_update();

-- Clean-install seed data ----------------------------------------------------
insert into public.classes (name, level, category, sort_order) values
  ('Primary 3', 3, 'PRIMARY', 1), ('Primary 4', 4, 'PRIMARY', 2),
  ('Primary 5', 5, 'PRIMARY', 3), ('Primary 6', 6, 'PRIMARY', 4),
  ('JSS1', 1, 'JUNIOR', 5), ('JSS2', 2, 'JUNIOR', 6), ('JSS3', 3, 'JUNIOR', 7),
  ('SSS1', 1, 'SENIOR', 8), ('SSS2', 2, 'SENIOR', 9), ('SSS3', 3, 'SENIOR', 10);
insert into public.subjects (name, code, category, education_level, department, description) values
  ('Mathematics', 'MATH-PRI', 'CORE', 'PRIMARY', 'GENERAL', 'Mathematics for Primary School'),
  ('English Studies', 'ENG-PRI', 'CORE', 'PRIMARY', 'GENERAL', 'English Language for Primary School'),
  ('Basic Science', 'BSC-JSS', 'CORE', 'JUNIOR', 'GENERAL', 'Basic Science for Junior Secondary'),
  ('Business Studies', 'BUS-JSS', 'CORE', 'JUNIOR', 'GENERAL', 'Business Studies for Junior Secondary'),
  ('Mathematics', 'MATH-SSS', 'CORE', 'SENIOR', 'GENERAL', 'Mathematics for Senior Secondary'),
  ('English Language', 'ENG-SSS', 'CORE', 'SENIOR', 'GENERAL', 'English Language for Senior Secondary'),
  ('Physics', 'PHY-SSS', 'ELECTIVE', 'SENIOR', 'SCIENCE', 'Physics for Science Students'),
  ('Chemistry', 'CHEM-SSS', 'ELECTIVE', 'SENIOR', 'SCIENCE', 'Chemistry for Science Students'),
  ('Biology', 'BIO-SSS', 'ELECTIVE', 'SENIOR', 'SCIENCE', 'Biology for Science Students'),
  ('Government', 'GOV-SSS', 'ELECTIVE', 'SENIOR', 'ARTS', 'Government for Arts Students'),
  ('Literature in English', 'LIT-SSS', 'ELECTIVE', 'SENIOR', 'ARTS', 'Literature for Arts Students'),
  ('Commerce', 'COMM-SSS', 'ELECTIVE', 'SENIOR', 'COMMERCIAL', 'Commerce'),
  ('Financial Accounting', 'ACC-SSS', 'ELECTIVE', 'SENIOR', 'COMMERCIAL', 'Financial Accounting');
insert into public.permissions (name, resource, action, description) values
  ('manage_users', 'user', 'manage', 'Full user management access'),
  ('manage_assessments', 'assessment', 'manage', 'Full assessment management'),
  ('manage_payments', 'payment', 'manage', 'Manage payments'),
  ('manage_disputes', 'dispute', 'manage', 'Manage disputes'),
  ('manage_settings', 'setting', 'manage', 'Manage school settings');
insert into public.role_permissions (role, permission_id)
select 'ADMIN', id from public.permissions;
insert into public.system_settings (key, value, type, description) values
  ('school_name', 'EL GOODNEWS INT''L ACADEMY', 'string', 'School display name'),
  ('school_address', 'Lagos, Nigeria', 'string', 'School address'),
  ('school_phone', '+234-800-ELGOOD', 'string', 'School phone number'),
  ('admission_number_prefix', 'GOD', 'string', 'Admission number prefix'),
  ('cbt_default_duration', '60', 'integer', 'Default CBT duration in minutes'),
  ('enable_cbt_proctoring', 'true', 'boolean', 'Enable CBT proctoring features');
insert into public.book_categories (name, search_boost) values
  ('Mathematics', 2), ('English Literature', 2), ('Science', 2), ('History', 1),
  ('Technology', 2), ('Arts', 1), ('Commerce', 1), ('Business Studies', 1);

create view public.current_students_view as
select s.id, s.admission_number, s.first_name, s.last_name, s.current_class, s.class_arm,
       c.name as class_name, ca.arm_name, u.email, u.phone, s.created_at
from public.students s join public.users u on u.id = s.user_id
left join public.classes c on c.name = s.current_class
left join public.class_arms ca on ca.class_id = c.id and ca.arm_name = s.class_arm
where not s.is_graduated and s.deleted_at is null and u.deleted_at is null and u.is_active;
create view public.student_results_view as
select r.id, s.admission_number, s.first_name, s.last_name, a.title as assessment_title,
       a.type as assessment_type, sub.name as subject, r.score, r.percentage, r.grade, r.submitted_at,
       t.term_name, ac.name as session_name
from public.results r join public.students s on s.id = r.student_id
join public.assessments a on a.id = r.assessment_id join public.subjects sub on sub.id = a.subject_id
join public.terms t on t.id = a.term_id join public.academic_sessions ac on ac.id = t.session_id
where s.deleted_at is null and a.deleted_at is null and r.deleted_at is null;
create view public.payment_summary_view as
select p.id, s.admission_number, s.first_name || ' ' || s.last_name as student_name, p.amount,
       p.amount_paid, p.balance, p.status, p.payment_date, p.reference, fs.fee_type
from public.payments p join public.students s on s.id = p.student_id
left join public.fee_structures fs on fs.id = p.fee_structure_id
where s.deleted_at is null and p.deleted_at is null;
-- =====================================================
-- EL GOODNEWS INT'L ACADEMY - Canonical Supabase Schema
-- Clean install script - Drops everything and recreates
-- =====================================================

-- =====================================================
-- DROP ALL EXISTING OBJECTS
-- =====================================================

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
drop table if exists public.notifications cascade;
drop table if exists public.messages cascade;
drop table if exists public.conversation_participants cascade;
drop table if exists public.conversations cascade;
drop table if exists public.payment_webhook_logs cascade;
drop table if exists public.payment_installments cascade;
drop table if exists public.payments cascade;
drop table if exists public.fee_structures cascade;
drop table if exists public.cbt_attempts cascade;
drop table if exists public.cbt_sessions cascade;
drop table if exists public.results cascade;
drop table if exists public.fitb_answers cascade;
drop table if exists public.questions cascade;
drop table if exists public.assessments cascade;
drop table if exists public.timetables cascade;
drop table if exists public.class_subjects cascade;
drop table if exists public.subjects cascade;
drop table if exists public.student_class_assignments cascade;
drop table if exists public.class_arms cascade;
drop table if exists public.classes cascade;
drop table if exists public.terms cascade;
drop table if exists public.academic_sessions cascade;
drop table if exists public.admins cascade;
drop table if exists public.parent_students cascade;
drop table if exists public.parents cascade;
drop table if exists public.teachers cascade;
drop table if exists public.students cascade;
drop table if exists public.users cascade;
drop table if exists public.promotion_history cascade;
drop table if exists public.permissions cascade;
drop table if exists public.role_permissions cascade;
drop table if exists public.user_permissions cascade;
drop table if exists public.abac_policies cascade;
drop table if exists public.audit_logs cascade;
drop table if exists public.login_history cascade;
drop table if exists public.system_settings cascade;
drop table if exists public.learning_materials cascade;
drop table if exists public.disciplinary_records cascade;

-- Drop schema and recreate
drop schema if exists public cascade;
create schema public;
grant usage on schema public to postgres, anon, authenticated, service_role;

-- =====================================================
-- ENABLE EXTENSIONS
-- =====================================================

create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";
create extension if not exists citext;
create extension if not exists pg_trgm;
create extension if not exists unaccent;

-- =====================================================
-- ENUM TYPES
-- =====================================================

create type public.academy_user_role as enum ('ADMIN','TEACHER','PARENT','STUDENT');
create type public.academy_term_type as enum ('FIRST','SECOND','THIRD');
create type public.academy_assessment_type as enum ('WEEKEND_QUIZ','MID_TERM','EXAMINATION');
create type public.academy_payment_status as enum ('PENDING','COMPLETED','FAILED','REFUNDED','PARTIAL');
create type public.academy_dispute_status as enum ('OPEN','UNDER_REVIEW','INVESTIGATING','AWAITING_RESPONSE','MEDIATION','ESCALATED','RESOLVED','DISMISSED','APPEALED');
create type public.academy_dispute_priority as enum ('LOW','MEDIUM','HIGH','URGENT');
create type public.academy_dispute_category as enum ('PAYMENT_DISCREPANCY','RESULT_DISPUTE','ATTENDANCE_DISPUTE','TEACHER_CONDUCT','STUDENT_CONDUCT','BULLYING_COMPLAINT','FACILITY_COMPLAINT','TRANSPORT_ISSUE','OTHER');
create type public.academy_support_category as enum ('TECHNICAL_ISSUE','LOGIN_PROBLEM','CBT_ISSUE','PAYMENT_ERROR','RESULT_ACCESS','MATERIAL_ACCESS','FEATURE_REQUEST','BUG_REPORT','ACCOUNT_MANAGEMENT','OTHER');
create type public.academy_attendance_status as enum ('PRESENT','ABSENT','LATE','EXCUSED');
create type public.academy_message_type as enum ('INDIVIDUAL','GROUP','BROADCAST','ANNOUNCEMENT');
create type public.academy_cbt_status as enum ('NOT_STARTED','IN_PROGRESS','SUBMITTED','GRADED','EXPIRED');
create type public.academy_question_type as enum ('MULTIPLE_CHOICE_SINGLE','MULTIPLE_CHOICE_MULTIPLE','FILL_IN_THE_BLANK','TRUE_FALSE','MATCHING','ORDERING','NUMERIC','SHORT_ANSWER');
create type public.academy_book_status as enum ('AVAILABLE','BORROWED','LOST','DAMAGED','RESTORING');

-- =====================================================
-- CORE USER TABLES
-- =====================================================

create table public.users (
  id uuid primary key default gen_random_uuid(),
  email citext not null unique,
  password_hash varchar(255) not null,
  full_name varchar(255) not null,
  role public.academy_user_role not null,
  phone varchar(20),
  avatar_url text,
  is_active boolean default true,
  is_verified boolean default false,
  email_verified_at timestamp,
  last_login_at timestamp,
  last_login_ip inet,
  two_factor_secret varchar(255),
  two_factor_enabled boolean default false,
  password_reset_token varchar(255),
  password_reset_expires timestamp,
  remember_token varchar(100),
  created_at timestamp default current_timestamp,
  updated_at timestamp default current_timestamp,
  deleted_at timestamp
);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  admission_number varchar(20) unique not null,
  first_name varchar(100) not null,
  last_name varchar(100) not null,
  middle_name varchar(100),
  date_of_birth date,
  gender varchar(10),
  blood_group varchar(5),
  religion varchar(50),
  nationality varchar(50) default 'Nigerian',
  state_of_origin varchar(50),
  lga varchar(50),
  home_address text,
  current_class varchar(20) not null,
  class_arm varchar(5),
  admission_date date default current_date,
  graduation_date date,
  is_graduated boolean default false,
  current_session varchar(20),
  profile_photo text,
  emergency_contact_name varchar(255),
  emergency_contact_phone varchar(20),
  medical_info text,
  created_at timestamp default current_timestamp,
  updated_at timestamp default current_timestamp,
  deleted_at timestamp
);

create table public.teachers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  staff_id varchar(50) unique not null,
  first_name varchar(100) not null,
  last_name varchar(100) not null,
  qualification varchar(255),
  specialization varchar(100),
  date_of_employment date,
  date_of_birth date,
  gender varchar(10),
  phone_alternative varchar(20),
  home_address text,
  is_class_teacher boolean default false,
  class_teacher_of varchar(20),
  created_at timestamp default current_timestamp,
  updated_at timestamp default current_timestamp,
  deleted_at timestamp
);

create table public.parents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  occupation varchar(255),
  home_address text,
  office_address text,
  emergency_contact_name varchar(255),
  emergency_contact_phone varchar(20),
  created_at timestamp default current_timestamp,
  updated_at timestamp default current_timestamp,
  deleted_at timestamp
);

create table public.parent_students (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.parents(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  is_guardian boolean default false,
  relationship varchar(50),
  created_at timestamp default current_timestamp,
  unique(parent_id, student_id)
);

create table public.admins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  admin_code varchar(50) unique not null,
  department varchar(100),
  position varchar(100),
  created_at timestamp default current_timestamp,
  updated_at timestamp default current_timestamp,
  deleted_at timestamp
);

-- =====================================================
-- ACADEMIC TABLES
-- =====================================================

create table public.academic_sessions (
  id uuid primary key default gen_random_uuid(),
  name varchar(50) not null,
  start_date date not null,
  end_date date not null,
  is_current boolean default false,
  is_active boolean default true,
  created_at timestamp default current_timestamp,
  updated_at timestamp default current_timestamp
);

create table public.terms (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.academic_sessions(id) on delete cascade,
  term_name public.academy_term_type not null,
  start_date date not null,
  end_date date not null,
  is_current boolean default false,
  is_active boolean default true,
  created_at timestamp default current_timestamp,
  updated_at timestamp default current_timestamp,
  unique(session_id, term_name)
);

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  name varchar(20) not null,
  level integer,
  category varchar(20),
  sort_order integer,
  is_active boolean default true,
  created_at timestamp default current_timestamp,
  updated_at timestamp default current_timestamp
);

create table public.class_arms (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  arm_name varchar(5) not null,
  capacity integer default 40,
  class_teacher_id uuid references public.teachers(id),
  is_active boolean default true,
  created_at timestamp default current_timestamp,
  unique(class_id, arm_name)
);

create table public.student_class_assignments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  class_arm_id uuid not null references public.class_arms(id) on delete cascade,
  session_id uuid not null references public.academic_sessions(id),
  term_id uuid not null references public.terms(id),
  is_current boolean default true,
  assigned_date date default current_date,
  promoted_from uuid,
  created_at timestamp default current_timestamp
);

-- =====================================================
-- SUBJECTS TABLE
-- =====================================================

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  name varchar(100) not null,
  code varchar(20) unique not null,
  description text,
  category varchar(50),
  education_level varchar(20),
  department varchar(50),
  is_active boolean default true,
  created_at timestamp default current_timestamp,
  updated_at timestamp default current_timestamp
);

create table public.class_subjects (
  id uuid primary key default gen_random_uuid(),
  class_arm_id uuid not null references public.class_arms(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  teacher_id uuid not null references public.teachers(id),
  is_compulsory boolean default true,
  weekly_hours integer default 4,
  created_at timestamp default current_timestamp,
  unique(class_arm_id, subject_id)
);

create table public.timetables (
  id uuid primary key default gen_random_uuid(),
  class_arm_id uuid not null references public.class_arms(id) on delete cascade,
  subject_id uuid not null references public.subjects(id),
  teacher_id uuid not null references public.teachers(id),
  day_of_week integer not null,
  start_time time not null,
  end_time time not null,
  session_id uuid not null references public.academic_sessions(id),
  term_id uuid not null references public.terms(id),
  created_at timestamp default current_timestamp,
  updated_at timestamp default current_timestamp
);

-- =====================================================
-- ASSESSMENT & CBT TABLES
-- =====================================================

create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  title varchar(255) not null,
  description text,
  type public.academy_assessment_type not null,
  term_id uuid not null references public.terms(id),
  session_id uuid not null references public.academic_sessions(id),
  subject_id uuid not null references public.subjects(id),
  class_arm_id uuid not null references public.class_arms(id),
  teacher_id uuid not null references public.teachers(id),
  total_score numeric(10,2) not null,
  passing_score numeric(10,2),
  duration_minutes integer,
  is_published boolean default false,
  published_at timestamp,
  due_date timestamp,
  instructions text,
  created_at timestamp default current_timestamp,
  updated_at timestamp default current_timestamp,
  deleted_at timestamp
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  question_text text not null,
  question_type public.academy_question_type not null,
  options jsonb,
  correct_answer jsonb not null,
  explanation text,
  points numeric(5,2) default 1,
  order_number integer,
  image_url text,
  metadata jsonb,
  created_at timestamp default current_timestamp,
  updated_at timestamp default current_timestamp
);

create table public.fitb_answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  blank_position integer not null,
  correct_answer text not null,
  case_sensitive boolean default false,
  partial_credit boolean default false,
  created_at timestamp default current_timestamp
);

create table public.results (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  score numeric(10,2),
  percentage numeric(5,2),
  grade varchar(5),
  answers jsonb,
  feedback text,
  started_at timestamp,
  submitted_at timestamp,
  is_graded boolean default false,
  graded_at timestamp,
  graded_by uuid references public.users(id),
  created_at timestamp default current_timestamp,
  updated_at timestamp default current_timestamp,
  deleted_at timestamp,
  unique(student_id, assessment_id)
);

create table public.cbt_sessions (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id),
  class_arm_id uuid not null references public.class_arms(id),
  start_time timestamp not null,
  end_time timestamp not null,
  duration_minutes integer not null,
  allow_navigation boolean default false,
  show_results boolean default true,
  randomize_questions boolean default false,
  randomize_options boolean default false,
  is_active boolean default false,
  ip_restrictions text[],
  proctoring_enabled boolean default false,
  created_at timestamp default current_timestamp,
  updated_at timestamp default current_timestamp
);

create table public.cbt_attempts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.cbt_sessions(id),
  student_id uuid not null references public.students(id),
  status public.academy_cbt_status default 'NOT_STARTED',
  answers jsonb,
  score numeric(10,2),
  percentage numeric(5,2),
  started_at timestamp,
  submitted_at timestamp,
  time_spent integer,
  device_info jsonb,
  ip_address inet,
  tab_switch_count integer default 0,
  screenshot_taken boolean default false,
  created_at timestamp default current_timestamp,
  updated_at timestamp default current_timestamp,
  unique(session_id, student_id)
);

-- =====================================================
-- PAYMENT TABLES
-- =====================================================

create table public.fee_structures (
  id uuid primary key default gen_random_uuid(),
  class_arm_id uuid not null references public.class_arms(id),
  term_id uuid not null references public.terms(id),
  fee_type varchar(100) not null,
  amount numeric(15,2) not null,
  is_mandatory boolean default true,
  due_date date,
  late_fee numeric(15,2),
  description text,
  is_active boolean default true,
  created_at timestamp default current_timestamp,
  updated_at timestamp default current_timestamp,
  deleted_at timestamp
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.parents(id),
  student_id uuid not null references public.students(id),
  fee_structure_id uuid references public.fee_structures(id),
  amount numeric(15,2) not null,
  amount_paid numeric(15,2),
  balance numeric(15,2),
  reference varchar(100) unique not null,
  korapay_transaction_id varchar(100),
  korapay_payment_link text,
  status public.academy_payment_status default 'PENDING',
  payment_method varchar(50),
  payment_date timestamp,
  currency varchar(3) default 'NGN',
  metadata jsonb,
  receipt_url text,
  notes text,
  created_at timestamp default current_timestamp,
  updated_at timestamp default current_timestamp,
  deleted_at timestamp
);

create table public.payment_installments (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments(id),
  due_date date not null,
  amount_due numeric(15,2) not null,
  amount_paid numeric(15,2) default 0,
  installment_number integer not null,
  status public.academy_payment_status default 'PENDING',
  paid_at timestamp,
  created_at timestamp default current_timestamp,
  updated_at timestamp default current_timestamp
);

create table public.payment_webhook_logs (
  id uuid primary key default gen_random_uuid(),
  transaction_id varchar(100),
  event_type varchar(100),
  payload jsonb,
  processed boolean default false,
  error_message text,
  created_at timestamp default current_timestamp
);

-- =====================================================
-- COMMUNICATION TABLES
-- =====================================================

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  type public.academy_message_type not null,
  title varchar(255),
  created_by uuid references public.users(id),
  created_at timestamp default current_timestamp,
  updated_at timestamp default current_timestamp
);

create table public.conversation_participants (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  last_read_at timestamp,
  joined_at timestamp default current_timestamp,
  unique(conversation_id, user_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.users(id),
  content text not null,
  attachments jsonb,
  is_read boolean default false,
  is_deleted boolean default false,
  reply_to_id uuid references public.messages(id),
  reactions jsonb,
  metadata jsonb,
  created_at timestamp default current_timestamp,
  deleted_at timestamp
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title varchar(255) not null,
  message text not null,
  type varchar(50),
  data jsonb,
  is_read boolean default false,
  read_at timestamp,
  created_at timestamp default current_timestamp
);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title varchar(255) not null,
  content text not null,
  author_id uuid not null references public.users(id),
  target_roles public.academy_user_role[],
  target_classes uuid[],
  is_published boolean default true,
  published_at timestamp,
  expires_at timestamp,
  pinned boolean default false,
  attachments jsonb,
  created_at timestamp default current_timestamp,
  updated_at timestamp default current_timestamp
);

-- =====================================================
-- DISPUTE & SUPPORT TABLES
-- =====================================================

create table public.disputes (
  id uuid primary key default gen_random_uuid(),
  ticket_number varchar(20) unique not null,
  title varchar(255) not null,
  category public.academy_dispute_category not null,
  priority public.academy_dispute_priority default 'MEDIUM',
  status public.academy_dispute_status default 'OPEN',
  description text not null,
  evidence jsonb,
  raised_by_id uuid not null references public.users(id),
  assigned_to_id uuid references public.users(id),
  related_student_id uuid references public.students(id),
  related_payment_id uuid references public.payments(id),
  related_assessment_id uuid references public.assessments(id),
  resolution text,
  resolved_at timestamp,
  escalated_at timestamp,
  escalated_to varchar(100),
  created_at timestamp default current_timestamp,
  updated_at timestamp default current_timestamp,
  deleted_at timestamp
);

create table public.dispute_messages (
  id uuid primary key default gen_random_uuid(),
  dispute_id uuid not null references public.disputes(id) on delete cascade,
  sender_id uuid not null references public.users(id),
  message text not null,
  attachments jsonb,
  is_internal boolean default false,
  created_at timestamp default current_timestamp
);

create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_number varchar(20) unique not null,
  title varchar(255) not null,
  category public.academy_support_category not null,
  priority public.academy_dispute_priority default 'MEDIUM',
  status varchar(50) default 'OPEN',
  description text not null,
  screenshots jsonb,
  user_id uuid not null references public.users(id),
  assigned_agent_id uuid references public.users(id),
  resolution text,
  satisfaction_rating integer check (satisfaction_rating between 1 and 5),
  resolved_at timestamp,
  created_at timestamp default current_timestamp,
  updated_at timestamp default current_timestamp,
  deleted_at timestamp
);

create table public.support_ticket_replies (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  user_id uuid not null references public.users(id),
  message text not null,
  attachments jsonb,
  created_at timestamp default current_timestamp
);

-- =====================================================
-- ATTENDANCE TABLES
-- =====================================================

create table public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id),
  class_arm_id uuid not null references public.class_arms(id),
  subject_id uuid references public.subjects(id),
  date date not null,
  status public.academy_attendance_status not null,
  time_in time,
  time_out time,
  marked_by_id uuid not null references public.users(id),
  note text,
  created_at timestamp default current_timestamp,
  updated_at timestamp default current_timestamp,
  unique nulls not distinct(student_id, date, subject_id)
);

-- =====================================================
-- LIBRARY & BOOK TABLES
-- =====================================================

create table public.books (
  id uuid primary key default gen_random_uuid(),
  isbn varchar(20) unique,
  title varchar(500) not null,
  subtitle varchar(500),
  authors text[] not null,
  publisher varchar(255),
  publication_year integer,
  edition varchar(50),
  volume varchar(50),
  language varchar(50) default 'English',
  pages integer,
  category varchar(100),
  sub_category varchar(100),
  keywords text[],
  description text,
  table_of_contents jsonb,
  cover_image_url text,
  file_url text,
  physical_location varchar(255),
  total_copies integer default 1,
  available_copies integer default 1,
  borrowed_count integer default 0,
  rating numeric(3,2) default 0,
  rating_count integer default 0,
  status public.academy_book_status default 'AVAILABLE',
  is_digital boolean default false,
  is_published boolean default true,
  subject_id uuid references public.subjects(id),
  class_level varchar(20),
  search_vector tsvector,
  created_at timestamp default current_timestamp,
  updated_at timestamp default current_timestamp,
  deleted_at timestamp
);

create index books_title_trgm_idx on public.books using gin (title gin_trgm_ops);
create index books_search_vector_idx on public.books using gin (search_vector);

create table public.book_categories (
  id uuid primary key default gen_random_uuid(),
  name varchar(100) not null,
  parent_id uuid references public.book_categories(id),
  description text,
  icon varchar(50),
  search_boost integer default 1,
  created_at timestamp default current_timestamp,
  updated_at timestamp default current_timestamp
);

create table public.book_tags (
  id uuid primary key default gen_random_uuid(),
  name varchar(50) unique not null,
  created_at timestamp default current_timestamp
);

create table public.book_tag_relations (
  book_id uuid not null references public.books(id) on delete cascade,
  tag_id uuid not null references public.book_tags(id) on delete cascade,
  primary key(book_id, tag_id)
);

create table public.book_borrowings (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id),
  student_id uuid not null references public.students(id),
  borrowed_at timestamp default current_timestamp,
  due_date date not null,
  returned_at timestamp,
  status varchar(20) default 'BORROWED',
  fine_amount numeric(10,2) default 0,
  extension_count integer default 0,
  last_extension_at timestamp,
  notes text,
  created_at timestamp default current_timestamp,
  updated_at timestamp default current_timestamp
);

create table public.book_requests (
  id uuid primary key default gen_random_uuid(),
  book_id uuid references public.books(id),
  student_id uuid not null references public.students(id),
  title varchar(500) not null,
  author varchar(255),
  isbn varchar(20),
  reason text,
  priority varchar(20) default 'MEDIUM',
  status varchar(20) default 'PENDING',
  admin_notes text,
  created_at timestamp default current_timestamp,
  updated_at timestamp default current_timestamp
);

create table public.reading_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id),
  book_id uuid not null references public.books(id),
  pages_read integer default 0,
  last_read_at timestamp default current_timestamp,
  reading_time integer default 0,
  bookmark_page integer,
  completed boolean default false,
  rating integer check(rating between 1 and 5),
  review text,
  created_at timestamp default current_timestamp,
  updated_at timestamp default current_timestamp,
  unique(user_id, book_id)
);

create table public.book_reviews (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id),
  user_id uuid not null references public.users(id),
  rating integer not null check(rating between 1 and 5),
  review text,
  helpful_count integer default 0,
  created_at timestamp default current_timestamp,
  updated_at timestamp default current_timestamp
);

create table public.search_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id),
  query text not null,
  results_count integer,
  filters jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp default current_timestamp
);

create table public.book_import_logs (
  id uuid primary key default gen_random_uuid(),
  filename text not null,
  total_records integer default 0,
  inserted integer default 0,
  updated integer default 0,
  skipped integer default 0,
  failed integer default 0,
  errors jsonb,
  performed_by uuid references public.users(id),
  status text default 'PENDING',
  completed_at timestamp,
  created_at timestamp default current_timestamp
);

create table public.book_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id),
  book_id uuid not null references public.books(id),
  created_at timestamp default current_timestamp,
  unique(user_id, book_id)
);

-- =====================================================
-- LEARNING MATERIALS
-- =====================================================

create table public.learning_materials (
  id uuid primary key default gen_random_uuid(),
  title varchar(255) not null,
  description text,
  type varchar(50),
  subject_id uuid references public.subjects(id),
  class_arm_id uuid references public.class_arms(id),
  teacher_id uuid not null references public.teachers(id),
  file_url text,
  duration_minutes integer,
  is_published boolean default false,
  uploaded_at timestamp default current_timestamp,
  created_at timestamp default current_timestamp,
  updated_at timestamp default current_timestamp
);

-- =====================================================
-- DISCIPLINARY RECORDS
-- =====================================================

create table public.disciplinary_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id),
  reported_by_id uuid not null references public.users(id),
  incident_date date not null,
  incident_type varchar(100),
  description text not null,
  sanction varchar(255),
  status varchar(50) default 'PENDING',
  resolved_at timestamp,
  notes text,
  created_at timestamp default current_timestamp,
  updated_at timestamp default current_timestamp
);

-- =====================================================
-- SYSTEM TABLES (RBAC/ABAC)
-- =====================================================

create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  name varchar(100) unique not null,
  resource varchar(100) not null,
  action varchar(50) not null,
  description text,
  created_at timestamp default current_timestamp
);

create table public.role_permissions (
  id uuid primary key default gen_random_uuid(),
  role public.academy_user_role not null,
  permission_id uuid not null references public.permissions(id),
  created_at timestamp default current_timestamp,
  unique(role, permission_id)
);

create table public.user_permissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id),
  permission_id uuid not null references public.permissions(id),
  granted boolean default true,
  expires_at timestamp,
  created_at timestamp default current_timestamp,
  unique(user_id, permission_id)
);

create table public.abac_policies (
  id uuid primary key default gen_random_uuid(),
  name varchar(100) unique not null,
  description text,
  role public.academy_user_role,
  resource varchar(100) not null,
  action varchar(50) not null,
  conditions jsonb,
  priority integer default 0,
  effect varchar(10) default 'ALLOW',
  is_active boolean default true,
  created_at timestamp default current_timestamp,
  updated_at timestamp default current_timestamp
);

-- =====================================================
-- PROMOTION & DEMOTION TABLES
-- =====================================================

create table public.promotion_history (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id),
  from_class varchar(20) not null,
  to_class varchar(20) not null,
  from_arm varchar(5),
  to_arm varchar(5),
  type varchar(20) not null,
  reason text,
  admin_comment text,
  session_id uuid references public.academic_sessions(id),
  term_id uuid references public.terms(id),
  performed_by uuid not null references public.users(id),
  approved_by uuid references public.users(id),
  created_at timestamp default current_timestamp
);

-- =====================================================
-- AUDIT & LOGS
-- =====================================================

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id),
  action varchar(100) not null,
  resource varchar(100) not null,
  resource_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp default current_timestamp
);

create table public.login_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id),
  login_at timestamp default current_timestamp,
  ip_address inet,
  user_agent text,
  success boolean default true,
  failure_reason text
);

-- =====================================================
-- SYSTEM CONFIGURATION
-- =====================================================

create table public.system_settings (
  id uuid primary key default gen_random_uuid(),
  key varchar(100) unique not null,
  value text,
  type varchar(50),
  description text,
  updated_at timestamp default current_timestamp
);

-- =====================================================
-- TRIGGERS AND FUNCTIONS
-- =====================================================

create or replace function public.update_updated_at_column() returns trigger language plpgsql as $$
begin new.updated_at = current_timestamp; return new; end; $$;

create or replace function public.book_search_vector_update() returns trigger language plpgsql as $$
begin
  new.search_vector := setweight(to_tsvector('english', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.subtitle, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(array_to_string(new.authors, ' '), '')), 'B') ||
    setweight(to_tsvector('english', coalesce(new.description, '')), 'D');
  return new;
end; $$;

-- Apply triggers
create trigger users_updated_at before update on public.users for each row execute function public.update_updated_at_column();
create trigger students_updated_at before update on public.students for each row execute function public.update_updated_at_column();
create trigger teachers_updated_at before update on public.teachers for each row execute function public.update_updated_at_column();
create trigger books_updated_at before update on public.books for each row execute function public.update_updated_at_column();
create trigger books_search_vector before insert or update on public.books for each row execute function public.book_search_vector_update();

-- =====================================================
-- VIEWS
-- =====================================================

create view public.current_students_view as
select s.id, s.admission_number, s.first_name, s.last_name, s.current_class, s.class_arm,
       c.name as class_name, ca.arm_name, u.email, u.phone, s.created_at
from public.students s join public.users u on u.id = s.user_id
left join public.classes c on c.name = s.current_class
left join public.class_arms ca on ca.class_id = c.id and ca.arm_name = s.class_arm
where not s.is_graduated and s.deleted_at is null and u.deleted_at is null and u.is_active;

create view public.student_results_view as
select r.id, s.admission_number, s.first_name, s.last_name, a.title as assessment_title,
       a.type as assessment_type, sub.name as subject, r.score, r.percentage, r.grade, r.submitted_at,
       t.term_name, ac.name as session_name
from public.results r join public.students s on s.id = r.student_id
join public.assessments a on a.id = r.assessment_id join public.subjects sub on sub.id = a.subject_id
join public.terms t on t.id = a.term_id join public.academic_sessions ac on ac.id = t.session_id
where s.deleted_at is null and a.deleted_at is null and r.deleted_at is null;

create view public.payment_summary_view as
select p.id, s.admission_number, s.first_name || ' ' || s.last_name as student_name, p.amount,
       p.amount_paid, p.balance, p.status, p.payment_date, p.reference, fs.fee_type
from public.payments p join public.students s on s.id = p.student_id
left join public.fee_structures fs on fs.id = p.fee_structure_id
where s.deleted_at is null and p.deleted_at is null;

-- =====================================================
-- SEED DATA (WITH DUPLICATE HANDLING)
-- =====================================================

-- Classes (Primary 3 to SSS 3)
insert into public.classes (id, name, level, category, sort_order) values
  (gen_random_uuid(), 'Primary 3', 3, 'PRIMARY', 1),
  (gen_random_uuid(), 'Primary 4', 4, 'PRIMARY', 2),
  (gen_random_uuid(), 'Primary 5', 5, 'PRIMARY', 3),
  (gen_random_uuid(), 'Primary 6', 6, 'PRIMARY', 4),
  (gen_random_uuid(), 'JSS1', 1, 'JUNIOR', 5),
  (gen_random_uuid(), 'JSS2', 2, 'JUNIOR', 6),
  (gen_random_uuid(), 'JSS3', 3, 'JUNIOR', 7),
  (gen_random_uuid(), 'SSS1', 1, 'SENIOR', 8),
  (gen_random_uuid(), 'SSS2', 2, 'SENIOR', 9),
  (gen_random_uuid(), 'SSS3', 3, 'SENIOR', 10);

-- Subjects
insert into public.subjects (id, name, code, category, education_level, department, description) values
  (gen_random_uuid(), 'Mathematics', 'MATH-PRI', 'CORE', 'PRIMARY', 'GENERAL', 'Mathematics for Primary School'),
  (gen_random_uuid(), 'English Studies', 'ENG-PRI', 'CORE', 'PRIMARY', 'GENERAL', 'English Language for Primary School'),
  (gen_random_uuid(), 'Security and Citizenship Education', 'SCE-PRI', 'CORE', 'PRIMARY', 'GENERAL', 'Security and Citizenship Education'),
  (gen_random_uuid(), 'French', 'FRENCH-PRI', 'CORE', 'PRIMARY', 'GENERAL', 'French Language'),
  (gen_random_uuid(), 'Intermediate Science', 'SCI-PRI', 'CORE', 'PRIMARY', 'GENERAL', 'Science for Primary School'),
  (gen_random_uuid(), 'History', 'HIST-PRI', 'CORE', 'PRIMARY', 'GENERAL', 'History for Primary School'),
  (gen_random_uuid(), 'Verbal Reasoning', 'VERBAL-PRI', 'CORE', 'PRIMARY', 'GENERAL', 'Verbal Reasoning'),
  (gen_random_uuid(), 'Quantitative Reasoning', 'QUANT-PRI', 'CORE', 'PRIMARY', 'GENERAL', 'Quantitative Reasoning'),
  (gen_random_uuid(), 'Digital Technology', 'DIGI-PRI', 'CORE', 'PRIMARY', 'GENERAL', 'Digital Technology'),
  (gen_random_uuid(), 'Cultural and Creative Arts', 'CCA-PRI', 'CORE', 'PRIMARY', 'GENERAL', 'Cultural and Creative Arts'),
  (gen_random_uuid(), 'Yoruba', 'YORUBA-PRI', 'CORE', 'PRIMARY', 'GENERAL', 'Yoruba Language'),
  (gen_random_uuid(), 'Prevocational Studies', 'PVS-PRI', 'CORE', 'PRIMARY', 'GENERAL', 'Prevocational Studies'),
  (gen_random_uuid(), 'Mathematics', 'MATH-JSS', 'CORE', 'JUNIOR', 'GENERAL', 'Mathematics for Junior Secondary'),
  (gen_random_uuid(), 'English Studies', 'ENG-JSS', 'CORE', 'JUNIOR', 'GENERAL', 'English Language for Junior Secondary'),
  (gen_random_uuid(), 'Security and Citizenship Education', 'SCE-JSS', 'CORE', 'JUNIOR', 'GENERAL', 'Security and Citizenship Education'),
  (gen_random_uuid(), 'French', 'FRENCH-JSS', 'CORE', 'JUNIOR', 'GENERAL', 'French Language'),
  (gen_random_uuid(), 'Intermediate Science', 'SCI-JSS', 'CORE', 'JUNIOR', 'GENERAL', 'Science for Junior Secondary'),
  (gen_random_uuid(), 'History', 'HIST-JSS', 'CORE', 'JUNIOR', 'GENERAL', 'History for Junior Secondary'),
  (gen_random_uuid(), 'Verbal Reasoning', 'VERBAL-JSS', 'CORE', 'JUNIOR', 'GENERAL', 'Verbal Reasoning'),
  (gen_random_uuid(), 'Quantitative Reasoning', 'QUANT-JSS', 'CORE', 'JUNIOR', 'GENERAL', 'Quantitative Reasoning'),
  (gen_random_uuid(), 'Digital Technology', 'DIGI-JSS', 'CORE', 'JUNIOR', 'GENERAL', 'Digital Technology'),
  (gen_random_uuid(), 'Cultural and Creative Arts', 'CCA-JSS', 'CORE', 'JUNIOR', 'GENERAL', 'Cultural and Creative Arts'),
  (gen_random_uuid(), 'Yoruba', 'YORUBA-JSS', 'CORE', 'JUNIOR', 'GENERAL', 'Yoruba Language'),
  (gen_random_uuid(), 'Prevocational Studies', 'PVS-JSS', 'CORE', 'JUNIOR', 'GENERAL', 'Prevocational Studies'),
  (gen_random_uuid(), 'Business Studies', 'BUS-JSS', 'CORE', 'JUNIOR', 'GENERAL', 'Business Studies for Junior Secondary'),
  (gen_random_uuid(), 'Mathematics', 'MATH-SSS', 'CORE', 'SENIOR', 'GENERAL', 'Mathematics for Senior Secondary'),
  (gen_random_uuid(), 'Use of English', 'ENG-SSS', 'CORE', 'SENIOR', 'GENERAL', 'Use of English for Senior Secondary'),
  (gen_random_uuid(), 'Biology', 'BIO-SSS', 'CORE', 'SENIOR', 'GENERAL', 'Biology for Senior Secondary'),
  (gen_random_uuid(), 'Citizenship and Heritage Studies', 'CHS-SSS', 'CORE', 'SENIOR', 'GENERAL', 'Citizenship and Heritage Studies'),
  (gen_random_uuid(), 'Digital Technology', 'DIGI-SSS', 'CORE', 'SENIOR', 'GENERAL', 'Digital Technology for Senior Secondary'),
  (gen_random_uuid(), 'Physics', 'PHY-SSS', 'ELECTIVE', 'SENIOR', 'SCIENCE', 'Physics for Science Students'),
  (gen_random_uuid(), 'Chemistry', 'CHEM-SSS', 'ELECTIVE', 'SENIOR', 'SCIENCE', 'Chemistry for Science Students'),
  (gen_random_uuid(), 'Agricultural Science', 'AGRIC-SSS', 'ELECTIVE', 'SENIOR', 'SCIENCE', 'Agricultural Science'),
  (gen_random_uuid(), 'Further Mathematics', 'FMATH-SSS', 'ELECTIVE', 'SENIOR', 'SCIENCE', 'Further Mathematics'),
  (gen_random_uuid(), 'Geography', 'GEO-SSS', 'ELECTIVE', 'SENIOR', 'SCIENCE', 'Geography'),
  (gen_random_uuid(), 'Government', 'GOV-SSS', 'ELECTIVE', 'SENIOR', 'ARTS', 'Government for Arts Students'),
  (gen_random_uuid(), 'Literature in English', 'LIT-SSS', 'ELECTIVE', 'SENIOR', 'ARTS', 'Literature in English'),
  (gen_random_uuid(), 'Yoruba', 'YORUBA-SSS', 'ELECTIVE', 'SENIOR', 'ARTS', 'Yoruba Language for Senior Secondary'),
  (gen_random_uuid(), 'Christian Religious Studies', 'CRS-SSS', 'ELECTIVE', 'SENIOR', 'ARTS', 'Christian Religious Studies'),
  (gen_random_uuid(), 'Government', 'GOV-SSS-COM', 'ELECTIVE', 'SENIOR', 'COMMERCIAL', 'Government for Commercial Students'),
  (gen_random_uuid(), 'Commerce', 'COMM-SSS', 'ELECTIVE', 'SENIOR', 'COMMERCIAL', 'Commerce'),
  (gen_random_uuid(), 'Financial Accounting', 'ACC-SSS', 'ELECTIVE', 'SENIOR', 'COMMERCIAL', 'Financial Accounting'),
  (gen_random_uuid(), 'Further Mathematics', 'FMATH-SSS-COM', 'ELECTIVE', 'SENIOR', 'COMMERCIAL', 'Further Mathematics');

-- Permissions
insert into public.permissions (id, name, resource, action, description) values
  (gen_random_uuid(), 'manage_users', 'user', 'manage', 'Full user management access'),
  (gen_random_uuid(), 'view_users', 'user', 'view', 'View user information'),
  (gen_random_uuid(), 'create_users', 'user', 'create', 'Create new users'),
  (gen_random_uuid(), 'edit_users', 'user', 'edit', 'Edit user information'),
  (gen_random_uuid(), 'delete_users', 'user', 'delete', 'Delete users'),
  (gen_random_uuid(), 'manage_assessments', 'assessment', 'manage', 'Full assessment management'),
  (gen_random_uuid(), 'create_assessments', 'assessment', 'create', 'Create new assessments'),
  (gen_random_uuid(), 'grade_assessments', 'assessment', 'grade', 'Grade assessments'),
  (gen_random_uuid(), 'view_results', 'result', 'view', 'View results'),
  (gen_random_uuid(), 'manage_payments', 'payment', 'manage', 'Manage payments'),
  (gen_random_uuid(), 'process_payments', 'payment', 'process', 'Process payments'),
  (gen_random_uuid(), 'manage_disputes', 'dispute', 'manage', 'Manage disputes'),
  (gen_random_uuid(), 'send_messages', 'message', 'send', 'Send messages'),
  (gen_random_uuid(), 'view_analytics', 'analytics', 'view', 'View analytics'),
  (gen_random_uuid(), 'manage_settings', 'setting', 'manage', 'Manage system settings');

-- Role permissions (Admin gets all)
insert into public.role_permissions (id, role, permission_id)
select gen_random_uuid(), 'ADMIN'::public.academy_user_role, id from public.permissions;

-- ABAC Policies
insert into public.abac_policies (id, name, description, role, resource, action, conditions, effect) values
  (gen_random_uuid(), 'teacher_own_assessment', 'Teachers can manage their own assessments', 'TEACHER', 'assessment', 'manage', 
   '{"$and": [{"$eq": ["$.teacher_id", "$.user.id"]}]}', 'ALLOW'),
  (gen_random_uuid(), 'parent_own_children', 'Parents can view their own children data', 'PARENT', 'student', 'view',
   '{"$and": [{"$in": ["$user.id", "$.parent_students.parent_id"]}]}', 'ALLOW'),
  (gen_random_uuid(), 'student_own_results', 'Students can view their own results', 'STUDENT', 'result', 'view',
   '{"$eq": ["$.student_id", "$.user.id"]}', 'ALLOW');

-- System settings
insert into public.system_settings (id, key, value, type, description) values
  (gen_random_uuid(), 'school_name', 'EL GOODNEWS INT''L ACADEMY', 'string', 'School display name'),
  (gen_random_uuid(), 'school_address', 'Lagos, Nigeria', 'string', 'School address'),
  (gen_random_uuid(), 'school_phone', '+234-800-ELGOOD', 'string', 'School phone number'),
  (gen_random_uuid(), 'admission_number_prefix', 'GOD', 'string', 'Admission number prefix'),
  (gen_random_uuid(), 'admission_number_length', '5', 'integer', 'Admission number length'),
  (gen_random_uuid(), 'cbt_default_duration', '60', 'integer', 'Default CBT duration in minutes'),
  (gen_random_uuid(), 'max_login_attempts', '5', 'integer', 'Maximum login attempts before lockout'),
  (gen_random_uuid(), 'session_timeout_minutes', '30', 'integer', 'Session timeout in minutes'),
  (gen_random_uuid(), 'enable_2fa', 'false', 'boolean', 'Enable two-factor authentication'),
  (gen_random_uuid(), 'enable_ai_grading', 'false', 'boolean', 'Enable AI-assisted grading'),
  (gen_random_uuid(), 'enable_cbt_proctoring', 'true', 'boolean', 'Enable CBT proctoring features');

-- Book categories
insert into public.book_categories (id, name, search_boost) values
  (gen_random_uuid(), 'Mathematics', 2),
  (gen_random_uuid(), 'English Literature', 2),
  (gen_random_uuid(), 'Science', 2),
  (gen_random_uuid(), 'History', 1),
  (gen_random_uuid(), 'Geography', 1),
  (gen_random_uuid(), 'Religious Studies', 1),
  (gen_random_uuid(), 'Technology', 2),
  (gen_random_uuid(), 'Arts', 1),
  (gen_random_uuid(), 'Commerce', 1),
  (gen_random_uuid(), 'Business Studies', 1);

-- =====================================================
-- VERIFICATION
-- =====================================================

select '✅ All tables created successfully!' as status;
select count(*) as total_tables from information_schema.tables where table_schema = 'public';
select count(*) as total_subjects from public.subjects;