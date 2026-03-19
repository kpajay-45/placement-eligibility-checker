const db = require('../config/db');

// ─────────────────────────────────────────────────────────────────────────────
// GET /admin/staff — All placement staff
// ─────────────────────────────────────────────────────────────────────────────
exports.getAllStaff = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT u.user_id, u.email, u.status, u.created_at, ps.name, ps.designation
      FROM users u
      LEFT JOIN placement_staff ps ON u.user_id = ps.user_id
      WHERE u.role = 'PLACEMENT_STAFF'
    `;
    const params = [];

    if (search) {
      query += ` AND (ps.name LIKE ? OR u.email LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY u.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [staff] = await db.query(query, params);
    
    // Get total count for pagination
    let countQuery = "SELECT COUNT(*) as total FROM users u LEFT JOIN placement_staff ps ON u.user_id = ps.user_id WHERE u.role = 'PLACEMENT_STAFF'";
    const countParams = [];
    if (search) {
      countQuery += " AND (ps.name LIKE ? OR u.email LIKE ?)";
      countParams.push(`%${search}%`, `%${search}%`);
    }
    const [[{ total }]] = await db.query(countQuery, countParams);

    res.json({
      data: staff,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /admin/staff/status — Activate / Deactivate staff
// ─────────────────────────────────────────────────────────────────────────────
exports.updateStaffStatus = async (req, res) => {
  try {
    const { userId, status } = req.body;
    const VALID_STATUSES = ['ACTIVE', 'INACTIVE'];
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
    }
    const [targetUser] = await db.query('SELECT user_id, role FROM users WHERE user_id = ?', [userId]);
    if (targetUser.length === 0) return res.status(404).json({ message: 'User not found.' });
    if (targetUser[0].role !== 'PLACEMENT_STAFF') {
      return res.status(403).json({ message: 'Cannot update status for non-staff users.' });
    }
    await db.query('UPDATE users SET status = ? WHERE user_id = ?', [status, userId]);
    res.json({ message: `Staff status updated to ${status}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /admin/stats — Analytics overview
// ─────────────────────────────────────────────────────────────────────────────
exports.getStats = async (req, res) => {
  try {
    const [[{ total_students }]] = await db.query('SELECT COUNT(*) as total_students FROM students');
    const [[{ total_staff }]] = await db.query("SELECT COUNT(*) as total_staff FROM users WHERE role = 'PLACEMENT_STAFF'");
    const [[{ total_companies }]] = await db.query('SELECT COUNT(*) as total_companies FROM companies');
    const [[{ total_drives }]] = await db.query('SELECT COUNT(*) as total_drives FROM job_roles');
    const [[{ total_applications }]] = await db.query('SELECT COUNT(*) as total_applications FROM applications');
    const [[{ offered_count }]] = await db.query("SELECT COUNT(*) as offered_count FROM applications WHERE status = 'OFFERED'");
    const [[{ pending_activity_points }]] = await db.query("SELECT COUNT(*) as pending_activity_points FROM activity_points WHERE status = 'PENDING'");

    const placement_rate = total_students > 0
      ? ((offered_count / total_students) * 100).toFixed(1)
      : 0;

    res.json({
      total_students,
      total_staff,
      total_companies,
      total_drives,
      total_applications,
      offered_count,
      placement_rate,
      pending_activity_points
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /admin/students — All registered students
// ─────────────────────────────────────────────────────────────────────────────
exports.getAllStudents = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        s.student_id, s.full_name, s.register_number, s.department,
        s.semester, s.cgpa, s.batch_year, s.history_of_arrears,
        u.email, u.status, u.user_id,
        (SELECT COUNT(*) FROM applications a WHERE a.student_id = s.student_id) as total_applications,
        (SELECT COUNT(*) FROM applications a WHERE a.student_id = s.student_id AND a.status = 'OFFERED') as offers
      FROM students s
      JOIN users u ON s.user_id = u.user_id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (s.full_name LIKE ? OR s.register_number LIKE ? OR u.email LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY s.full_name ASC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [students] = await db.query(query, params);

    // Total count
    let countQuery = "SELECT COUNT(*) as total FROM students s JOIN users u ON s.user_id = u.user_id WHERE 1=1";
    const countParams = [];
    if (search) {
      countQuery += " AND (s.full_name LIKE ? OR s.register_number LIKE ? OR u.email LIKE ?)";
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    const [[{ total }]] = await db.query(countQuery, countParams);

    res.json({
      data: students,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /admin/students/status — Activate / Deactivate student account
// ─────────────────────────────────────────────────────────────────────────────
exports.updateStudentStatus = async (req, res) => {
  try {
    const { userId, status } = req.body;
    const VALID_STATUSES = ['ACTIVE', 'INACTIVE'];
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value.' });
    }
    const [target] = await db.query('SELECT user_id, role FROM users WHERE user_id = ?', [userId]);
    if (target.length === 0) return res.status(404).json({ message: 'User not found.' });
    if (target[0].role !== 'STUDENT') {
      return res.status(403).json({ message: 'This endpoint is only for student accounts.' });
    }
    await db.query('UPDATE users SET status = ? WHERE user_id = ?', [status, userId]);
    res.json({ message: `Student account ${status === 'ACTIVE' ? 'activated' : 'deactivated'}.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /admin/activity-points — All pending (unverified) activity points
// ─────────────────────────────────────────────────────────────────────────────
exports.getPendingActivityPoints = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const [points] = await db.query(`
      SELECT 
        ap.activity_id, ap.activity_type, ap.points, ap.status, ap.proof_url,
        s.full_name, s.register_number, s.department
      FROM activity_points ap
      JOIN students s ON ap.student_id = s.student_id
      WHERE ap.status = 'PENDING'
      ORDER BY ap.activity_id ASC
      LIMIT ? OFFSET ?
    `, [parseInt(limit), parseInt(offset)]);

    const [[{ total }]] = await db.query("SELECT COUNT(*) as total FROM activity_points WHERE status = 'PENDING'");

    res.json({
      data: points,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /admin/activity-points/verify — Approve or reject an activity point entry
// ─────────────────────────────────────────────────────────────────────────────
exports.verifyActivityPoint = async (req, res) => {
  try {
    const { activityId, approve, rejectionReason } = req.body;

    if (approve) {
      await db.query(
        "UPDATE activity_points SET status = 'APPROVED', verified_at = NOW() WHERE activity_id = ?",
        [activityId]
      );
      res.json({ message: 'Activity points approved.' });
    } else {
      await db.query(
        "UPDATE activity_points SET status = 'REJECTED', rejection_reason = ?, verified_at = NOW() WHERE activity_id = ?",
        [rejectionReason || 'Rejected by Admin', activityId]
      );
      res.json({ message: 'Activity points entry rejected.' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /admin/companies — All visiting companies
// ─────────────────────────────────────────────────────────────────────────────
exports.getAllCompanies = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT c.*, 
        (SELECT COUNT(*) FROM job_roles jr WHERE jr.company_id = c.company_id) as job_role_count
      FROM companies c
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (c.company_name LIKE ? OR c.industry LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY c.company_name ASC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [companies] = await db.query(query, params);

    let countQuery = "SELECT COUNT(*) as total FROM companies WHERE 1=1";
    const countParams = [];
    if (search) {
      countQuery += " AND (company_name LIKE ? OR industry LIKE ?)";
      countParams.push(`%${search}%`, `%${search}%`);
    }
    const [[{ total }]] = await db.query(countQuery, countParams);

    res.json({
      data: companies,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /admin/companies/:id — Company details + Job roles
// ─────────────────────────────────────────────────────────────────────────────
exports.getCompanyDetails = async (req, res) => {
  try {
    const { id } = req.params;
    // Fetch company basic info (with logo_url aliased as website for legacy support)
    const [company] = await db.query(
      'SELECT *, logo_url as website FROM companies WHERE company_id = ?',
      [id]
    );

    if (company.length === 0) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Fetch job roles for this company (using LEFT JOIN to ensure roles without criteria are still shown)
    const [roles] = await db.query(
      `SELECT jr.*, ec.min_cgpa, ec.min_semester, ec.eligible_departments, ec.max_backlogs 
       FROM job_roles jr
       LEFT JOIN eligibility_criteria ec ON jr.job_role_id = ec.job_role_id
       WHERE jr.company_id = ?`,
      [id]
    );

    // If headquarters is empty, use the location from the first job role found
    let headquarters = company[0].headquarters;
    if (!headquarters && roles.length > 0) {
      headquarters = roles[0].location;
    }

    // If company description is empty, use the first job's description as a fallback
    let description = company[0].description;
    if (!description && roles.length > 0) {
      description = roles[0].job_description;
    }

    res.json({
      ...company[0],
      description,
      headquarters,
      roles
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /admin/job-roles/:id/analytics — Recruitment stats for a specific role
// ─────────────────────────────────────────────────────────────────────────────
exports.getJobRoleAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Aggregate stats from applications table
    const [[{ applied }]] = await db.query('SELECT COUNT(*) as applied FROM applications WHERE job_role_id = ?', [id]);
    const [[{ eligible }]] = await db.query('SELECT COUNT(*) as eligible FROM applications WHERE job_role_id = ? AND is_eligible = 1', [id]);
    const [[{ offered }]] = await db.query("SELECT COUNT(*) as offered FROM applications WHERE job_role_id = ? AND status = 'OFFERED'", [id]);

    res.json({ applied, eligible, offered });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /admin/job-roles/:id/offered-students — List of students who got offers
// ─────────────────────────────────────────────────────────────────────────────
exports.getJobRoleOfferedStudents = async (req, res) => {
  try {
    const { id } = req.params;
    const [students] = await db.query(`
      SELECT s.student_id, s.full_name, s.register_number, s.department, u.email
      FROM applications a
      JOIN students s ON a.student_id = s.student_id
      JOIN users u ON s.user_id = u.user_id
      WHERE a.job_role_id = ? AND a.status = 'OFFERED'
    `, [id]);

    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};