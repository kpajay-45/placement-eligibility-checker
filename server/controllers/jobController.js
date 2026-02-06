const db = require('../config/db');

exports.getEligibleJobs = async (req, res) => {
  const userId = req.user.user_id;
  try {
    const [students] = await db.query('SELECT * FROM students WHERE user_id = ?', [userId]);
    if (students.length === 0) return res.status(404).json({ message: 'Student not found' });
    const student = students[0];

    // SQL Logic: Filter jobs where student meets ALL criteria
    // FIND_IN_SET checks if student.department exists in the CSV string 'CSE,ECE'
    // Added UPPER() and TRIM() to handle case sensitivity and spaces
    const query = `
      SELECT j.*, c.company_name, ec.min_cgpa, ec.eligible_departments 
      FROM job_roles j
      JOIN companies c ON j.company_id = c.company_id
      JOIN eligibility_criteria ec ON j.job_role_id = ec.job_role_id
      WHERE ? >= ec.min_cgpa
      AND ? >= ec.min_semester
      AND (
        ec.eligible_departments IS NULL 
        OR FIND_IN_SET(UPPER(TRIM(?)), UPPER(REPLACE(ec.eligible_departments, ', ', ','))) > 0
      )
      AND j.application_deadline > NOW()
    `;

    const [jobs] = await db.query(query, [student.cgpa, student.semester, student.department]);
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.applyForJob = async (req, res) => {
  // Schema: applications (student_id, job_role_id, resume_id)
  const { jobRoleId, resumeId } = req.body;
  const userId = req.user.user_id; // From Auth Middleware

  try {
    // 1. Get Student Details (Need student_id from user_id)
    const [students] = await db.query(
      'SELECT student_id, cgpa, department, semester FROM students WHERE user_id = ?', 
      [userId]
    );
    
    if (students.length === 0) return res.status(404).json({ message: 'Student profile not found' });
    const student = students[0];

    // 2. Check Eligibility (Dynamic Query against eligibility_criteria)
    // Schema: min_cgpa, min_semester, eligible_departments (TEXT)
    const [criteria] = await db.query(
      'SELECT * FROM eligibility_criteria WHERE job_role_id = ?',
      [jobRoleId]
    );

    if (criteria.length > 0) {
      const rule = criteria[0];
      
      // CGPA Check
      if (student.cgpa < rule.min_cgpa) {
        return res.status(400).json({ message: 'Not eligible: CGPA too low' });
      }

      // Semester Check
      if (student.semester < rule.min_semester) {
        return res.status(400).json({ message: 'Not eligible: Semester requirement not met' });
      }

      // Department Check (Handling TEXT CSV)
      // If eligible_departments is not null, check if student.department is in the list
      if (rule.eligible_departments) {
        const allowedDepts = rule.eligible_departments.split(',').map(d => d.trim());
        if (!allowedDepts.includes(student.department)) {
          return res.status(400).json({ message: 'Not eligible: Department not allowed' });
        }
      }
      
      // Note: Activity points check would require a JOIN with activity_points table
    }

    // 3. Submit Application
    // Schema: UNIQUE(student_id, job_role_id) handles duplicate checks
    await db.query(
      `INSERT INTO applications (student_id, job_role_id, resume_id, status) 
       VALUES (?, ?, ?, 'APPLIED')`,
      [student.student_id, jobRoleId, resumeId]
    );

    res.status(201).json({ message: 'Application submitted successfully' });

  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Already applied for this job' });
    }
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};