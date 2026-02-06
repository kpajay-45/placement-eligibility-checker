const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { email, password, role, profile } = req.body;

    // 1. Check if user exists
    const [existing] = await connection.query('SELECT user_id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // 2. Hash Password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 3. Insert into Users Table
    const [userResult] = await connection.query(
      'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)',
      [email, passwordHash, role]
    );
    const userId = userResult.insertId;

    // 4. Insert into Profile Table based on Role
    if (role === 'STUDENT') {
      const { register_number, full_name, department, semester, cgpa } = profile;
      await connection.query(
        `INSERT INTO students (user_id, register_number, full_name, department, semester, cgpa) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, register_number, full_name, department, semester, cgpa]
      );
    } else if (role === 'PLACEMENT_STAFF') {
      const { name, designation } = profile;
      await connection.query(
        'INSERT INTO placement_staff (user_id, name, designation) VALUES (?, ?, ?)',
        [userId, name, designation]
      );
    }

    await connection.commit();
    res.status(201).json({ message: 'User registered successfully' });

  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  } finally {
    connection.release();
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

    if (users.length === 0) return res.status(401).json({ message: 'Invalid credentials' });

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { user_id: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ token, role: user.role });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};