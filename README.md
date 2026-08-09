# EL GOODNEWS INT'L ACADEMY - Complete School Management System

## Project Overview
Build a comprehensive school management application with RBAC (Role-Based Access Control) and ABAC (Attribute-Based Access Control) for four user roles: Admin, Teacher, Parent, and Student. Features include CBT (Computer-Based Testing), automated grading, Korapay payment integration, class-level management (JSS1-SSS3), messaging system, and dispute/support ticketing system.

## Technical Specifications

### Frontend
- **Framework**: Next.js 14 (App Router) with TypeScript
- **UI Library**: React 18
- **Styling**: Tailwind CSS + Shadcn/ui components
- **State Management**: Zustand + TanStack Query
- **Form Handling**: React Hook Form + Zod validation
- **Charts**: Recharts + Tremor
- **PDF Generation**: jsPDF + react-pdf
- **Real-time**: Socket.io client + Pusher
- **Payment**: Korapay SDK
- **File Upload**: React Dropzone + Uploadthing
- **Animations**: Framer Motion

### Backend
- **API**: Next.js API Routes + tRPC (optional)
- **Authentication**: Better Auth / NextAuth.js
- **Database ORM**: Drizzle ORM / Prisma ORM
- **Validation**: Zod
- **Email**: Resend + React Email
- **File Storage**: Uploadthing / AWS S3
- **Background Jobs**: BullMQ + Redis
- **Real-time**: Socket.io server + Redis pub/sub
- **Payment**: Korapay API
- **PDF Parsing**: pdf-parse + Tesseract.js
- **AI Grading**: OpenAI GPT-4o / Claude API / Gemini API

### Database
- **Primary**: PostgreSQL (Neon / Supabase)
- **Caching**: Redis (Upstash)

## Role-Based Color Scheme
| Role | Primary Color | Gradient | Badge Color | Icon Color |
| :--- | :--- | :--- | :--- | :--- |
| **Student** | Orange | `from-orange-500 to-amber-600` | `bg-orange-100 text-orange-800` | `#F97316` |
| **Parent** | Green | `from-emerald-500 to-green-600` | `bg-green-100 text-green-800` | `#10B981` |
| **Teacher** | Purple | `from-purple-500 to-violet-600` | `bg-purple-100 text-purple-800` | `#8B5CF6` |
| **Admin** | Gold | `from-amber-500 to-yellow-600` | `bg-yellow-100 text-yellow-800` | `#F59E0B` |

---

## Complete Setup Guide: PaddleOCR, DeepSeek OCR-2 & Groq API

This guide provides step-by-step instructions for setting up all three AI solutions for your EL GOODNEWS INT'L ACADEMY CBT system.

### 📌 Quick Decision Guide

| Solution | Best For | Setup Difficulty | Hardware Required |
| :--- | :--- | :--- | :--- |
| **PaddleOCR** | Mixed-format PDFs with complex layouts | Easy | CPU or GPU (4GB+ RAM) |
| **DeepSeek OCR-2** | Scanned/handwritten documents | Moderate | 8GB+ RAM, GPU recommended |
| **Groq API** | Fastest processing, no local GPU | Very Easy | None (internet required) |

---

### 1️⃣ PaddleOCR with PP-StructureV3 Setup

#### Installation Steps

**Step 1: Create Conda Environment (Recommended)**
```bash
conda create -n paddleocr python=3.8 -y
conda activate paddleocr
```

**Step 2: Install PaddlePaddle Framework**
- For CPU-only systems:
  ```bash
  python -m pip install paddlepaddle==3.2.0 -i https://www.paddlepaddle.org.cn/packages/stable/cpu/
  ```
- For GPU (CUDA 11.8):
  ```bash
  python -m pip install paddlepaddle-gpu==3.1.0 -i https://pypi.tuna.tsinghua.edu.cn/simple
  ```

**Step 3: Install PaddleOCR**
```bash
python -m pip install "paddleocr[all]"
```

**Step 4: Install Additional Dependencies**
```bash
pip install openpyxl beautifulsoup4
```

---

### 2️⃣ DeepSeek OCR-2 Setup

#### Installation Steps

**Step 1: Clone Repository**
```bash
git clone https://github.com/Dogacel/Universal-DeepSeek-OCR-2.git
cd Universal-DeepSeek-OCR-2
```

**Step 2: Create Environment**
```bash
conda create -n deepseek-ocr2 python=3.12.9 -y
conda activate deepseek-ocr2
```

**Step 3: Install Dependencies**
```bash
pip install -r requirements.txt
```

---

### 3️⃣ Groq API + Llama 3 Setup

#### Setup Steps

**Step 1: Get API Keys**
1. Get Groq API Key from [console.groq.com](https://console.groq.com)
2. Get Portkey API Key (optional) from [portkey.ai](https://portkey.ai)

**Step 2: Install Required Packages**
```bash
pip install groq langchain-groq portkey-ai openai
```

**Step 3: Set Environment Variables**
```bash
export GROQ_API_KEY="your-groq-api-key-here"
```

---

## Key Features
- **Mixed Question CBT**: Supports MCQ, Fill-in-the-Blank, True/False, and Short Answer.
- **CSV Import**: Support for bulk uploading questions via CSV.
- **AI-Powered Parsing**: Automatically converts PDF/CSV to CBT format using Gemini, Groq, or PaddleOCR.
- **Korapay Integration**: Seamless school fees and levy payments.
- **Parent-Student Binding**: Real-time monitoring of child performance.
- **Messaging & Disputes**: Integrated communication and ticketing system.

## Production payment configuration

Configure the following variables in Vercel (and in a local `.env.local` file):

```text
NEXT_PUBLIC_SITE_URL=https://goodnews-app-mu.vercel.app
KORAPAY_CHECKOUT_LINK=https://checkout.korapay.com/pay/BHba4zdsceZDgyW
KORAPAY_PUBLIC_KEY=pk_live_...
KORAPAY_SECRET_KEY=sk_live_...
```

Set Korapay's checkout redirect URL to `https://goodnews-app-mu.vercel.app/payment/return`. The application verifies the returned payment reference with Korapay on the server before activating an account or marking a ledger entry successful.
# EGIA

## Supabase configuration

The app uses Supabase Auth and Supabase Postgres. Copy `.env.example` to `.env.local`, then set `SUPABASE_DATABASE_POOLER_URL` to the Supabase **Session pooler** URI from Dashboard → Connect → Connection pooling. `DATABASE_URL` remains supported as a fallback, but production must not use the direct `db.<project>.supabase.co` database host.

Apply the SQL files in `supabase/migrations/` to the connected Supabase project, in filename order. The access migration grants the server-only service role its required Data API permissions while leaving browser access limited to the public subject catalogue.

Run the non-persistent connection test after configuration:

```bash
npm run verify:supabase
```

It verifies Auth, reads the database, and performs a transaction-scoped temporary-table write that is dropped automatically.
# EL GOODNEWS INT'L ACADEMY

## Realtime setup

The application uses Supabase Auth cookies for SSR and Postgres Changes for
live assessments, results, payments, messages, notifications, library stock and
attendance. Add these Vercel environment variables before deploying:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=             # server-only; never prefix with NEXT_PUBLIC_
SUPABASE_DATABASE_POOLER_URL=          # Supabase Session pooler URI, sslmode=require
SUPABASE_WEBHOOK_SECRET=               # required by /api/webhooks/supabase
NEXT_PUBLIC_APP_URL=
```

Apply `supabase/migrations/202608080001_enable_realtime.sql` through the
Supabase SQL editor or the Supabase CLI. The migration is idempotent and skips
tables that are not present in the production schema. Realtime still observes
RLS, so ensure each role has a matching `SELECT` policy before expecting an
event in the browser.

Client features are available through `useRealtimeSubscription` and
`useRealtimeQuery`; the root `RealtimeProvider` supplies React Query, toasts,
and the live connection badge.

## FCM device notifications and database webhooks

Set the following deployment-only variables. Never commit a Firebase service
account or the webhook secret.

```text
FIREBASE_SERVICE_ACCOUNT_JSON=          # complete service-account JSON, one line
NEXT_PUBLIC_FCM_VAPID_KEY=              # Firebase Console → Cloud Messaging → Web Push
SUPABASE_WEBHOOK_SECRET=                # long random value shared with Supabase
```

Apply the FCM migrations in `supabase/migrations/` in filename order. Configure
Supabase Database Webhooks for `payments`, `results`, and `attendance_records`
to POST to `/api/webhooks/supabase` with the `x-webhook-secret` header. The
processor records idempotency state in `webhook_events`; transient failures
return HTTP 500 so Supabase retries safely. Browser tokens are unique per
device profile and are reassigned on sign-in to prevent notifications leaking
between users of a shared device.
