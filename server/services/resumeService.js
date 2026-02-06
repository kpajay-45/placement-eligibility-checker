const db = require('../config/db');

const uploadResume = async (studentId, fileUrl, title = 'Default Resume', editedBy = 'STUDENT') => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Check or Create Resume Container (Table: resumes)
    // Schema uses 'student_id' and 'resume_title'
    const [existingResumes] = await connection.query(
      'SELECT resume_id FROM resumes WHERE student_id = ? AND resume_title = ?', 
      [studentId, title]
    );

    let resumeId;
    if (existingResumes.length === 0) {
      const [resResult] = await connection.query(
        'INSERT INTO resumes (student_id, resume_title, is_active) VALUES (?, ?, TRUE)',
        [studentId, title]
      );
      resumeId = resResult.insertId;
    } else {
      resumeId = existingResumes[0].resume_id;
    }

    // 2. Determine Version Number (Table: resume_versions)
    const [versions] = await connection.query(
      'SELECT MAX(version_number) as max_v FROM resume_versions WHERE resume_id = ?',
      [resumeId]
    );
    const nextVersion = (versions[0].max_v || 0) + 1;

    // 3. Insert New Version
    // Schema: resume_url, edited_by (ENUM), edited_at (Default CURRENT_TIMESTAMP)
    await connection.query(
      `INSERT INTO resume_versions 
       (resume_id, version_number, resume_url, edited_by) 
       VALUES (?, ?, ?, ?)`,
      [resumeId, nextVersion, fileUrl, editedBy]
    );

    // 4. AUDIT LOGIC: Flag existing applications as updated
    // Schema: applications.resume_updated_after_apply
    // If a student updates a resume that is currently used in an active application, flag it.
    if (editedBy === 'STUDENT') {
      await connection.query(
        `UPDATE applications 
         SET resume_updated_after_apply = TRUE 
         WHERE resume_id = ? 
         AND status IN ('APPLIED', 'SHORTLISTED')`,
        [resumeId]
      );
    }

    await connection.commit();
    return { resumeId, version: nextVersion };

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = { uploadResume };