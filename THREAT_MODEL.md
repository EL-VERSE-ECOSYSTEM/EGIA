# Threat Model & Risk Analysis

## Threat Actors & Vectors

### 1. Cross-Tenant Data Access (IDOR)
- **Threat:** Malicious user attempting to view or alter records from another school.
- **Mitigation:** Strict `schoolId` SQL filtering in server actions and PostgreSQL Row-Level Security (RLS) policies.

### 2. Payment Replay Attacks & Forgery
- **Threat:** Attacker attempting to spoof Korapay webhooks or replay return URLs to gain free renewals.
- **Mitigation:** HMAC SHA256 signature verification, exact amount/currency validation, and idempotent status transitions.

### 3. CBT Academic Cheating
- **Threat:** Students opening multiple tabs, searching online answers, or sharing exam sessions.
- **Mitigation:** Real-time tab-switch detection, webcam proctoring snapshots, and server-side start/end schedule bounds in `assessment_schedule`.

### 4. Account Hijacking & OTP Interception
- **Threat:** Unauthorized password reset requests.
- **Mitigation:** High-priority FCM push notification OTP dispatches to active registered user devices and 3-day password change cooldown intervals.
