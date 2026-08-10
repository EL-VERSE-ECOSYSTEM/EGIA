-- =====================================================================
-- EL GOODNEWS INT'L ACADEMY - SEED DATA FOR AUTOMATED LOGIN ACCOUNTS
-- Handles Ezeako Samuel Chibueze and Jeremiah Idaghosa Clement setup.
-- =====================================================================

-- 1. EZEAKO SAMUEL CHIBUEZE SETUP (STUDENT: EGIA-S-00998)
-- Insert core user row
INSERT INTO public."user" (id, email, name, "createdAt", "updatedAt")
VALUES (
  'user-samuel-00998',
  'samuel012@gmail.com',
  'Ezeako Samuel Chibueze',
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name;

-- Insert user role
INSERT INTO public.user_role (id, "userId", role)
VALUES (
  'role-samuel-00998',
  'user-samuel-00998',
  'STUDENT'
) ON CONFLICT ("userId") DO UPDATE SET role = EXCLUDED.role;

-- Insert student profile record with WhatsApp phone number & resume options
INSERT INTO public.student (
  id,
  "userId",
  firstname,
  lastname,
  dateofbirth,
  class,
  admissionnumber,
  password,
  registrationstatus,
  "createdAt",
  "updatedAt"
) VALUES (
  'student-samuel-00998',
  'user-samuel-00998',
  'Samuel',
  'Ezeako',
  '2011-04-20',
  'SSS2',
  'EGIA-S-00998',
  'default', -- Default password, can log in with admission number and set password later
  'ACTIVE', -- Set as ACTIVE so they can bypass payment checkout
  NOW(),
  NOW()
) ON CONFLICT (admissionnumber) DO UPDATE SET
  "userId" = EXCLUDED."userId",
  dateofbirth = EXCLUDED.dateofbirth,
  class = EXCLUDED.class,
  password = EXCLUDED.password,
  registrationstatus = EXCLUDED.registrationstatus;


-- 2. JEREMIAH IDAGHOSA CLEMENT SETUP (STUDENT: EGIA-S-00997)
-- Insert core user row
INSERT INTO public."user" (id, email, name, "createdAt", "updatedAt")
VALUES (
  'user-jeremiah-00997',
  'sophieadesuwa6@gmail.com',
  'Jeremiah Idaghosa Clement',
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name;

-- Insert user role
INSERT INTO public.user_role (id, "userId", role)
VALUES (
  'role-jeremiah-00997',
  'user-jeremiah-00997',
  'STUDENT'
) ON CONFLICT ("userId") DO UPDATE SET role = EXCLUDED.role;

-- Insert student profile record with WhatsApp phone number & resume options
INSERT INTO public.student (
  id,
  "userId",
  firstname,
  lastname,
  dateofbirth,
  class,
  admissionnumber,
  password,
  registrationstatus,
  "createdAt",
  "updatedAt"
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
  NOW(),
  NOW()
) ON CONFLICT (admissionnumber) DO UPDATE SET
  "userId" = EXCLUDED."userId",
  dateofbirth = EXCLUDED.dateofbirth,
  class = EXCLUDED.class,
  password = EXCLUDED.password,
  registrationstatus = EXCLUDED.registrationstatus;
