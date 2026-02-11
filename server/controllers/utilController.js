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