# EL LEARNERS APP

EL Learners App is a full school management platform built for EL GOODNEWS INT'L ACADEMY and similar modern learning institutions. It brings together academic administration, parent communication, digital assessment, payment handling, and operational reporting in a single connected system.

The solution supports four main roles:
- Students
- Parents / Guardians
- Teachers / Staff
- Administrators

It is designed to help schools manage learning, communication, billing, performance tracking, and secure assessments from one system.

---

## Product Overview

EL Learners App is an all-in-one digital school platform built with Next.js, Supabase, PostgreSQL, and modern UI tooling. It provides a secure, role-aware portal where students can learn and submit work, parents can track fees and progress, teachers can manage classes and assessments, and administrators can oversee school operations.

The product includes:
- Role-based and school-scoped access control
- LMS-style learning experiences
- Online examinations with proctoring workflows
- School fee and registration payment flows
- Messaging and notification features
- Academic reporting and review pipelines
- Digital library and downloadable learning resources
- Real-time updates across the platform

---

## Core Modules

### 1. Authentication and Access Control
- Email and credential-based login
- Student admission number and staff ID support
- Role-aware access and school-scoped filtering
- Secure session handling with Supabase Auth and SSR cookie sessions

### 2. Student Experience
- Dashboard overview
- Class and subject access
- Digital library discovery
- CBT / assessment taking
- Performance tracking
- Assignment and learning engagement tools

### 3. Parent Experience
- Wards profile monitoring
- Payment status tracking
- School fee confirmation and reconciliation
- Report card access and academic updates
- Communication with school staff

### 4. Teacher Experience
- Class scheduling and lesson management
- Examination authoring and grading support
- Performance review and student monitoring
- Real-time communication and support workflows
- Salary and operational dashboard tasks

### 5. Admin Experience
- School-wide user and role management
- Approval and review workflows
- Report card endorsement
- Fee review and payment reconciliation
- System monitoring and access governance

### 6. Payments and Billing
- Online payment flows
- Registration and tuition payment support
- Manual bank transfer fallback flows
- Payment confirmation and verification logic

### 7. Assessments and Proctoring
- Computer-based testing
- Webcam/media capture support
- Warning and anti-cheat monitoring logic
- Historical recording review for academic integrity

### 8. Communication and Notifications
- In-app messages
- Real-time updates
- Push/FCM notification support
- Support ticket and dispute handling

---

## Key Features

- Multi-role school portal with RBAC and ABAC patterns
- School-scoped filtering across actions and queries
- Secure payments with gateway integration support
- Searchable digital library and learning catalog
- Proctored CBT with webcam and media-recording capabilities
- Automated academic grading and reporting workflows
- Real-time notification system
- Support and dispute management
- Responsive design for desktop and mobile access
- Production-ready architecture for modern school operations

---

## Tech Stack

### Frontend
- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- Shadcn UI / Radix UI
- Lucide icons
- Recharts

### Backend and Data
- Next.js server actions and app router APIs
- Supabase Auth
- PostgreSQL via Supabase
- Drizzle ORM
- Zod validation

### Integrations
- Supabase Realtime
- Supabase Storage
- Firebase / FCM for push notifications
- Korapay payment integration
- UploadThing uploads
- Google Generative AI support
- PDF generation and parsing utilities

### Security and Reliability
- Role-based and school-scoped permission checks
- Parameterized SQL and fail-closed access patterns
- Strong validation and server-side checks
- Secure cookies and server actions for authenticated requests

---

## Project Structure

```bash
.
├── app/                  # App router pages, routes, auth, dashboard, and landing pages
├── components/          # Shared UI and feature components
├── hooks/               # Reusable hooks
├── lib/                 # Business logic, auth helpers, resilience utilities, and integrations
├── public/              # Static assets
├── scripts/             # Database and deployment scripts
├── supabase/            # Supabase config and utilities
├── tests/               # Unit, resilience, and security tests
├── types/               # Shared TypeScript typing
├── utils/               # Common helper utilities
├── .env.example         # Environment template
├── package.json         # Project metadata, scripts, and dependencies
├── next.config.mjs      # Next.js config
├── README.md            # Project documentation
├── PRD.md               # Product requirements document
├── TECH_STACK.md        # Technical architecture notes
└── schema.sql           # Database schema
```

---

## Getting Started

### Prerequisites
- Node.js 20+
- npm, pnpm, or another package manager
- Supabase project
- PostgreSQL database access
- Optional: Firebase configuration for push notifications
- Optional: payment gateway credentials

### 1. Install dependencies

```bash
npm install
```

or

```bash
pnpm install
```

### 2. Configure environment variables

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env.local
```

Then update the values in `.env.local` with your project specifics, including:
- Supabase URL and keys
- Database connection string
- Payment keys
- Firebase/VAPID values
- SMTP and OTP configuration

A full example is available in [.env.example](.env.example).

### 3. Run the app locally

```bash
npm run dev
```

Then open:

```bash
http://localhost:3000
```

---

## Available Scripts

```bash
npm run dev         # Start the development server
npm run build       # Production build
npm run start       # Start the production server
npm run lint        # Lint the project
npm run typecheck   # TypeScript type validation
npm test            # Run the project test suite
npm run verify      # Run typecheck, lint, and tests
npm run verify:supabase   # Supabase verification checks
npm run db:tournament     # Run database schema script
```

---

## Environment Variables

At minimum, this app expects variables for:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_URL=
SUPABASE_SECRET_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
NEXT_PUBLIC_SITE_URL=
NEXT_SITE_URL=
OTP_SECRET=
```

The repo includes a fuller template in [.env.example](.env.example).

---

## Security Notes

This project is built with school-facing security in mind:
- School and user-scoped authorization checks
- Server-side validation before database actions
- Parameterized query patterns
- Protected app routes and authenticated server actions
- Secret handling via environment variables

---

## Product Notes

This app is intended for real educational institutions and combines the operational needs of a school with the digital experience expected in modern learning systems. The platform is ready for expansion and customization based on a school’s exact policy, reporting requirements, and workflow preferences.

---

## License

This project is currently configured as a private application for the institution it serves. If you are using it in a different environment, check your local deployment and legal/compliance requirements before production use.

---

## Status

EL Learners App is a feature-rich school management platform with role-based workflows, school operations, academic features, and secure digital infrastructure. It is intended to serve as a central platform for managing the learning lifecycle from admission to assessment to reporting.

