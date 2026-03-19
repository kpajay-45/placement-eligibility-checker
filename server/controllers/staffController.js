const db = require('../config/db');
const nodemailer = require('nodemailer');
const shortlistService = require('../services/shortlistService');

// Configure Email Transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /staff/profile
// ─────────────────────────────────────────────────────────────────────────────
exports.getProfile = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT ps.name, ps.designation, u.email
       FROM placement_staff ps
       JOIN users u ON ps.user_id = u.user_id
       WHERE ps.user_id = ?`,
      [req.user.user_id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Staff profile not found' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /staff/jobs/create
// ─────────────────────────────────────────────────────────────────────────────
exports.createJob = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const { company, job, criteria } = req.body;

    // VALIDATION: Reject past deadlines
    if (!job.deadline || new Date(job.deadline) <= new Date()) {
      return res.status(400).json({ message: 'Application deadline must be a future date.' });
    }

    // FIX: Deduplicate companies — reuse existing company if name matches (case-insensitive)
    const [existingCompany] = await connection.query(
      'SELECT company_id FROM companies WHERE LOWER(company_name) = LOWER(?)',
      [company.name]
    );

    let companyId;
    if (existingCompany.length > 0) {
      companyId = existingCompany[0].company_id;
      // Update company info if provided
      await connection.query(
        'UPDATE companies SET industry = ?, description = ?, website = ?, headquarters = ?, logo_url = ? WHERE company_id = ?',
        [company.industry, company.description, company.website, company.headquarters, company.logo_url, companyId]
      );
    } else {
      const [resComp] = await connection.query(
        'INSERT INTO companies (company_name, industry, description, website, headquarters, logo_url) VALUES (?, ?, ?, ?, ?, ?)',
        [company.name, company.industry, company.description, company.website, company.headquarters, company.logo_url]
      );
      companyId = resComp.insertId;
    }

    // Create Job Role
    const [resJob] = await connection.query(
      'INSERT INTO job_roles (company_id, role_title, job_description, application_deadline, salary_package) VALUES (?, ?, ?, ?, ?)',
      [companyId, job.title, job.description, job.deadline, job.salary_package]
    );
    const jobId = resJob.insertId;

    // Create Eligibility Criteria
    await connection.query(
      `INSERT INTO eligibility_criteria 
       (job_role_id, min_cgpa, min_semester, eligible_departments, max_backlogs) 
       VALUES (?, ?, ?, ?, ?)`,
      [jobId, criteria.min_cgpa, criteria.min_semester, criteria.departments, criteria.max_backlogs || 0]
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

// ─────────────────────────────────────────────────────────────────────────────
// GET /staff/applications/audit
// FIX: Restrict to latest resume version to prevent duplicate rows per application
// ─────────────────────────────────────────────────────────────────────────────
exports.getAuditApplications = async (req, res) => {
  try {
    const query = `
      SELECT a.*, s.full_name, s.register_number, j.role_title, r.resume_title, rv.resume_url
      FROM applications a
      JOIN students s ON a.student_id = s.student_id
      JOIN job_roles j ON a.job_role_id = j.job_role_id
      JOIN resumes r ON a.resume_id = r.resume_id
      JOIN resume_versions rv ON r.resume_id = rv.resume_id
        AND rv.version_number = (SELECT MAX(version_number) FROM resume_versions WHERE resume_id = r.resume_id)
      WHERE a.resume_updated_after_apply = TRUE
    `;
    const [apps] = await db.query(query);
    res.json(apps);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /staff/jobs/list
// ─────────────────────────────────────────────────────────────────────────────
exports.getPostedJobs = async (req, res) => {
  try {
    const [jobs] = await db.query(
      `SELECT jr.job_role_id, jr.role_title, jr.application_deadline, c.company_name
       FROM job_roles jr
       JOIN companies c ON jr.company_id = c.company_id
       ORDER BY jr.created_at DESC`
    );
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /staff/jobs/:jobId/applicants
// ─────────────────────────────────────────────────────────────────────────────
exports.getJobApplicants = async (req, res) => {
  try {
    const { jobId } = req.params;
    console.log(`[DEBUG] getJobApplicants called for jobId: ${jobId}`);
    const query = `
      SELECT 
        a.application_id,
        a.status,
        a.is_eligible,
        a.is_overridden,
        a.override_reason,
        s.full_name,
        s.register_number,
        s.cgpa,
        s.department,
        rv.resume_url,
        r.resume_title,
        COALESCE(SUM(ap.points), 0) as activity_points,
        ( (COALESCE(s.cgpa, 0) * 10) * 0.7 ) + ( COALESCE(SUM(ap.points), 0) * 0.3 ) as ranking_score
      FROM applications a
      JOIN students s ON a.student_id = s.student_id
      JOIN resumes r ON a.resume_id = r.resume_id
      JOIN resume_versions rv ON r.resume_id = rv.resume_id 
        AND rv.version_number = (SELECT MAX(version_number) FROM resume_versions WHERE resume_id = r.resume_id)
      LEFT JOIN activity_points ap ON s.student_id = ap.student_id AND ap.status = 'APPROVED'
      WHERE a.job_role_id = ?
      GROUP BY a.application_id, a.status, a.is_eligible, a.is_overridden, a.override_reason,
               s.full_name, s.register_number, s.cgpa, s.department, rv.resume_url, r.resume_title
      ORDER BY ranking_score DESC
    `;
    const [applicants] = await db.query(query, [jobId]);
    res.json(applicants);
  } catch (error) {
    console.error('Error fetching job applicants:', error);
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /staff/applications/status
// ─────────────────────────────────────────────────────────────────────────────
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId, status } = req.body;

    const VALID_STATUSES = ['SHORTLISTED', 'REJECTED', 'OFFERED', 'APPLIED'];
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value.' });
    }

    await db.query('UPDATE applications SET status = ? WHERE application_id = ?', [status, applicationId]);

    // Email notification for SHORTLISTED
    if (status === 'SHORTLISTED') {
      const query = `
        SELECT u.email, s.full_name, j.role_title, c.company_name
        FROM applications a
        JOIN students s ON a.student_id = s.student_id
        JOIN users u ON s.user_id = u.user_id
        JOIN job_roles j ON a.job_role_id = j.job_role_id
        JOIN companies c ON j.company_id = c.company_id
        WHERE a.application_id = ?
      `;
      const [rows] = await db.query(query, [applicationId]);
      if (rows.length > 0) {
        const { email, full_name, role_title, company_name } = rows[0];
        transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: `Congratulations! Shortlisted for ${company_name}`,
          text: `Dear ${full_name},\n\nYou have been shortlisted for the position of ${role_title} at ${company_name}.\n\nPlease check the portal for further interview details.\n\nBest Regards,\nPlacement Cell`
        }).catch(err => console.error('Email failed:', err));
      }
    }

    res.json({ message: `Application ${status.toLowerCase()} successfully` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /staff/jobs/shortlist
// ─────────────────────────────────────────────────────────────────────────────
exports.generateShortlist = async (req, res) => {
  try {
    const { jobId } = req.body;
    const [staff] = await db.query(
      'SELECT staff_id FROM placement_staff WHERE user_id = ?',
      [req.user.user_id]
    );
    if (staff.length === 0) return res.status(403).json({ message: 'Not authorized as Staff' });

    const result = await shortlistService.generateShortlist(jobId, staff[0].staff_id);
    res.json({ message: 'Shortlist generated successfully', ...result });
  } catch (error) {
    console.error(error);
    // Propagate 409 conflict cleanly
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /staff/jobs/:jobId/shortlists
// ─────────────────────────────────────────────────────────────────────────────
exports.getShortlists = async (req, res) => {
  try {
    const { jobId } = req.params;
    const shortlists = await shortlistService.getShortlistsForJob(jobId);
    res.json(shortlists);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /staff/applications/override
// ─────────────────────────────────────────────────────────────────────────────
exports.overrideEligibility = async (req, res) => {
  try {
    const { applicationId, overrideReason } = req.body;
    if (!overrideReason || overrideReason.trim() === '') {
      return res.status(400).json({ message: 'Override reason is required.' });
    }

    await db.query(
      'UPDATE applications SET is_overridden = TRUE, override_reason = ?, is_eligible = TRUE WHERE application_id = ?',
      [overrideReason.trim(), applicationId]
    );

    res.json({ message: 'Eligibility successfully overridden.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /staff/jobs/:jobId — Get full job details for editing
// ─────────────────────────────────────────────────────────────────────────────
exports.getJobDetails = async (req, res) => {
  try {
    const { jobId } = req.params;
    const [rows] = await db.query(
      `SELECT jr.job_role_id, jr.role_title, jr.job_description, jr.application_deadline, jr.salary_package,
              c.company_id, c.company_name, c.industry, c.logo_url,
              ec.min_cgpa, ec.min_semester, ec.eligible_departments, ec.max_backlogs
       FROM job_roles jr
       JOIN companies c ON jr.company_id = c.company_id
       JOIN eligibility_criteria ec ON jr.job_role_id = ec.job_role_id
       WHERE jr.job_role_id = ?`,
      [jobId]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Job not found' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /staff/jobs/:jobId — Edit job role + criteria
// ─────────────────────────────────────────────────────────────────────────────
exports.editJob = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const { jobId } = req.params;
    const { company, job, criteria } = req.body;

    if (!job.deadline || new Date(job.deadline) <= new Date()) {
      return res.status(400).json({ message: 'Application deadline must be a future date.' });
    }

    // Update company info
    await connection.query(
      'UPDATE companies SET company_name = ?, industry = ?, description = ?, website = ?, headquarters = ?, logo_url = ? WHERE company_id = (SELECT company_id FROM job_roles WHERE job_role_id = ?)',
      [company.name, company.industry, company.description, company.website, company.headquarters, company.logo_url, jobId]
    );

    // Update job role
    await connection.query(
      'UPDATE job_roles SET role_title = ?, job_description = ?, application_deadline = ?, salary_package = ? WHERE job_role_id = ?',
      [job.title, job.description, job.deadline, job.salary_package, jobId]
    );

    // Update eligibility criteria
    await connection.query(
      'UPDATE eligibility_criteria SET min_cgpa = ?, min_semester = ?, eligible_departments = ?, max_backlogs = ? WHERE job_role_id = ?',
      [criteria.min_cgpa, criteria.min_semester, criteria.departments, criteria.max_backlogs || 0, jobId]
    );

    await connection.commit();
    res.json({ message: 'Job updated successfully' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /staff/jobs/:jobId — Delete job role (cascades to applications + criteria)
// ─────────────────────────────────────────────────────────────────────────────
exports.deleteJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const [result] = await db.query('DELETE FROM job_roles WHERE job_role_id = ?', [jobId]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Job not found' });
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /staff/stats — Global dashboard statistics
// ─────────────────────────────────────────────────────────────────────────────
exports.getStaffStats = async (req, res) => {
  try {
    const [[{ total_jobs }]] = await db.query('SELECT COUNT(*) as total_jobs FROM job_roles');
    const [[{ total_applicants }]] = await db.query('SELECT COUNT(*) as total_applicants FROM applications');
    const [[{ shortlisted }]] = await db.query("SELECT COUNT(*) as shortlisted FROM applications WHERE status = 'SHORTLISTED'");
    const [[{ offered }]] = await db.query("SELECT COUNT(*) as offered FROM applications WHERE status = 'OFFERED'");
    const [[{ pending }]] = await db.query("SELECT COUNT(*) as pending FROM applications WHERE status = 'PENDING'");

    // Recent 5 jobs with applicant counts
    const [recentJobs] = await db.query(`
      SELECT jr.job_role_id, jr.role_title, c.company_name, jr.application_deadline,
        (SELECT COUNT(*) FROM applications a WHERE a.job_role_id = jr.job_role_id) as applicant_count
      FROM job_roles jr
      JOIN companies c ON jr.company_id = c.company_id
      ORDER BY jr.job_role_id DESC
      LIMIT 5
    `);

    res.json({ total_jobs, total_applicants, shortlisted, offered, pending, recentJobs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
