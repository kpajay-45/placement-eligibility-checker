const db = require('../config/db');
const nodemailer = require('nodemailer');
const shortlistService = require('../services/shortlistService');

// Configure Email Transporter (Use environment variables in production)
const transporter = nodemailer.createTransport({
  service: 'gmail', // or your preferred service
  auth: {
    user: process.env.EMAIL_USER, // Add these to your server/.env file
    pass: process.env.EMAIL_PASS
  }
});

exports.createJob = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const { company, job, criteria } = req.body;

    // 1. Create Company (Simplified: Always creates new for now)
    const [resComp] = await connection.query(
      'INSERT INTO companies (company_name, industry, logo_url) VALUES (?, ?, ?)',
      [company.name, company.industry, company.logo_url]
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
      SELECT a.*, s.full_name, s.register_number, j.role_title, r.resume_title, rv.resume_url
      FROM applications a
      JOIN students s ON a.student_id = s.student_id
      JOIN job_roles j ON a.job_role_id = j.job_role_id
      JOIN resumes r ON a.resume_id = r.resume_id
      JOIN resume_versions rv ON r.resume_id = rv.resume_id
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
        -- Calculation: (CGPA * 10 * 0.7) + (Points * 0.3)
        ( (COALESCE(s.cgpa, 0) * 10) * 0.7 ) + ( COALESCE(SUM(ap.points), 0) * 0.3 ) as ranking_score
      FROM applications a
      JOIN students s ON a.student_id = s.student_id
      JOIN resumes r ON a.resume_id = r.resume_id
      -- Join to get the latest version (highest version number) for the resume
      JOIN resume_versions rv ON r.resume_id = rv.resume_id 
      LEFT JOIN activity_points ap ON s.student_id = ap.student_id AND ap.verified = TRUE
      WHERE a.job_role_id = ? AND rv.version_number = (SELECT MAX(version_number) FROM resume_versions WHERE resume_id = r.resume_id)
      GROUP BY a.application_id, a.status, s.full_name, s.register_number, s.cgpa, s.department, rv.resume_url, r.resume_title
      ORDER BY ranking_score DESC
    `;
    const [applicants] = await db.query(query, [jobId]);
    res.json(applicants);
  } catch (error) {
    console.error("Error fetching job applicants:", error); // Log the specific SQL error
    res.status(500).json({ message: error.message });
  }
};

exports.updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId, status } = req.body; // status: 'SHORTLISTED', 'REJECTED'

    // 1. Update Status
    await db.query('UPDATE applications SET status = ? WHERE application_id = ?', [status, applicationId]);

    // 2. Fetch Details for Email Notification
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

        // Send Email (Fire and forget - don't await to keep UI fast)
        transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: `Congratulations! Shortlisted for ${company_name}`,
          text: `Dear ${full_name},\n\nYou have been shortlisted for the position of ${role_title} at ${company_name}.\n\nPlease check the portal for further interview details.\n\nBest Regards,\nPlacement Cell`
        }).catch(err => console.error("Email failed:", err));
      }
    }

    res.json({ message: `Application ${status.toLowerCase()} successfully` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.generateShortlist = async (req, res) => {
  try {
    const { jobId } = req.body;
    // Assuming the user ID in the token corresponds to a Staff ID. 
    // In a real app we might need a lookup, but let's assume req.user.user_id maps to staff_id via a table lookup or similar.
    // For now, let's look up staff_id from user_id
    const [staff] = await db.query('SELECT staff_id FROM placement_staff WHERE user_id = ?', [req.user.user_id]);
    if (staff.length === 0) return res.status(403).json({ message: 'Not authorized as Staff' });

    const result = await shortlistService.generateShortlist(jobId, staff[0].staff_id);
    res.json({ message: 'Shortlist generated successfully', ...result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.getShortlists = async (req, res) => {
  try {
    const { jobId } = req.params;
    const shortlists = await shortlistService.getShortlistsForJob(jobId);
    res.json(shortlists);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.overrideEligibility = async (req, res) => {
  try {
    const { applicationId, overrideReason } = req.body;
    if (!overrideReason) return res.status(400).json({ message: 'Reason is required' });

    await db.query(
      'UPDATE applications SET is_overridden = TRUE, override_reason = ?, is_eligible = TRUE WHERE application_id = ?',
      [overrideReason, applicationId]
    );

    res.json({ message: 'Eligibility successfully overridden.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};