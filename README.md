# Placement Eligibility Checker Portal

## Project Overview
A production-grade full-stack portal designed to manage university placement activities. The system ensures strict eligibility enforcement, manages multi-version resumes, and provides audit trails for student applications to ensure integrity.

## Tech Stack
- **Backend:** Node.js, Express.js
- **Database:** MySQL 8.0 (Single Source of Truth)
- **Authentication:** JWT (JSON Web Tokens)
- **Frontend:** React.js (Context API, Axios)

## Key Features

### 1. Dynamic Eligibility Engine
Jobs are created with specific criteria (Min CGPA, Semester, Allowed Departments). The system automatically filters jobs for students based on their profile data stored in the database. No hardcoded `if` statements are used for eligibility.

### 2. Resume Integrity & Audit Trail
The core differentiator of this system is its handling of resumes:
- **Versioning:** Every resume upload creates a new version in the `resume_versions` table.
- **Application Snapshot:** When a student applies, the specific version ID is linked to the application.
- **Audit Flag:** If a student edits their resume *after* applying, the system detects the modification and flags the application (`resume_updated_after_apply = TRUE`) in the Staff Dashboard.

### 3. Automated Ranking & Shortlisting
Applicants are automatically ranked using a weighted algorithm calculated directly in SQL:
- **Formula:** `(CGPA * 10 * 0.7) + (Activity Points * 0.3)`
- Staff can view this ranked list and Shortlist or Reject candidates.

### 4. Role-Based Dashboards
- **Student:** View Profile, Upload Resume, View Eligible Jobs, Apply.
- **Staff:** Post Jobs, Audit Applications, Shortlist Candidates.
- **Admin:** Approve or Deactivate Placement Staff accounts.

## Setup Instructions

### 1. Database Setup
   - Run the script `database/schema.sql` in your MySQL instance to create the `placement_portal` database and tables.

### 2. Backend Setup
   Create a `.env` file in the `server` directory:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=placement_portal
   JWT_SECRET=your_jwt_secret
   ```
   ```bash
   cd server
   npm install
   npm start
   ```

### 3. Frontend Setup
   ```bash
   cd client
   npm install
   npm start
   ```

## Usage Guide & Workflows

### Student Workflow
1. **Register/Login**: Create a student account with academic details (CGPA, Dept).
2. **Upload Resume**: Go to Dashboard -> Upload Resume. This creates Version 1.
3. **Apply**: View "Eligible Jobs". If your profile matches criteria, click Apply.

### Staff Workflow
1. **Post Job**: Login as Staff -> Create Job -> Define Criteria (e.g., Min CGPA 7.0).
2. **Shortlist**: Go to "Shortlist & Rank" -> Select Job -> View ranked students -> Click Shortlist.
3. **Audit**: Go to "Audit Applications" to see if any applicant has tampered with their resume after applying.

### Admin Workflow
1. **Login**: Login as an Admin user.
2. **Manage Staff**: View list of registered Placement Staff. Click "Approve" to activate their account or "Deactivate" to revoke access.
3. **Access Control**: Users with `INACTIVE` status (e.g., unapproved staff) will be blocked from logging in.

### Testing the "Audit Loop"
To verify the integrity feature:
1. Login as **Student** and apply for a job.
2. **Upload a new resume** (Version 2).
3. Login as **Staff** and check the **Audit Applications** tab.
4. You will see the student flagged with status **FLAGGED**.

## API Endpoints
- `POST /api/auth/register`: Register new user.
- `POST /api/staff/jobs/create`: Create job with criteria.
- `GET /api/student/jobs/eligible`: Fetch jobs matching student profile.
- `GET /api/admin/staff`: List all placement staff.
- `GET /api/staff/jobs/:jobId/applicants`: Get ranked applicants.

################# first content ###########
# Placement Eligibility Checker Portal

## Project Overview
A production-grade portal for managing university placements. It features dynamic eligibility checking, multi-version resume management, and audit trails for resume modifications post-application.

## Architecture
- **Frontend**: React.js (SPA)
- **Backend**: Node.js + Express
- **Database**: MySQL 8.0 (Single Source of Truth)
- **Auth**: JWT (Stateless)

## Folder Structure
- `client/`: React frontend.
- `server/`: Express API.
    - `services/`: Business logic (Resume versioning, Eligibility).
    - `controllers/`: Request handling.
- `database/`: SQL Schema.

## Setup Instructions

1. **Database**:
   - Create a MySQL database.
   - Run `database/schema.sql`.

2. **Backend**:
   ```bash
   cd server
   npm install
   # Create .env file with DB_HOST, DB_USER, DB_PASSWORD, JWT_SECRET
   npm start
