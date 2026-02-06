const db = require('../config/db');
const resumeService = require('../services/resumeService');

exports.getProfile = async (req, res) => {
  try {
    // req.user.user_id comes from authMiddleware
    const [students] = await db.query('SELECT * FROM students WHERE user_id = ?', [req.user.user_id]);
    
    if (students.length === 0) return res.status(404).json({ message: 'Profile not found' });
    res.json(students[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.uploadResume = async (req, res) => {
  try {
    const { fileUrl, title } = req.body;
    
    // Get student_id (PK) using user_id (FK)
    const [students] = await db.query('SELECT student_id FROM students WHERE user_id = ?', [req.user.user_id]);
    if (students.length === 0) return res.status(404).json({ message: 'Student not found' });
    
    const result = await resumeService.uploadResume(students[0].student_id, fileUrl, title, 'STUDENT');
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getResumes = async (req, res) => {
  try {
    const [students] = await db.query('SELECT student_id FROM students WHERE user_id = ?', [req.user.user_id]);
    if (students.length === 0) return res.status(404).json({ message: 'Student not found' });
    
    const [resumes] = await db.query('SELECT * FROM resumes WHERE student_id = ?', [students[0].student_id]);
    res.json(resumes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};