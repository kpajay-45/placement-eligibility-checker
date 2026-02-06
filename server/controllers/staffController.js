const db = require('../config/db');

exports.createJob = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const { company, job, criteria } = req.body;

    // 1. Create Company (Simplified: Always creates new for now)
    const [resComp] = await connection.query(
      'INSERT INTO companies (company_name, industry) VALUES (?, ?)', 
      [company.name, company.industry]
    );
    const companyId = resComp.insertId;

    // 2. Create Job Role
    const [resJob] = await connection.query(
      'INSERT INTO job_roles (company_id, role_title, job_description, application_deadline) VALUES (?, ?, ?, ?)',
      [companyId, job.title, job.description, job.deadline]
    );
    const jobId = resJob.insertId;

    // 3. Create Eligibility Criteria
    await connection.query(
      `INSERT INTO eligibility_criteria 
       (job_role_id, min_cgpa, min_semester, eligible_departments) 
       VALUES (?, ?, ?, ?)`,
      [jobId, criteria.min_cgpa, criteria.min_semester, criteria.departments] // departments e.g., "CSE,IT"
    );

    await connection.commit();
    res.json({ message: 'Job posted successfully' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
};

exports.getAuditApplications = async (req, res) => {
  try {
    const query = `
      SELECT a.*, s.full_name, s.register_number, j.role_title, r.resume_title
      FROM applications a
      JOIN students s ON a.student_id = s.student_id
      JOIN job_roles j ON a.job_role_id = j.job_role_id
      JOIN resumes r ON a.resume_id = r.resume_id
      WHERE a.resume_updated_after_apply = TRUE
    `;
    const [apps] = await db.query(query);
    res.json(apps);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPostedJobs = async (req, res) => {
  try {
    // Fetch all jobs (In a real app, filter by Staff's company)
    const [jobs] = await db.query('SELECT job_role_id, role_title, company_id FROM job_roles ORDER BY created_at DESC');
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getJobApplicants = async (req, res) => {
  try {
    const { jobId } = req.params;
    // Weighted Ranking: 70% CGPA (normalized to 100) + 30% Activity Points
    const query = `
      SELECT 
        a.application_id,
        a.status,
        s.full_name,
        s.register_number,
        s.cgpa,
        COALESCE(SUM(ap.points), 0) as activity_points,
        -- Calculation: (CGPA * 10 * 0.7) + (Points * 0.3)
        ( (s.cgpa * 10) * 0.7 ) + ( COALESCE(SUM(ap.points), 0) * 0.3 ) as ranking_score
      FROM applications a
      JOIN students s ON a.student_id = s.student_id
      LEFT JOIN activity_points ap ON s.student_id = ap.student_id AND ap.verified = TRUE
      WHERE a.job_role_id = ?
      GROUP BY a.application_id, s.student_id
      ORDER BY ranking_score DESC
    `;
    const [applicants] = await db.query(query, [jobId]);
    res.json(applicants);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId, status } = req.body; // status: 'SHORTLISTED', 'REJECTED'
    await db.query('UPDATE applications SET status = ? WHERE application_id = ?', [status, applicationId]);
    res.json({ message: `Application ${status.toLowerCase()} successfully` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};