# Authentication & Identity Architecture

## Overview
EL LEARNERS APP uses a unified multi-identity authentication architecture powered by Supabase Auth (GoTrue) and PostgreSQL RBAC/ABAC role tables.

## Supported Sign-In Identifiers
Users can log into the platform using any of the following credentials:
1. **Email Address:** `user@example.com`
2. **Student Admission Number:** `EGIA/2026/001`
3. **Staff ID:** `STF/2026/042`
4. **School Registration Code:** Uniquely generated 8-character code (e.g., `SCH12345`)

## Dashboard Roles & Access Control
- `SUPER_ADMIN`: Platform-wide governance across all schools (`/dashboard/super-admin/overview`).
- `ADMIN` / `SCHOOL_ADMIN`: Single school administration (`/dashboard/admin/overview`).
- `TEACHER`: Educator portal, CBT grading, attendance, and lesson notes (`/dashboard/teacher/overview`).
- `STUDENT` / `PUPIL`: CBT exams, games, study materials, and timetable (`/dashboard/student/overview`).
- `PARENT`: Multi-ward academic monitoring, report cards, and fee payments (`/dashboard/parent/overview`).
