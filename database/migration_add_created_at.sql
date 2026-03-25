-- Migration: Add missing columns to activity_points table

USE placement_portal;

-- Add created_at if missing
ALTER TABLE activity_points ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Also add other columns that might be missing in schema.sql but present in DB or needed
-- Based on diag_db.js output, proof_url, rejection_reason, status are ALREADY in the DB.
-- But if someone else runs schema.sql, they should have it. 
-- Thus, I will only add created_at here if it's the only one missing from actual DB.
