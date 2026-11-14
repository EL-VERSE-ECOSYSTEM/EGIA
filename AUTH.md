# Authentication & Identity Architecture

## Overview
EL LEARNERS APP uses a unified multi-identity authentication architecture powered by Supabase Auth (GoTrue) and PostgreSQL RBAC/ABAC role tables.

## Supported Sign-In Identifiers
Users can log into the platform using any of the following credentials:
1. **Email Address:** `user@example.com`
2. **Student Admission Number:** `ELGO-S-123456` (school prefix, level, and unique number)
3. **Staff ID:** `STF/2026/042`
4. **School Registration Code:** Uniquely generated 8-character code (e.g., `SCH12345`)

## Dashboard Roles & Access Control
- `SUPER_ADMIN`: Platform-wide governance across all schools (`/dashboard/super-admin/overview`).
- `ADMIN` / `SCHOOL_ADMIN`: Single school administration (`/dashboard/admin/overview`).
- `TEACHER`: Educator portal, CBT grading, attendance, and lesson notes (`/dashboard/teacher/overview`).
- `STUDENT` / `PUPIL`: CBT exams, games, study materials, and timetable (`/dashboard/student/overview`).
- `PARENT`: Multi-ward academic monitoring, report cards, and fee payments (`/dashboard/parent/overview`).

## Session inactivity and CBT fee clearance

- The browser signs authenticated users out after 150 seconds without pointer, keyboard, touch, or scroll activity. Activity timestamps are shared between same-origin tabs/windows; the guard signs out through Supabase Auth and returns the user to sign-in.
- Student and pupil CBT access requires at least 75% of the active fee schedule for their school, class, and department to be covered by successful, approved, or cleared payment records. The server checks clearance when listing CBTs, verifying exam codes, loading questions, starting a session, and submitting results.
- Exam access codes are verified server-side and are never included in the student CBT listing response. Invalid attempts are rate-limited per signed-in user.
- When a student is below the fee threshold, the student CBT page shows the amount/progress and the linked parent portal displays a reminder. A push/in-app reminder is sent to the student and linked parent at most once per 24 hours when either portal checks clearance.

The inactivity timer is a browser-session control; API/server authorization and Supabase token/session expiry remain necessary and must not rely on the client timer as an authorization boundary.
