const db = require('../config/db');

/**
 * Generates a shortlist for a specific job role based on weighted ranking.
 * Formula: (CGPA * 10 * 0.7) + (Activity Points * 0.3)
 * Guard: Prevents generating a duplicate shortlist for the same job.
 */
const generateShortlist = async (jobRoleId, staffId) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // FIX: Guard against duplicate shortlists for the same job
        const [existingShortlist] = await connection.query(
            'SELECT shortlist_id FROM shortlists WHERE job_role_id = ?',
            [jobRoleId]
        );
        if (existingShortlist.length > 0) {
            const err = new Error('A shortlist has already been generated for this job. Delete the existing one before regenerating.');
            err.statusCode = 409;
            throw err;
        }

        // 1. Fetch eligible applicants
        const query = `
      SELECT 
        a.application_id,
        a.student_id,
        s.cgpa,
        COALESCE(SUM(ap.points), 0) as total_activity_points
      FROM applications a
      JOIN students s ON a.student_id = s.student_id
      LEFT JOIN activity_points ap ON s.student_id = ap.student_id AND ap.status = 'APPROVED'
      WHERE a.job_role_id = ? 
        AND a.status = 'APPLIED'
        AND (a.is_eligible = TRUE OR a.is_overridden = TRUE)
      GROUP BY a.application_id, a.student_id, s.cgpa
    `;
        const [applicants] = await connection.query(query, [jobRoleId]);

        if (applicants.length === 0) {
            throw new Error('No eligible applicants found to shortlist.');
        }

        // 2. Fetch criteria snapshot
        const [criteria] = await connection.query(
            'SELECT * FROM eligibility_criteria WHERE job_role_id = ?',
            [jobRoleId]
        );

        // 3. Create shortlist record
        const [shortlistResult] = await connection.query(
            'INSERT INTO shortlists (job_role_id, generated_by, criteria_snapshot) VALUES (?, ?, ?)',
            [jobRoleId, staffId, JSON.stringify(criteria[0] || {})]
        );
        const shortlistId = shortlistResult.insertId;

        // 4. Calculate scores and insert members
        const membersValues = applicants.map(app => {
            const cgpaScore = (parseFloat(app.cgpa) || 0) * 10;
            const activityScore = parseInt(app.total_activity_points) || 0;
            const rankScore = (cgpaScore * 0.7) + (activityScore * 0.3);
            return [shortlistId, app.student_id, rankScore.toFixed(2)];
        });

        await connection.query(
            'INSERT INTO shortlist_members (shortlist_id, student_id, rank_score) VALUES ?',
            [membersValues]
        );

        // 5. Update application statuses to SHORTLISTED
        const studentIds = applicants.map(a => a.student_id);
        await connection.query(
            'UPDATE applications SET status = "SHORTLISTED" WHERE job_role_id = ? AND student_id IN (?)',
            [jobRoleId, studentIds]
        );

        await connection.commit();
        return { shortlistId, count: applicants.length };

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

const getShortlistsForJob = async (jobRoleId) => {
    const query = `
    SELECT sl.*, ps.name as staff_name, COUNT(sm.student_id) as student_count
    FROM shortlists sl
    JOIN placement_staff ps ON sl.generated_by = ps.staff_id
    LEFT JOIN shortlist_members sm ON sl.shortlist_id = sm.shortlist_id
    WHERE sl.job_role_id = ?
    GROUP BY sl.shortlist_id
    ORDER BY sl.created_at DESC
  `;
    const [rows] = await db.query(query, [jobRoleId]);
    return rows;
};

module.exports = {
    generateShortlist,
    getShortlistsForJob
};
