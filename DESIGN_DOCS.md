# DESIGN & ARCHITECTURE DOCUMENT

## Project: EL GOODNEWS INT'L ACADEMY Portal

---

## 1. System Architecture Diagram

```
                 +---------------------------+
                 |    Progressive Web App    |
                 |      (Next.js Client)     |
                 +-------------+-------------+
                               |
                               | (HTTPS / Server Actions)
                               v
                 +---------------------------+
                 |      Next.js Server       |
                 |      (App Router APIs)    |
                 +------+--------------+-----+
                        |              |
    (Supabase Auth API) |              | (Postgres Connection Pool)
                        v              v
                 +--------------+  +--------------+
                 |   Supabase   |  |   Postgres   |
                 |  Auth Server |  |   Database   |
                 +--------------+  +--------------+
```

---

## 2. Dynamic Data Flows

### A. Student Registration & Redirect Flow
1.  **Form Input:** Student fills name, email, class, and uploads a passport picture.
2.  **Server Transaction:** `registerStudent` triggers:
    *   Generates dynamic unique 6-digit Admission Number (e.g., `GOD104829`).
    *   Triggers live `Supabase.auth.signUp()` setting role and admission metadata.
    *   Inserts student profiles, credentials, and user role records in parallel.
3.  **Payment Redirect:** Saves generated Admission Number to `localStorage`, then redirects the browser window to the Korapay Checkout URL: `https://checkout.korapay.com/pay/BHba4zdsceZDgyW`.
4.  **Completion Callback:** Upon returning, the registration page checks `localStorage` for `pending_student_admission`, pops up the Successful Payment Modal with their copyable Admission Number, and clears the cache flag.

### B. Google-Like Search Engine Flow
1.  **Search Trigger:** On keyword/phrase input in the Student Library, client sends search text.
2.  **Keyword Splitting:** `searchLibraryBooks` splits query into individual searchable terms.
3.  **Exact Matching:** Matches terms against `title`, `author`, `content`, `subject`, and `classLevel` using PostgreSQL indexing or memory fallback.
4.  **UI Render:** Displays high-performance matched textbooks and interactive document downloads.

---

## 3. Database Schema Models & Relationships

### `user` Table
*   `id`: `text` (Primary Key, matches Supabase Auth UID)
*   `email`: `text` (Unique, index)
*   `name`: `text`
*   `image`: `text` (Profile Picture URL / Base64)

### `user_role` Table
*   `id`: `text` (Primary Key)
*   `userId`: `text` (Foreign Key -> user.id, Cascade)
*   `role`: `text` (ADMIN, TEACHER, PARENT, STUDENT)

### `student` Table
*   `id`: `text` (Primary Key)
*   `userId`: `text` (Foreign Key -> user.id, Cascade, Nullable for activation stages)
*   `admissionNumber`: `text` (Unique)
*   `firstName`: `text`
*   `lastName`: `text`
*   `class`: `text`
*   `profileImage`: `text`
*   `facialVerificationVideo`: `text` (Facial stream URL)

### `teacher` Table
*   `id`: `text` (Primary Key)
*   `userId`: `text` (Foreign Key -> user.id, Cascade)
*   `staffCode`: `text` (Unique Staff ID)
*   `firstName`: `text`
*   `lastName`: `text`
*   `profileImage`: `text`

### `library_books` Table
*   `id`: `text` (Primary Key)
*   `isbn`: `text` (Unique)
*   `title`: `text`
*   `author`: `text`
*   `category`: `text`
*   `content`: `text` (textbook chapter index)
*   `subject`: `text`
*   `class_level`: `text`

### `video_sessions` Table
*   `id`: `text` (Primary Key)
*   `title`: `text`
*   `class`: `text`
*   `subject`: `text`
*   `hostTeacherId`: `text` (Foreign Key -> teacher.id)
*   `recordingUrl`: `text`
*   `description`: `text`
