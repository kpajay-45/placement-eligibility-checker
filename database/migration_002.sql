-- ============================================================
-- MIGRATION 002 — Update activity_points table
-- ============================================================

USE placement_portal;

-- 1. Add new columns
ALTER TABLE activity_points
ADD COLUMN proof_url VARCHAR(500) AFTER points,
ADD COLUMN rejection_reason TEXT AFTER verified_at,
ADD COLUMN status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING' AFTER rejection_reason;

-- 2. Migrate data from 'verified' boolean to 'status' enum
-- If verified = TRUE, status = 'APPROVED'
-- If verified = FALSE, status = 'PENDING'
UPDATE activity_points SET status = 'APPROVED' WHERE verified = TRUE;
UPDATE activity_points SET status = 'PENDING' WHERE verified = FALSE;

-- 3. Drop the old boolean column
ALTER TABLE activity_points DROP COLUMN verified;

-- 4. Verify (Optional: check with DESCRIBE activity_points)
