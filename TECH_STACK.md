# TECHNICAL STACK

## Project: EL GOODNEWS INT'L ACADEMY Portal

---

## 1. Frontend Framework & Presentation Layer
*   **Framework:** **Next.js 16 (App Router)**
    *   Leverages highly optimized React Server Components (RSC) for initial page loads and secure backend operations.
    *   Leverages Client Components (`'use client'`) for dynamic, responsive user dashboards.
*   **Language:** **TypeScript (ES6+)**
    *   Statically typed code interfaces ensure compiled safety and complete type validation.
*   **Styling Engine:** **Tailwind CSS**
    *   Utility-first framework with customized colors, gradients, and fully fluid responsive grids.
*   **UI Component Library:** **Shadcn UI & Radix Primitives**
    *   Provides high-fidelity accessible select fields, forms, badges, modals, and overlay structures.
*   **Iconography:** **Lucide React**

---

## 2. Backend, Server Actions, & APIs
*   **Serverless Operations:** **Next.js Server Actions**
    *   Secure server-side mutations, account creation handlers, dynamic fee checkouts, and notification dispatches without writing standalone Node.js REST API controllers.
*   **Database ORM Layer:** **Drizzle ORM**
    *   Type-safe SQL query generation, parameterized transactions, dynamic database schema syncs, and relation mapping.
*   **Database Driver:** **Postgres-JS**
    *   Highly optimized database connection pool built specifically for serverless deployments.

---

## 3. Storage, Auth, & Live Third-Party Integrations
*   **Authentication & Session Management:** **Supabase Auth & Supabase SSR**
    *   Enforces secure user registration, email validation callback dispatches, secure HTTPOnly browser cookie management, and standard middleware session token refreshers.
*   **Primary Database Storage:** **Supabase PostgreSQL**
    *   Scalable relational database with custom tables, primary indexes, constraints, and cascading rules.
*   **Video Class Storage / Media Hosting:**
    *   Pre-recorded classes, video streams, CBT Webcam files, and passport photos are hosted on secure bucket storage or stored as dynamic URL paths in PostgreSQL.
*   **Payment Gateway Integration:** **Korapay**
    *   Supports credit cards, USSD, and bank transfers through Korapay's merchant checkout gateway APIs.
