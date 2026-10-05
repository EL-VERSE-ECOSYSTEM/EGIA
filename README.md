# EL GOODNEWS INT'L ACADEMY - Complete School Management System

## Project Overview
Build a comprehensive school management application with RBAC (Role-Based Access Control) and ABAC (Attribute-Based Access Control) for four user roles: Admin, Teacher, Parent, and Student. Features include CBT (Computer-Based Testing) with dual video/audio webcam proctoring, automated grading, Korapay payment integration, class-level management (JSS1-SSS3), messaging system, real-time notifications, and dispute/support ticketing system.

## Technical Specifications

### Frontend
- **Framework**: Next.js 16 (App Router) with TypeScript
- **UI Library**: React 19
- **Styling**: Tailwind CSS v4 + Shadcn/ui components
- **State Management**: Zustand + TanStack Query
- **Form Handling**: React Hook Form + Zod validation
- **Charts**: Recharts
- **PDF Generation**: jsPDF + pdf-lib
- **Real-time**: Supabase Realtime Channels
- **Payment**: Korapay SDK & Direct Webhooks
- **File Upload**: Uploadthing + Supabase Storage
- **Proctoring**: Dual Video + Audio WebRTC Media Streams with AI Telemetry

### Backend
- **API**: Next.js Server Actions & App Router Handlers
- **Authentication**: Supabase Auth (PKCE Flow) + SSR Cookie Sessions
- **Database ORM**: Drizzle ORM + PostgreSQL (`postgres` driver)
- **Validation**: Zod
- **Email & Push Notifications**: Firebase Cloud Messaging (FCM) + VAPID Web Push
- **File Storage**: Supabase Storage Buckets
- **Real-time**: Supabase Postgres Changes Subscriptions
- **Payment**: Korapay Webhook Verification (HMAC SHA-256)
- **PDF Parsing**: pdf-parse + Tesseract.js
- **AI Grading**: Google Generative AI (Gemini)

### Database
- **Primary**: PostgreSQL (Supabase Session Pooler on Port 6543)
- **Realtime**: Supabase Realtime Server

## Environment Configuration

Ensure the following variables are configured in `.env` or Vercel environment settings:

```text
NEXT_PUBLIC_SUPABASE_URL=https://qpqkpqnoffjlnjbxoiwz.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_mRo_lTAhIWmPNPb4LJFYkw_wDvhboyW
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_URL=https://qpqkpqnoffjlnjbxoiwz.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_mRo_lTAhIWmPNPb4LJFYkw_wDvhboyW
SUPABASE_SECRET_KEY=sb_secret_Tu60LjPwLiWq2n1ramQqpg_kRmTwbFF
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWKS_URL=https://qpqkpqnoffjlnjbxoiwz.supabase.co/auth/v1/.well-known/jwks.json
DATABASE_URL=postgresql://postgres.qpqkpqnoffjlnjbxoiwz:Amunra123%40%40@aws-1-eu-west-1.pooler.supabase.com:6543/postgres
SUPABASE_DATABASE_POOLER_URL=postgresql://postgres.qpqkpqnoffjlnjbxoiwz:Amunra123%40%40@aws-1-eu-west-1.pooler.supabase.com:6543/postgres
```

Run the connection verification script to test Supabase Auth and Database connection:

```bash
npm run verify:supabase
```

## Role-Based Color Scheme
| Role | Primary Color | Gradient | Badge Color | Icon Color |
| :--- | :--- | :--- | :--- | :--- |
| **Student** | Orange | `from-orange-500 to-amber-600` | `bg-orange-100 text-orange-800` | `#F97316` |
| **Parent** | Green | `from-emerald-500 to-green-600` | `bg-green-100 text-green-800` | `#10B981` |
| **Teacher** | Purple | `from-purple-500 to-violet-600` | `bg-purple-100 text-purple-800` | `#8B5CF6` |
| **Admin** | Gold | `from-amber-500 to-yellow-600` | `bg-yellow-100 text-yellow-800` | `#F59E0B` |

## Key Features & Security Architecture
- **Dual Stream CBT Proctoring**: Actively captures HD video and audio media streams (`video: true, audio: true`) with automatic fallback to video-only if audio hardware is absent, along with real-time frame analysis telemetry.
- **Hitch-Free Real-Time Authentication**: Authenticates users seamlessly via Email, Staff ID (`-ST-`), or Admission Number with automatic profile self-healing and identity context resolution.
- **Fail-Closed Multi-Tenant Security**: Enforces school-scoped filtering across Server Actions, API routes, and Drizzle SQL queries (`schoolId` & `userId`).
- **Korapay Payment Verification**: Verifies live Korapay checkout references and webhook signatures using constant-time timing-safe comparisons (`crypto.timingSafeEqual`).
- **Push & Real-Time Notification Bell**: Delivers FCM push notifications and live in-app alerts via Supabase Realtime subscriptions with accessible unread status tracking.
