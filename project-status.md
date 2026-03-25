# Placement Portal — Project Status (Memory Bank)

## Project Info
- **Stack:** React (CRA) + MUI + Tailwind CSS | Node/Express | MySQL (mysql2)
- **Root:** `e:\Ajay-personal\College\PS - projects\Placement-Eligibility-checker\placement-portal`
- **Client:** `/client` → `http://localhost:3000`
- **Server:** `/server` → `http://localhost:5000`
- **DB:** MySQL — `placement_portal` | host: localhost | user: root | pass: kp45

---

## Latest Changes

### updateProfile — Empty String Sanitization Fix (Most Recent)
- **Bug:** `batch_year = ''` sent from the frontend caused MySQL `ER_TRUNCATED_WRONG_VALUE_FOR_FIELD` error because an empty string is not a valid integer
- **Root cause:** Frontend sends `''` (empty string) for unfilled numeric fields; `COALESCE('', batch_year)` still tries to write `''` to an INT column
- **Fix:** Added `toNullIfEmpty()` sanitizer in `studentController.updateProfile` — converts empty strings and `undefined` to `null` for all 9 profile fields before the SQL query runs
- **Effect:** `COALESCE(null, batch_year)` now correctly preserves the existing DB value when the field is left blank
- **File changed:** `server/controllers/studentController.js` (lines 39–51)

### getEligibleJobs — Department & Backlog Filter Fix
- `studentController.getEligibleJobs` → completely rewritten:
  - Old query only checked `min_cgpa` and `min_semester` in SQL — **missing department and backlog filters**
  - Now fetches all non-expired jobs with their criteria, then applies **4-way JS filter** matching `applyJob`:
    - CGPA ≥ min_cgpa ✓
    - Semester ≥ min_semester ✓
    - Student dept in `eligible_departments` (comma-split, case-insensitive) ✓
    - `history_of_arrears` ≤ `max_backlogs` ✓
  - This ensures "Applicable Companies" shows exactly the jobs a student qualifies for

- `studentController.getAppliedJobs` → added `LEFT JOIN resume_versions rv` on `MAX(version_number)` to return `resume_file_url`
- `StudentDashboard.jsx` → each application card now shows **🔗 View Resume** link (opens URL in new tab); shows "No resume URL stored" if empty
- `StudentDashboard.jsx` → removed orphaned `statusStyles` object (ESLint `no-unused-vars` warning gone)

- `studentController.getAppliedJobs` → added `logo_url`, `application_deadline`, `ORDER BY applied_at DESC`
- `StudentDashboard.jsx renderAppliedCompanies` → completely rewritten:
  - Plain table replaced with **card layout** (logo, company, role, status badge)
  - **Applied date** shown on every card (`📅 Applied 24 Feb 2025`)
  - **3-step status stepper** (Applied → Shortlisted → Offered); REJECTED shows a red note instead
  - **Filter chips**: All · Applied · Shortlisted · Offered · Rejected
  - **Ineligibility warning banner** (`is_eligible = 0` and not overridden)
  - **Resume-updated warning banner** (`resume_updated_after_apply = 1`)
  - **Eligibility override notice** (`is_overridden = 1`)
  - **Empty state** with "Browse Applicable Companies" CTA button

### Student Profile — Full Edit Enabled
- `StudentDashboard.jsx` → `full_name`, `register_number`, `department`, `semester`, `cgpa` now editable in Edit Profile
- `editForm` state and `fetchProfile` both updated to include all 9 fields
- Department auto-uppercased; helper text reminds to match job dept name exactly
- Backend `updateProfile` already supported all these fields (no backend change needed)

### Network Testing Setup
- `client/.env` → created with `REACT_APP_API_URL=http://10.130.21.118:5000/api`
- `api.js` → `baseURL` now reads from `process.env.REACT_APP_API_URL || 'http://localhost:5000/api'`
- `.vscode/settings.json` → `"css.lint.unknownAtRules": "ignore"` suppresses @tailwind lint warnings
- `studentRoutes.js` → fixed `authorizeRole('STUDENT')` → `authorizeRole(['STUDENT'])` (was string, not array)

### Admin Dashboard Enhancement
- `adminController.js` → 5 new endpoints: `getStats`, `getAllStudents`, `updateStudentStatus`, `getPendingActivityPoints`, `verifyActivityPoint`
- `adminRoutes.js` → added `GET /stats`, `GET /students`, `POST /students/status`, `GET /activity-points`, `POST /activity-points/verify`
- `AdminDashboard.jsx` → completely rewritten with 4 tabs:
  - **Overview** — 6 stat cards (students, staff, companies, drives, applications, placement %, pending activity points)
  - **Staff Management** — table with activate/deactivate
  - **Student Management** — full table with CGPA/arrears coloring, activate/deactivate
  - **Activity Points** — approve/reject card UI; sidebar shows live pending count badge

### Phase 1 — DB Migration SQL (`database/migration_001.sql`)
- `ALTER TABLE students` → adds `history_of_arrears INT DEFAULT 0`, `attendance_percentage DECIMAL(5,2) DEFAULT 100.00`
- Creates `shortlists` table (with UNIQUE on `job_role_id` to prevent duplicate shortlists)
- Creates `shortlist_members` table
- Adds index on `applications.status`
- ⚠️ **USER MUST RUN THIS SQL MANUALLY in MySQL before testing backlog/shortlist features**

### Phase 2–3 — Backend Fixes
- `authController.js` → min 6-char password validation
- `adminController.js` → status value guard (`ACTIVE`/`INACTIVE` only) + role check (only PLACEMENT_STAFF can be deactivated)
- `staffController.js` → company dedup by name (case-insensitive), past deadline rejection, audit query dedup (latest version join), new `GET /staff/profile` endpoint
- `studentController.js` → backlog check restored (`history_of_arrears <= max_backlogs`), 20-skill limit, snapshot updated with backlog data, dept check UPPER-cased
- `shortlistService.js` → 409 guard if shortlist already exists for a job
- `resumeService.js` → uses explicit `resumeId` to target correct resume (not title-match)
- `staffRoutes.js` → added `GET /profile` route
- `jobController.js` → emptied (was orphaned duplicate of studentController)

### Phase 4 — Frontend Auth & Route Security
- `App.js` → `/student` wrapped with `ProtectedRoute allowedRoles=['STUDENT']`, `/staff` wrapped with `allowedRoles=['PLACEMENT_STAFF']`
- `ProtectedRoute.jsx` → now uses `user` from `AuthContext` (checks JWT expiry) instead of raw localStorage
- **Shortlist & Rank Fixes:** Resolved 500 Internal Server Error in the "Shortlist & Rank" module by correcting the SQL query (changed `ap.verified = TRUE` to `ap.status = 'APPROVED'`).
- **Frontend Error Handling:** Improved error visibility in `StaffDashboard.jsx` by catching and displaying backend error messages.
- **SQL Consistency Audit:** Performed a comprehensive audit of backend SQL queries to ensure proper column qualification (e.g., `s.full_name`) and prevent ambiguity errors.
- **Staff Dashboard UI Fixes:** Resolved ESLint `no-undef` errors and JSX syntax issues in `StaffDashboard.jsx`.

### Phase 5 — Frontend UI Fixes
- `StaffDashboard.jsx` → fetches real staff name from `GET /staff/profile`; checkbox dept bug fixed (`.filter(d=>d)`)
- `StudentDashboard.jsx` → loading spinners (CircularProgress) for all data fetches; resume picker dialog when student has >1 resumes; active sidebar nav has `border-l-4 border-blue-600`; disabled Apply button uses `&.Mui-disabled` MUI sx (removed `!important`)

### Phase 6 — CSS
- `postcss.config.js` → **CREATED** (was missing — this was why Tailwind classes weren't applying)
- `index.css` → added `@tailwind base/components/utilities` directives + Inter font import; removed aggressive `*` reset that conflicted with MUI
- `StaffDashboard.css`, `StudentDashboard.css` → cleared (orphaned)

---

## Current Context
- [x] Integrate 'Salary Package' and 'Max Backlogs' fields in Staff Dashboard `PostJobForm` and `EditJob` dialog (Frontend + Backend).
- [x] Fix 500 Error when fetching job applicants: Corrected `Unknown column 'ap.verified'` in `staffController.js` and `shortlistService.js` by using `ap.status = 'APPROVED'`.
- [x] Verify Admin Dashboard correctly displays Package and Backlog metadata.
- Application is live on local network: `http://10.130.21.118:3000`
- Students can now fully edit their academic profile (name, reg no, dept, semester, CGPA)
- Applied Companies section is fully redesigned with cards, stepper, filters, and warning banners
- ⚠️ `migration_001.sql` still needs to be run on live MySQL if not already done

---

## Error Log

| Error | Cause | Fix |
|-------|-------|-----|
| Tailwind classes not rendering | `postcss.config.js` missing + `@tailwind` directives absent from `index.css` | Created `postcss.config.js` with tailwindcss + autoprefixer plugins; added `@tailwind base/components/utilities` to `index.css` |
| CSS base reset breaking MUI | Used `* { margin: 0; padding: 0 }` which fought MUI's internal styles | Removed manual `*` reset; rely on Tailwind's `@tailwind base` layer instead |
| `shortlists` table missing | Schema.sql was not fully applied to live DB | Added to `migration_001.sql`; user must run manually |
| `students` missing `history_of_arrears` / `attendance_percentage` | Live DB schema did not match schema.sql ALTERs | Added to `migration_001.sql` |
| Audit query returning duplicate rows | JOIN on `resume_versions` without version filter | Added `AND rv.version_number = (SELECT MAX...)` subquery |
| `getEligibleJobs` missing dept/backlog filter | SQL only checked CGPA + semester — department and backlog not filtered | Rewrote query to fetch all open jobs then apply 4-way JS filter matching `applyJob` |
| `getAppliedJobs` 500 error | Used `rv.file_url` in SQL but `resume_versions` column is actually `resume_url` | Fixed to `rv.resume_url as resume_file_url` |
| `ProtectedRoute` not checking JWT expiry | Read raw `localStorage` token string without decoding | Switched to `user` from `AuthContext` which already validates expiry on load |
| `updateProfile` crash: `ER_TRUNCATED_WRONG_VALUE_FOR_FIELD` | Frontend sends `''` for unfilled fields like `batch_year`; empty string is invalid for INT columns | Added `toNullIfEmpty()` sanitizer before SQL — converts `''`/`undefined` → `null` so `COALESCE` preserves existing value |

---

## DB Schema (Actual Live Tables)
`users`, `students`, `placement_staff`, `companies`, `job_roles`, `eligibility_criteria`, `applications`, `resumes`, `resume_versions`, `activity_points`, `departments`, `skills`, `student_skills`, `eligibility_results`

**Missing (need migration_001.sql):** `shortlists`, `shortlist_members`, `students.history_of_arrears`, `students.attendance_percentage`

---

## Next Steps
1. **Run `database/migration_001.sql`** on live MySQL (if not done yet)
2. **Test job visibility** — verify student only sees jobs matching their dept/CGPA/semester/backlogs
3. **Test resume view link** — upload a resume with a real Google Drive URL and verify it opens from Applied Companies
4. **Network testing** — update `client/.env` with current WiFi IP (`ipconfig`) before classroom sessions
