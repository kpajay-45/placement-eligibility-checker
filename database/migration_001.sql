-- ============================================================
-- MIGRATION 001 — Add Missing Columns & Tables
-- Run this once on your live placement_portal database.
-- ============================================================

USE placement_portal;

-- ----------------------------------------------------------
-- 1. Add missing columns to 'students' table
--    (These are referenced by updateProfile but don't exist yet)
-- ----------------------------------------------------------
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS history_of_arrears INT DEFAULT 0 COMMENT 'Total number of backlogs/arrears',
  ADD COLUMN IF NOT EXISTS attendance_percentage DECIMAL(5,2) DEFAULT 100.00 COMMENT 'Attendance percentage';

-- ----------------------------------------------------------
-- 2. Create 'shortlists' table
--    (Stores each auto-generated shortlist event per job)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS shortlists (
    shortlist_id     INT AUTO_INCREMENT PRIMARY KEY,
    job_role_id      INT NOT NULL,
    generated_by     INT NOT NULL COMMENT 'staff_id of who triggered it',
    criteria_snapshot JSON NULL     COMMENT 'Snapshot of criteria used at generation time',
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_shortlist_job (job_role_id)   COMMENT 'Prevent duplicate shortlist for same job',
    FOREIGN KEY (job_role_id) REFERENCES job_roles(job_role_id) ON DELETE CASCADE,
    FOREIGN KEY (generated_by) REFERENCES placement_staff(staff_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------
-- 3. Create 'shortlist_members' table
--    (Individual students in a shortlist, with their rank score)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS shortlist_members (
    shortlist_id INT NOT NULL,
    student_id   INT NOT NULL,
    rank_score   DECIMAL(10,2) DEFAULT 0.00,
    added_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (shortlist_id, student_id),
    FOREIGN KEY (shortlist_id) REFERENCES shortlists(shortlist_id) ON DELETE CASCADE,
    FOREIGN KEY (student_id)   REFERENCES students(student_id)    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------
-- 4. Optional — Add index on applications.status
--    Speeds up filtering applicants by APPLIED/SHORTLISTED/REJECTED
-- ----------------------------------------------------------
ALTER TABLE applications
  ADD INDEX IF NOT EXISTS idx_applications_status (status);

-- ----------------------------------------------------------
-- Verify
-- ----------------------------------------------------------
-- After running, check with:
--   DESCRIBE students;
--   SHOW TABLES;
-- You should see history_of_arrears, attendance_percentage in students
-- and shortlists, shortlist_members in SHOW TABLES.
