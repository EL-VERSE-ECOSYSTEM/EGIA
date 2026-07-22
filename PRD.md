# PRODUCT REQUIREMENT DOCUMENT (PRD)

## Project: EL GOODNEWS INT'L ACADEMY Portal

---

## 1. Product Overview & Objectives
EL GOODNEWS INT'L ACADEMY is an all-in-one School Management System built to facilitate digital transformations in school administration, parents communication, automated fees billing, academic performance tracking, and online assessment execution.

### Target Audience
*   **Students/Pupils:** Browse searchable digital textbook materials, take proctored CBT tests and weekend assignments, play learning games, watch recorded virtual classroom video lectures, and track personal results.
*   **Parents/Guardians:** Securely monitor their wards' profiles, pay school fees (tuition, textbooks, registration) with automatic online payment routing or upload transfer receipts, track billing, and view approved report cards.
*   **Teachers/Educators:** Schedule virtual video classes, publish learning notes, compile terminal report cards, create examinations/CBT assessments, review anti-cheat proctoring video playbacks, and manage personal salary wallet payouts.
*   **Administrators:** Manage global academic sessions, endorse or reject terminal report card submissions, approve manual fee transfer receipts, manage permissions, and track global collectables.

---

## 2. Scope of Requirements & Key Feature Modules

### A. Authentication & Automated Credentials
*   **Unique Credentials Allocation:**
    *   **Student Registration:** Dynamically generates a unique 6-digit Admission Number (e.g. `GODXXXXXX`).
    *   **Staff/Teacher Onboarding:** Dynamically allocates a unique Staff ID prefixed with `EGIA-ST-`.
*   **Dual-Login Portal:** Supports logging in using either standard Email Address or the generated credentials (Admission Number for students, Staff ID for teachers).
*   **Authentication Engine:** Connected to live **Supabase Auth** with email authentication and automated role-based mapping into Postgres user tables.

### B. Secure Payments Ecosystem (Korapay Integrated)
*   **Direct Payments Redirection:** All online card payments, activation fees, and tuition collections are securely processed by routing parents to the unified, official Korapay checkout gateway link: `https://checkout.korapay.com/pay/BHba4zdsceZDgyW`.
*   **Student Activation Fee:** Student activation strictly requires a prepaid ₦2,100 session registration fee payable only online through the Korapay Checkout Link. Upon return from successful checkout, a successful payment modal displays their unique generated Admission Number for easy copying.
*   **Flexible School Fees installments:** Parents can pay tuition/materials in structured installment schedules.
*   **Manual Bank Transfer Fallback:** Parents can opt to copy First Bank or GT Bank details to perform manual transfers and upload payment slips for manual administrative reconciliation, strictly permitted for School Fees/Tuition only.

### C. Searchable Digital Library & Learning Catalog
*   **Google-Like Search Engine:** A high-performance digital library page supporting keyword-splitting and exact-phrase scanning directly against the database (`library_books` table) with real-time feedback.
*   **Multi-Faceted Filters:** Allows students to filter materials by Category (Textbooks, Past Questions, Class Notes), Subject, and Class levels spanning Primary 3 through SSS 3.
*   **Document Reader & Playback:** Features a document preview drawer with page zooms and pages lock previews alongside custom video tutorials.

### D. Anti-Cheat Proctored CBT & Webcam Streams
*   **MediaRecorder Surveillance:** CBT assessments and weekend assignments dynamically request webcam permissions and stream recording using HTML5 MediaRecorder.
*   **AI Proctoring Simulation:** Real-time triggers track Yaw, Pitch, Roll angles, object intrusion (phones/books), and window defocusing. Displays warning modals and automatically submits the assessment upon exceeding 3 cumulative warning counts.
*   **Historical Video Storage:** Base64 WebM surveillance logs are stored in the PostgreSQL database for Teacher/Admin verification.

### E. Virtual Video Classes
*   **Classrooms Broadcast:** Teachers can schedule live video classes or upload recorded lessons.
*   **Interactive Student Feedbacks:** Students browse video streams and ask questions directly under the playback screen. Teachers view questions on their dashboard and post replies.

### F. Academic Grading & Endorsement Pipelines
*   **Compile Terminal Results:** Teachers compile metrics, term weightings, and marks.
*   **Endorsement Pipeline:** School Admins review, endorse, or reject terminal reports. Approved cards are dynamically rendered as downloadable PDFs or canvas-drawn PNGs.

---

## 3. Non-Functional Requirements & PWA Standalone Config
*   **PWA Downloadability:** Fully equipped with offline caching and Apple standalone capabilities.
*   **Security default:** Implements X-Frame-Options, X-Content-Type-Options, strict session checks, and parameterized SQL queries to prevent injection vectors.
