# Security Policy & Architecture

## Overview
EL LEARNERS APP is built with defense-in-depth security principles to protect student, educator, parent, and institutional data across all system roles.

## Core Security Pillars

### 1. Multi-Tenant Data Isolation
- **School Tenancy (`schoolId`):** All database queries, server actions, and storage access paths strictly filter by the authenticated user's `schoolId`.
- **Row-Level Security (RLS):** Supabase PostgreSQL policies enforce access controls at the database level based on JWT claims (`school_id`, `role`).

### 2. Authentication & Credential Security
- **Supabase Auth & Password Hash Protection:** Cryptographic password hashing (Bcrypt/Argon2) handled securely by Supabase GoTrue Auth.
- **Timing-Safe Operations:** Constant-time comparison (`crypto.timingSafeEqual`) used for all webhook signature verification and secret token comparisons.
- **Identity Resolution:** Multi-identity sign-in supports Admission Numbers, Staff IDs, and School Registration Codes with dynamic role resolution.

### 3. Payment Gateway Security (Korapay)
- **HMAC SHA256 Webhook Signatures:** All incoming payment webhooks from Korapay are verified using HMAC SHA256 signatures before processing.
- **Amount & Currency Validation:** Exact-to-the-cent amount verification against expected database records before granting active registration or renewal status.
- **Idempotency Safeguards:** Payment status updates execute only on initial pending-to-success status transitions.

### 4. Push Notification Security (FCM)
- **High-Priority FCM Dispatches:** OTP verification codes and login security alerts dispatched directly to active registered devices in `user_fcm_tokens`.

### 5. Reporting Vulnerabilities
If you discover a potential security issue, please notify our Security Response Team immediately at:
**elversetechnologies@gmail.com**
