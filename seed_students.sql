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
  '{
    "department": "COMMERCIAL",
    "core_subjects": [
      {"name": "Mathematics", "code": "MATH-SSS", "compulsory": true, "level": "SENIOR", "department": "COMMERCIAL"},
      {"name": "English Language", "code": "ENG-SSS", "compulsory": true, "level": "SENIOR", "department": "COMMERCIAL"},
      {"name": "Biology", "code": "BIO-SSS", "compulsory": true, "level": "SENIOR", "department": "COMMERCIAL"},
      {"name": "Civic Education", "code": "CIV-SSS", "compulsory": true, "level": "SENIOR", "department": "COMMERCIAL"},
      {"name": "Data Processing", "code": "DAT-SSS", "compulsory": true, "level": "SENIOR", "department": "COMMERCIAL"}
    ],
    "elective_subjects": [
      {"name": "Commerce", "code": "COM-SSS", "compulsory": false, "level": "SENIOR", "department": "COMMERCIAL"},
      {"name": "Financial Accounting", "code": "ACC-SSS", "compulsory": false, "level": "SENIOR", "department": "COMMERCIAL"},
      {"name": "Economics", "code": "ECO-SSS", "compulsory": false, "level": "SENIOR", "department": "COMMERCIAL"},
      {"name": "Government", "code": "GOV-SSS", "compulsory": false, "level": "SENIOR", "department": "COMMERCIAL"},
      {"name": "Literature in English", "code": "LIT-SSS", "compulsory": false, "level": "SENIOR", "department": "COMMERCIAL"},
      {"name": "Yoruba", "code": "YOR-SSS", "compulsory": false, "level": "SENIOR", "department": "COMMERCIAL"},
      {"name": "Christian Religious Studies", "code": "CRS-SSS", "compulsory": false, "level": "SENIOR", "department": "COMMERCIAL"},
      {"name": "Geography", "code": "GEO-SSS", "compulsory": false, "level": "SENIOR", "department": "COMMERCIAL"}
    ],
    "trade_subjects": [
      {"name": "Business Studies", "code": "BUS-SSS", "compulsory": false, "level": "SENIOR", "department": "COMMERCIAL"},
      {"name": "Insurance", "code": "INS-SSS", "compulsory": false, "level": "SENIOR", "department": "COMMERCIAL"},
      {"name": "Office Practice", "code": "OFF-SSS", "compulsory": false, "level": "SENIOR", "department": "COMMERCIAL"},
      {"name": "Book Keeping", "code": "BOK-SSS", "compulsory": false, "level": "SENIOR", "department": "COMMERCIAL"}
    ]
  }'::jsonb,
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
