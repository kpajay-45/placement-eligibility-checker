const db = require('../config/db');

exports.getDepartments = async (req, res) => {
  try {
    // Fetch all departments sorted alphabetically
    const [rows] = await db.query('SELECT dept_name FROM departments ORDER BY dept_name ASC');
    // Transform [{dept_name: 'CSE'}, ...] into ['CSE', ...]
    const deptNames = rows.map(row => row.dept_name);
    res.json(deptNames);
  } catch (err) {
    console.error('Error fetching departments:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getStudentFullDetails = async (req, res) => {
  try {
    const { studentId } = req.params;

    // 1. Basic Details
    const [studentRows] = await db.query(`
      SELECT s.student_id, s.full_name, s.register_number, s.department, s.semester, s.cgpa,
             s.batch_year, s.history_of_arrears, s.attendance_percentage,
             s.marks_10th, s.marks_12th,
             s.sgpa_sem1, s.sgpa_sem2, s.sgpa_sem3, s.sgpa_sem4,
             s.sgpa_sem5, s.sgpa_sem6, s.sgpa_sem7, s.sgpa_sem8,
             u.email, u.status
      FROM students s
      JOIN users u ON s.user_id = u.user_id
      WHERE s.student_id = ?
    `, [studentId]);

    if (studentRows.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }
    const studentInfo = studentRows[0];

    // 2. Skills
    const [skills] = await db.query('SELECT skill_name, certificate_url FROM student_skills WHERE student_id = ?', [studentId]);

    // 3. Activity Points
    const [activityPoints] = await db.query('SELECT activity_type, points, status, proof_url FROM activity_points WHERE student_id = ?', [studentId]);

    res.json({
      ...studentInfo,
      skills,
      activityPoints
    });
  } catch (error) {
    console.error('Error fetching student full details:', error);
    res.status(500).json({ message: 'Server error' });
  }
};