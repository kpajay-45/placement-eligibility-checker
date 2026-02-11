// const db = require('../config/db');
// const resumeService = require('../services/resumeService');

// exports.getProfile = async (req, res) => {
//   try {
//     // Join with users table to get the College Email (read-only)
//     const [rows] = await db.query(
//       `SELECT s.*, u.email as college_email 
//        FROM students s 
//        JOIN users u ON s.user_id = u.user_id 
//        WHERE s.user_id = ?`, 
//       [req.user.user_id]
//     );
    
//     // FIX: If student record is missing (e.g. legacy user), return basic user info instead of 404
//     if (rows.length === 0) {
//        const [users] = await db.query('SELECT email FROM users WHERE user_id = ?', [req.user.user_id]);
//        if (users.length > 0) {
//          return res.json({
//            user_id: req.user.user_id,
//            college_email: users[0].email,
//            full_name: '', register_number: '', cgpa: '', personal_email: ''
//          });
//        }
//        return res.status(404).json({ message: 'User not found' });
//     }
//     res.json(rows[0]);
//   } catch (err) {
//     res.status(500).json({ message: 'Server error' });
//   }
// };

// exports.uploadResume = async (req, res) => {
//   try {
//     const { fileUrl, title } = req.body;
    
//     // Get student_id (PK) using user_id (FK)
//     const [students] = await db.query('SELECT student_id FROM students WHERE user_id = ?', [req.user.user_id]);
//     if (students.length === 0) return res.status(404).json({ message: 'Student not found' });
    
//     const result = await resumeService.uploadResume(students[0].student_id, fileUrl, title, 'STUDENT');
//     res.json(result);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// exports.getResumes = async (req, res) => {
//   try {
//     const [students] = await db.query('SELECT student_id FROM students WHERE user_id = ?', [req.user.user_id]);
//     if (students.length === 0) return res.status(404).json({ message: 'Student not found' });
    
//     const [resumes] = await db.query('SELECT * FROM resumes WHERE student_id = ?', [students[0].student_id]);
//     res.json(resumes);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// exports.updateProfile = async (req, res) => {
//   try {
//     const { personal_email } = req.body;
//     // FIX: Use Upsert (Insert or Update) to handle missing student records
//     await db.query(
//       `INSERT INTO students (user_id, personal_email) VALUES (?, ?) 
//        ON DUPLICATE KEY UPDATE personal_email = VALUES(personal_email)`,
//       [req.user.user_id, personal_email]
//     );
//     res.json({ message: 'Profile updated successfully' });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Update failed' });
//   }
// };

// // Ensure getAppliedJobs returns company_name and resume_title
// exports.getAppliedJobs = async (req, res) => {
//   try {
//     const [rows] = await db.query(
//       `SELECT a.*, j.role_title, j.company_name, r.resume_title 
//        FROM applications a
//        JOIN job_roles j ON a.job_role_id = j.job_role_id
//        JOIN resume_versions r ON a.resume_version_id = r.resume_id
//        WHERE a.student_id = (SELECT student_id FROM students WHERE user_id = ?)`,
//       [req.user.user_id]
//     );
//     res.json(rows);
//   } catch (err) {
//     res.status(500).json({ message: 'Server error' });
//   }
// };

// exports.getEligibleJobs = async (req, res) => {
//   try {
//     const [students] = await db.query('SELECT * FROM students WHERE user_id = ?', [req.user.user_id]);
//     if (students.length === 0) return res.json([]);

//     const student = students[0];
    
//     // Filter jobs based on criteria (CGPA, Semester, Deadline)
//     const [jobs] = await db.query(
//       `SELECT j.*, c.company_name 
//        FROM job_roles j
//        JOIN companies c ON j.company_id = c.company_id
//        JOIN eligibility_criteria ec ON j.job_role_id = ec.job_role_id
//        WHERE ec.min_cgpa <= ? 
//        AND ec.min_semester <= ?
//        AND j.application_deadline >= CURDATE()`,
//       [student.cgpa || 0, student.semester || 0]
//     );
//     res.json(jobs);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

// exports.applyJob = async (req, res) => {
//   try {
//     const { jobRoleId, resumeId } = req.body;
//     const [students] = await db.query('SELECT student_id FROM students WHERE user_id = ?', [req.user.user_id]);
//     if (students.length === 0) return res.status(400).json({ message: 'Complete profile first' });
//     const studentId = students[0].student_id;

//     // Check duplicate application
//     const [existing] = await db.query(
//       'SELECT application_id FROM applications WHERE job_role_id = ? AND student_id = ?',
//       [jobRoleId, studentId]
//     );
//     if (existing.length > 0) return res.status(409).json({ message: 'Already applied' });

//     await db.query(
//       'INSERT INTO applications (job_role_id, student_id, resume_version_id) VALUES (?, ?, ?)',
//       [jobRoleId, studentId, resumeId]
//     );
//     res.status(201).json({ message: 'Applied successfully' });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error' });
//   }
// };


const db = require('../config/db');
const resumeService = require('../services/resumeService');

// Helper to extract User ID from the token payload
// const getUserId = (req) => req.user.user_id || req.user.id || req.user.userId;

// 1. Get Student Profile
exports.getProfile = async (req, res) => {
  try {
    // Join with users table to get the College Email (read-only)
    const [rows] = await db.query(
      `SELECT s.*, u.email as college_email 
       FROM students s 
       JOIN users u ON s.user_id = u.user_id 
       WHERE s.user_id = ?`, 
      [req.user.user_id]
    );
    
    // FIX: If student record is missing (e.g. legacy user), return basic user info instead of 404
    if (rows.length === 0) {
       const [users] = await db.query('SELECT email FROM users WHERE user_id = ?', [req.user.user_id]);
       if (users.length > 0) {
         return res.json({
           user_id: req.user.user_id,
           college_email: users[0].email,
           full_name: '', register_number: '', cgpa: '', personal_email: ''
         });
       }
       return res.status(404).json({ message: 'User not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// 2. Update Profile
exports.updateProfile = async (req, res) => {
  try {
    const { full_name, department, semester, cgpa, register_number, personal_email } = req.body;
    
    // FIX: Use UPDATE with COALESCE to handle partial updates without triggering NOT NULL errors
    const [updateResult] = await db.query(
      `UPDATE students SET 
       full_name = COALESCE(?, full_name), 
       department = COALESCE(?, department), 
       semester = COALESCE(?, semester), 
       cgpa = COALESCE(?, cgpa), 
       register_number = COALESCE(?, register_number), 
       personal_email = COALESCE(?, personal_email)
       WHERE user_id = ?`,
      [full_name, department, semester, cgpa, register_number, personal_email, req.user.user_id]
    );

    // If no record existed to update, try inserting (This will fail if required fields are missing, which is correct behavior for new profiles)
    if (updateResult.affectedRows === 0) {
      await db.query(
        `INSERT INTO students (user_id, full_name, department, semester, cgpa, register_number, personal_email) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [req.user.user_id, full_name, department, semester, cgpa, register_number, personal_email]
      );
    }

    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Update failed' });
  }
};

// 3. Get Eligible Jobs (The source of your 500 Error)
exports.getEligibleJobs = async (req, res) => {
  try {
    const [students] = await db.query('SELECT * FROM students WHERE user_id = ?', [req.user.user_id]);
    if (students.length === 0) return res.json([]);

    const student = students[0];
    
    // Filter jobs based on criteria (CGPA, Semester, Deadline)
    const [jobs] = await db.query(
      `SELECT j.*, c.company_name, c.logo_url 
       FROM job_roles j
       JOIN companies c ON j.company_id = c.company_id
       JOIN eligibility_criteria ec ON j.job_role_id = ec.job_role_id
       WHERE ec.min_cgpa <= ? 
       AND ec.min_semester <= ?
       AND j.application_deadline >= CURDATE()`,
      [student.cgpa || 0, student.semester || 0]
    );
    res.json(jobs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// 4. Apply for Job
exports.applyJob = async (req, res) => {
  try {
    const { jobRoleId, resumeId } = req.body;

    if (!resumeId) {
      return res.status(400).json({ message: 'Please select a resume to apply.' });
    }

    const [students] = await db.query('SELECT student_id FROM students WHERE user_id = ?', [req.user.user_id]);
    if (students.length === 0) return res.status(400).json({ message: 'Complete profile first' });
    const studentId = students[0].student_id;

    // Check duplicate application
    const [existing] = await db.query(
      'SELECT application_id FROM applications WHERE job_role_id = ? AND student_id = ?',
      [jobRoleId, studentId]
    );
    if (existing.length > 0) return res.status(409).json({ message: 'Already applied' });

    await db.query(
      'INSERT INTO applications (job_role_id, student_id, resume_id) VALUES (?, ?, ?)',
      [jobRoleId, studentId, resumeId]
    );
    res.status(201).json({ message: 'Applied successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// 5. Get Applied Jobs
exports.getAppliedJobs = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT a.*, j.role_title, c.company_name, r.resume_title 
       FROM applications a
       JOIN job_roles j ON a.job_role_id = j.job_role_id
       JOIN companies c ON j.company_id = c.company_id
       JOIN resumes r ON a.resume_id = r.resume_id
       WHERE a.student_id = (SELECT student_id FROM students WHERE user_id = ?)`,
      [req.user.user_id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// 6. Upload Resume
exports.uploadResume = async (req, res) => {
  try {
    const { fileUrl, title, resumeId } = req.body;
    
    // Get student_id (PK) using user_id (FK)
    const [students] = await db.query('SELECT student_id FROM students WHERE user_id = ?', [req.user.user_id]);
    if (students.length === 0) return res.status(404).json({ message: 'Student not found' });
    
    const result = await resumeService.uploadResume(students[0].student_id, fileUrl, title, 'STUDENT', resumeId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 7. Get Resumes
exports.getResumes = async (req, res) => {
  try {
    const [students] = await db.query('SELECT student_id FROM students WHERE user_id = ?', [req.user.user_id]);
    if (students.length === 0) return res.status(404).json({ message: 'Student not found' });
    
    const [resumes] = await db.query('SELECT * FROM resumes WHERE student_id = ?', [students[0].student_id]);
    res.json(resumes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
