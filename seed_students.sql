-- =====================================================================
-- EL GOODNEWS INT'L ACADEMY - SEED DATA FOR AUTOMATED LOGIN ACCOUNTS
-- Handles Ezeako Samuel Chibueze and Jeremiah Idaghosa Clement setup.
-- Includes exact and complete lists of enrolled academic subjects.
-- =====================================================================

-- 0. CLEANSE PRE-EXISTING SEED RECORDS TO PREVENT CONSTRAINT CONFLICTS
DELETE FROM public.student WHERE admissionnumber IN ('EGIA-S-00998', 'EGIA-S-00997');
DELETE FROM public.user_role WHERE userid IN ('user-samuel-00998', 'user-jeremiah-00997');
DELETE FROM public."user" WHERE email IN ('samuel012@gmail.com', 'sophieadesuwa6@gmail.com');

-- 1. EZEAKO SAMUEL CHIBUEZE SETUP (STUDENT: EGIA-S-00998)
-- Insert core user row
INSERT INTO public."user" (id, email, name, createdat, updatedat)
VALUES (
  'user-samuel-00998',
  'samuel012@gmail.com',
  'Ezeako Samuel Chibueze',
  NOW(),
  NOW()
);

-- Insert user role
INSERT INTO public.user_role (id, userid, role)
VALUES (
  'role-samuel-00998',
  'user-samuel-00998',
  'STUDENT'
);

-- Insert student profile record with WhatsApp phone number & resume options
INSERT INTO public.student (
  id,
  userid,
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
  'Samuel',
  'Ezeako',
  '2011-04-20',
  'SSS2',
  'COMMERCIAL',
  'EGIA-S-00998',
  'default', -- Default password, can log in with admission number and set password later
  'ACTIVE', -- Set as ACTIVE so they can bypass payment checkout
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


-- 2. JEREMIAH IDAGHOSA CLEMENT SETUP (STUDENT: EGIA-S-00997)
-- Insert core user row
INSERT INTO public."user" (id, email, name, createdat, updatedat)
VALUES (
  'user-jeremiah-00997',
  'sophieadesuwa6@gmail.com',
  'Jeremiah Idaghosa Clement',
  NOW(),
  NOW()
);

-- Insert user role
INSERT INTO public.user_role (id, userid, role)
VALUES (
  'role-jeremiah-00997',
  'user-jeremiah-00997',
  'STUDENT'
);

-- Insert student profile record with WhatsApp phone number & resume options
INSERT INTO public.student (
  id,
  userid,
  firstname,
  lastname,
  dateofbirth,
  class,
  admissionnumber,
  password,
  registrationstatus,
  subjectsdone,
  createdat,
  updatedat
) VALUES (
  'student-jeremiah-00997',
  'user-jeremiah-00997',
  'Jeremiah',
  'Clement',
  '2015-09-10',
  'JSS1',
  'EGIA-S-00997',
  'default', -- Default password, can log in with admission number and set password later
  'ACTIVE', -- Set as ACTIVE so they can bypass payment checkout
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
