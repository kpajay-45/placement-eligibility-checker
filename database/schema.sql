-- ===============================
-- DATABASE INITIALIZATION
-- ===============================
CREATE DATABASE IF NOT EXISTS placement_portal;
USE placement_portal;

-- ===============================
-- 1. USERS (AUTH & ROLES)
-- ===============================
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('STUDENT', 'PLACEMENT_STAFF', 'ADMIN') NOT NULL,
    status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===============================
-- 2. STUDENTS
-- ===============================
CREATE TABLE students (
    student_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    register_number VARCHAR(20) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    department VARCHAR(50) NOT NULL,
    semester INT NOT NULL,
    cgpa DECIMAL(4,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ===============================
-- 3. PLACEMENT STAFF
-- ===============================
CREATE TABLE placement_staff (
    staff_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    name VARCHAR(100),
    designation VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ===============================
-- 4. COMPANIES
-- ===============================
CREATE TABLE companies (
    company_id INT AUTO_INCREMENT PRIMARY KEY,
    company_name VARCHAR(100) NOT NULL,
    industry VARCHAR(50),
    description TEXT,
    visiting_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===============================
-- 5. JOB ROLES
-- ===============================
CREATE TABLE job_roles (
    job_role_id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    role_title VARCHAR(100) NOT NULL,
    job_description TEXT,
    location VARCHAR(50),
    salary_package VARCHAR(20),
    application_deadline TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE
);

-- ===============================
-- 6. ELIGIBILITY CRITERIA (DYNAMIC)
-- ===============================
CREATE TABLE eligibility_criteria (
    criteria_id INT AUTO_INCREMENT PRIMARY KEY,
    job_role_id INT NOT NULL,
    min_cgpa DECIMAL(4,2) DEFAULT 0.00,
    min_semester INT DEFAULT 1,
    eligible_departments TEXT,
    min_activity_points INT DEFAULT 0,
    max_backlogs INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_role_id) REFERENCES job_roles(job_role_id) ON DELETE CASCADE
);

-- ===============================
-- 7. SKILLS (MASTER)
-- ===============================
CREATE TABLE skills (
    skill_id INT AUTO_INCREMENT PRIMARY KEY,
    skill_name VARCHAR(50) UNIQUE NOT NULL
);

-- ===============================
-- 8. STUDENT SKILLS (M:N)
-- ===============================
CREATE TABLE student_skills (
    student_id INT,
    skill_id INT,
    proficiency_level ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED') DEFAULT 'INTERMEDIATE',
    PRIMARY KEY (student_id, skill_id),
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(skill_id) ON DELETE CASCADE
);

-- ===============================
-- 9. ACTIVITY POINTS
-- ===============================
CREATE TABLE activity_points (
    activity_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    activity_type VARCHAR(100) NOT NULL,
    points INT NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    verified_by INT,
    verified_at TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (verified_by) REFERENCES placement_staff(staff_id)
);

-- ===============================
-- 10. RESUMES (MULTIPLE PER STUDENT)
-- ===============================
CREATE TABLE resumes (
    resume_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    resume_title VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
);

-- ===============================
-- 11. RESUME VERSIONS (AUDIT)
-- ===============================
CREATE TABLE resume_versions (
    version_id INT AUTO_INCREMENT PRIMARY KEY,
    resume_id INT NOT NULL,
    version_number INT NOT NULL,
    resume_url VARCHAR(255) NOT NULL,
    edited_by ENUM('STUDENT', 'PLACEMENT_STAFF') NOT NULL,
    edited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (resume_id) REFERENCES resumes(resume_id) ON DELETE CASCADE
);

-- ===============================
-- 12. APPLICATIONS
-- ===============================
CREATE TABLE applications (
    application_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    job_role_id INT NOT NULL,
    resume_id INT NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('APPLIED', 'SHORTLISTED', 'REJECTED', 'OFFERED') DEFAULT 'APPLIED',
    resume_updated_after_apply BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (job_role_id) REFERENCES job_roles(job_role_id) ON DELETE CASCADE,
    FOREIGN KEY (resume_id) REFERENCES resumes(resume_id),
    UNIQUE (student_id, job_role_id)
);

-- ===============================
-- 13. ELIGIBILITY RESULTS (SNAPSHOT)
-- ===============================
CREATE TABLE eligibility_results (
    result_id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL,
    is_eligible BOOLEAN NOT NULL,
    remarks VARCHAR(255),
    evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES applications(application_id) ON DELETE CASCADE
);
