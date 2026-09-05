-- =====================================================================
-- EL GOODNEWS INT'L ACADEMY - SEED DATA FOR MULTI-TENANT & AUTOMATED LOGIN ACCOUNTS
-- Includes Ezeako Samuel Chibueze, Jeremiah Idaghosa Clement, and default School setup.
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
  'EXCE-12345',
  'Lagos, Nigeria',
  '["Primary 3", "Primary 4", "Primary 5", "Primary 6", "JSS1", "JSS2", "JSS3", "SSS1", "SSS2", "SSS3"]'::jsonb,
  true,
  'Dr. Jane Doe',
  '+234-800-ELGOOD',
  'admin@school.com',
  'PAID',
  NOW(),
  NOW()
) ON CONFLICT (code) DO NOTHING;

-- 1. CLEANSE PRE-EXISTING SEED RECORDS TO PREVENT CONSTRAINT CONFLICTS
DELETE FROM public.student WHERE admissionnumber IN ('EGIA-S-00998', 'EGIA-S-00997');
DELETE FROM public.user_role WHERE userid IN ('user-samuel-00998', 'user-jeremiah-00997');
DELETE FROM public."user" WHERE email IN ('samuel012@gmail.com', 'sophieadesuwa6@gmail.com');

-- 2. EZEAKO SAMUEL CHIBUEZE SETUP (STUDENT: EGIA-S-00998)
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
  'EGIA-S-00998',
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

-- 3. JEREMIAH IDAGHOSA CLEMENT SETUP (STUDENT: EGIA-S-00997)
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
  'EGIA-S-00997',
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
