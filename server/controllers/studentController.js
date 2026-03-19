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
    let { full_name, department, semester, cgpa, register_number, personal_email, batch_year, history_of_arrears, attendance_percentage } = req.body;

    // Sanitize: convert empty strings to null for numeric columns to avoid MySQL integer parse errors
    const toNullIfEmpty = (v) => (v === '' || v === undefined) ? null : v;
    batch_year = toNullIfEmpty(batch_year);
    semester = toNullIfEmpty(semester);
    cgpa = toNullIfEmpty(cgpa);
    history_of_arrears = toNullIfEmpty(history_of_arrears);
    attendance_percentage = toNullIfEmpty(attendance_percentage);
    full_name = toNullIfEmpty(full_name);
    department = toNullIfEmpty(department);
    register_number = toNullIfEmpty(register_number);
    personal_email = toNullIfEmpty(personal_email);

    // FIX: Use UPDATE with COALESCE to handle partial updates without triggering NOT NULL errors
    const [updateResult] = await db.query(
      `UPDATE students SET 
       full_name = COALESCE(?, full_name), 
       department = COALESCE(?, department), 
       semester = COALESCE(?, semester), 
       cgpa = COALESCE(?, cgpa), 
       register_number = COALESCE(?, register_number), 
       personal_email = COALESCE(?, personal_email),
       batch_year = COALESCE(?, batch_year),
       history_of_arrears = COALESCE(?, history_of_arrears),
       attendance_percentage = COALESCE(?, attendance_percentage)
       WHERE user_id = ?`,
      [full_name, department, semester, cgpa, register_number, personal_email, batch_year, history_of_arrears, attendance_percentage, req.user.user_id]
    );

    // If no record existed to update, try inserting (This will fail if required fields are missing, which is correct behavior for new profiles)
    if (updateResult.affectedRows === 0) {
      await db.query(
        `INSERT INTO students (user_id, full_name, department, semester, cgpa, register_number, personal_email, batch_year, history_of_arrears, attendance_percentage) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [req.user.user_id, full_name, department, semester, cgpa, register_number, personal_email, batch_year, history_of_arrears, attendance_percentage]
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
    const studentCgpa = parseFloat(student.cgpa) || 0;
    const studentSem = parseInt(student.semester) || 0;
    const studentDept = (student.department || '').trim().toUpperCase();
    const studentBacklogs = parseInt(student.history_of_arrears) || 0;

    // Fetch all non-expired jobs with their criteria
    const [jobs] = await db.query(
      `SELECT j.*, c.company_name, c.logo_url,
              ec.min_cgpa, ec.min_semester, ec.eligible_departments, ec.max_backlogs
       FROM job_roles j
       JOIN companies c ON j.company_id = c.company_id
       JOIN eligibility_criteria ec ON j.job_role_id = ec.job_role_id
       WHERE j.application_deadline >= CURDATE()`
    );

    // Apply same eligibility logic as applyJob so student only sees jobs they qualify for
    const eligibleJobs = jobs.filter(job => {
      const cgpaOk = studentCgpa >= parseFloat(job.min_cgpa || 0);
      const semOk = studentSem >= parseInt(job.min_semester || 0);

      // Department check
      let deptOk = true;
      if (job.eligible_departments) {
        const allowed = job.eligible_departments.split(',').map(d => d.trim().toUpperCase());
        deptOk = allowed.includes(studentDept);
      }

      // Backlog check
      const backlogOk = (job.max_backlogs === null || job.max_backlogs === undefined)
        ? true
        : studentBacklogs <= parseInt(job.max_backlogs);

      return cgpaOk && semOk && deptOk && backlogOk;
    });

    res.json(eligibleJobs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// 4. Apply for Job
exports.applyJob = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const { jobRoleId, resumeId } = req.body;

    if (!resumeId) {
      return res.status(400).json({ message: 'Please select a resume to apply.' });
    }

    const [students] = await connection.query('SELECT * FROM students WHERE user_id = ?', [req.user.user_id]);
    if (students.length === 0) return res.status(400).json({ message: 'Complete profile first' });
    const student = students[0];

    // Check duplicate application
    const [existing] = await connection.query(
      'SELECT application_id FROM applications WHERE job_role_id = ? AND student_id = ?',
      [jobRoleId, student.student_id]
    );
    if (existing.length > 0) return res.status(409).json({ message: 'Already applied' });

    // 1. Fetch Job Criteria
    const [criteriaList] = await connection.query(
      'SELECT * FROM eligibility_criteria WHERE job_role_id = ?',
      [jobRoleId]
    );
    if (criteriaList.length === 0) throw new Error('Job criteria not found');
    const criteria = criteriaList[0];

    // 2. Check Eligibility
    // Logic: CGPA >= min, Semester >= min, Backlogs <= max (if column exists, defaulting to 0 for now as column might be missing in students table but requirement said check backlogs)
    // Note: Student table current schema in previous view didn't explicitly show 'backlogs' column, only 'cgpa'. 
    // The requirement said "Backlogs <= allowed". 
    // I should check if 'backlogs' column exists in students. 
    // Based on previous `schema.sql` view, `students` table has: `register_number`, `full_name`, `department`, `semester`, `cgpa`. 
    // It MISSES `backlogs`, `attendance`.
    // I need to ADD `backlogs` and `attendance` to `students` table as per User Request "Student Features: Update academic details (CGPA, backlogs, attendance...)".
    // I missed adding these columns in the previous schema update. I must add them now.

    // For now, I will proceed with the code assuming columns will exist, but I MUST update schema immediately after this.

    const isCgpaOk = parseFloat(student.cgpa) >= parseFloat(criteria.min_cgpa);
    const isSemesterOk = student.semester >= criteria.min_semester;

    // Departments check
    let isDeptOk = true;
    if (criteria.eligible_departments) {
      const allowedDepts = criteria.eligible_departments.split(',').map(d => d.trim().toUpperCase());
      isDeptOk = allowedDepts.includes((student.department || '').trim().toUpperCase());
    }

    // Backlog check — skip attendance per project scope
    const isBacklogOk = (criteria.max_backlogs === null || criteria.max_backlogs === undefined)
      ? true
      : (parseInt(student.history_of_arrears) || 0) <= parseInt(criteria.max_backlogs);

    const isEligible = isCgpaOk && isSemesterOk && isDeptOk && isBacklogOk;

    const snapshot = {
      cgpa: student.cgpa,
      semester: student.semester,
      department: student.department,
      history_of_arrears: student.history_of_arrears,
      criteria: {
        min_cgpa: criteria.min_cgpa,
        min_semester: criteria.min_semester,
        eligible_departments: criteria.eligible_departments,
        max_backlogs: criteria.max_backlogs
      },
      checks: { isCgpaOk, isSemesterOk, isDeptOk, isBacklogOk }
    };

    // 3. Insert Application
    await connection.query(
      `INSERT INTO applications 
       (job_role_id, student_id, resume_id, is_eligible, eligibility_snapshot, status) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [jobRoleId, student.student_id, resumeId, isEligible, JSON.stringify(snapshot), 'APPLIED']
    );

    await connection.commit();

    if (isEligible) {
      res.status(201).json({ message: 'Applied successfully.' });
    } else {
      res.status(201).json({ message: 'Applied, but you are not eligible. Application marked as ineligible.' });
    }

  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    connection.release();
  }
};

// 5. Get Applied Jobs
exports.getAppliedJobs = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT a.*, j.role_title, j.application_deadline, c.company_name, c.logo_url,
              r.resume_title,
              rv.resume_url as resume_file_url
       FROM applications a
       JOIN job_roles j ON a.job_role_id = j.job_role_id
       JOIN companies c ON j.company_id = c.company_id
       JOIN resumes r ON a.resume_id = r.resume_id
       LEFT JOIN resume_versions rv ON rv.resume_id = r.resume_id
         AND rv.version_number = (SELECT MAX(v2.version_number) FROM resume_versions v2 WHERE v2.resume_id = r.resume_id)
       WHERE a.student_id = (SELECT student_id FROM students WHERE user_id = ?)
       ORDER BY a.applied_at DESC`,
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

// 8. Get Skills
exports.getSkills = async (req, res) => {
  try {
    const [students] = await db.query('SELECT student_id FROM students WHERE user_id = ?', [req.user.user_id]);
    if (students.length === 0) return res.json([]); // New user: no student record yet, return empty list

    const [skills] = await db.query(
      'SELECT * FROM student_skills WHERE student_id = ? ORDER BY created_at DESC',
      [students[0].student_id]
    );
    res.json(skills);
  } catch (error) {
    console.error('getSkills error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// 9. Add Skill
exports.addSkill = async (req, res) => {
  try {
    const { skill_name, certificate_url } = req.body;

    if (!skill_name || skill_name.trim() === '') {
      return res.status(400).json({ message: 'Skill name is required.' });
    }

    const [students] = await db.query('SELECT student_id FROM students WHERE user_id = ?', [req.user.user_id]);
    if (students.length === 0) return res.status(404).json({ message: 'Student not found' });

    // LIMIT: Max 20 skills per student
    const [skillCount] = await db.query(
      'SELECT COUNT(*) as cnt FROM student_skills WHERE student_id = ?',
      [students[0].student_id]
    );
    if (skillCount[0].cnt >= 20) {
      return res.status(400).json({ message: 'You can add a maximum of 20 skills.' });
    }

    const [result] = await db.query(
      'INSERT INTO student_skills (student_id, skill_name, certificate_url) VALUES (?, ?, ?)',
      [students[0].student_id, skill_name.trim(), certificate_url?.trim() || null]
    );

    res.status(201).json({
      message: 'Skill added successfully',
      skill_id: result.insertId,
      skill_name: skill_name.trim(),
      certificate_url: certificate_url?.trim() || null
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 10. Delete Skill
exports.deleteSkill = async (req, res) => {
  try {
    const { skillId } = req.params;

    const [students] = await db.query('SELECT student_id FROM students WHERE user_id = ?', [req.user.user_id]);
    if (students.length === 0) return res.status(404).json({ message: 'Student not found' });

    // Only allow student to delete their own skills
    const [result] = await db.query(
      'DELETE FROM student_skills WHERE skill_id = ? AND student_id = ?',
      [skillId, students[0].student_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Skill not found or not authorized' });
    }

    res.json({ message: 'Skill deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 11. Get Student's own Activity Points
// ─────────────────────────────────────────────────────────────────────────────
exports.getActivityPoints = async (req, res) => {
  try {
    const [students] = await db.query('SELECT student_id FROM students WHERE user_id = ?', [req.user.user_id]);
    if (students.length === 0) return res.json([]);

    const [points] = await db.query(
      'SELECT activity_id, activity_type, points, proof_url, status, rejection_reason, created_at FROM activity_points WHERE student_id = ? ORDER BY created_at DESC',
      [students[0].student_id]
    );
    res.json(points);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 12. Submit Activity Point Claim
// ─────────────────────────────────────────────────────────────────────────────
exports.submitActivityPoint = async (req, res) => {
  try {
    const { activity_type, points, proof_url } = req.body;
    if (!activity_type || !points) {
      return res.status(400).json({ message: 'Activity type and points are required.' });
    }
    const parsedPoints = parseInt(points);
    if (isNaN(parsedPoints) || parsedPoints <= 0 || parsedPoints > 100) {
      return res.status(400).json({ message: 'Points must be a number between 1 and 100.' });
    }

    const [students] = await db.query('SELECT student_id FROM students WHERE user_id = ?', [req.user.user_id]);
    if (students.length === 0) return res.status(404).json({ message: 'Student profile not found. Please complete your profile first.' });

    const [result] = await db.query(
      'INSERT INTO activity_points (student_id, activity_type, points, proof_url, status) VALUES (?, ?, ?, ?, ?)',
      [students[0].student_id, activity_type.trim(), parsedPoints, proof_url || null, 'PENDING']
    );

    res.status(201).json({
      activity_id: result.insertId,
      activity_type: activity_type.trim(),
      points: parsedPoints,
      proof_url: proof_url || null,
      status: 'PENDING',
      message: 'Activity point claim submitted. Awaiting admin verification.'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

