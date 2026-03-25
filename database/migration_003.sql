-- ============================================================
-- MIGRATION 003 — Add experiences table
-- ============================================================

USE placement_portal;

CREATE TABLE IF NOT EXISTS experiences (
    experience_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    company_name VARCHAR(100) NOT NULL,
    role_title VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    rating INT DEFAULT 5,
    status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_by INT,
    verified_at TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (verified_by) REFERENCES placement_staff(staff_id)
);
