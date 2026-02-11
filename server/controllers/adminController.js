const db = require('../config/db');

exports.getAllStaff = async (req, res) => {
  try {
    // Fetch staff details joining users and placement_staff tables
    const query = `
      SELECT u.user_id, u.email, u.status, u.created_at, ps.name, ps.designation
      FROM users u
      LEFT JOIN placement_staff ps ON u.user_id = ps.user_id
      WHERE u.role = 'PLACEMENT_STAFF'
      ORDER BY u.created_at DESC
    `;
    const [staff] = await db.query(query);
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateStaffStatus = async (req, res) => {
  try {
    const { userId, status } = req.body; // 'ACTIVE' or 'INACTIVE'
    await db.query('UPDATE users SET status = ? WHERE user_id = ?', [status, userId]);
    res.json({ message: `Staff status updated to ${status}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};