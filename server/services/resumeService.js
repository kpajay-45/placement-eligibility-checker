const db = require('../config/db');

/**
 * Uploads a new resume or adds a new version to an existing one.
 * 
 * FIX: When resumeId is provided (edit flow), use it directly instead of
 * matching by title — prevents versioning the wrong resume if two have the same title.
 */
const uploadResume = async (studentId, fileUrl, title = 'Default Resume', editedBy = 'STUDENT', resumeId = null) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    let resolvedResumeId;

    if (resumeId) {
      // EDIT MODE: Use the explicitly provided resumeId
      // Verify it belongs to this student
      const [owned] = await connection.query(
        'SELECT resume_id FROM resumes WHERE resume_id = ? AND student_id = ?',
        [resumeId, studentId]
      );
      if (owned.length === 0) {
        throw new Error('Resume not found or does not belong to this student.');
      }
      resolvedResumeId = resumeId;
    } else {
      // NEW MODE: Create a fresh resume container
      const [resResult] = await connection.query(
        'INSERT INTO resumes (student_id, resume_title, is_active) VALUES (?, ?, TRUE)',
        [studentId, title]
      );
      resolvedResumeId = resResult.insertId;
    }

    // Determine next version number
    const [versions] = await connection.query(
      'SELECT MAX(version_number) as max_v FROM resume_versions WHERE resume_id = ?',
      [resolvedResumeId]
    );
    const nextVersion = (versions[0].max_v || 0) + 1;

    // Insert new version
    await connection.query(
      `INSERT INTO resume_versions 
       (resume_id, version_number, resume_url, edited_by) 
       VALUES (?, ?, ?, ?)`,
      [resolvedResumeId, nextVersion, fileUrl, editedBy]
    );

    // AUDIT LOGIC: Flag existing applications if student updates an active resume
    if (editedBy === 'STUDENT') {
      await connection.query(
        `UPDATE applications 
         SET resume_updated_after_apply = TRUE 
         WHERE resume_id = ? 
         AND status IN ('APPLIED', 'SHORTLISTED')`,
        [resolvedResumeId]
      );
    }

    await connection.commit();
    return { resumeId: resolvedResumeId, version: nextVersion };

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = { uploadResume };