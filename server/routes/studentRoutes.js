const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware.verifyToken);
router.use(authMiddleware.authorizeRole(['STUDENT']));

router.get('/profile', studentController.getProfile);
router.put('/profile', studentController.updateProfile);
router.get('/jobs/eligible', studentController.getEligibleJobs);
router.post('/jobs/apply', studentController.applyJob);
router.get('/applications', studentController.getAppliedJobs);
router.post('/resume/upload', studentController.uploadResume);
router.get('/resumes', studentController.getResumes);

// Skills routes
router.get('/skills', studentController.getSkills);
router.post('/skills', studentController.addSkill);
router.delete('/skills/:skillId', studentController.deleteSkill);

// Activity Points
router.get('/activity-points', studentController.getActivityPoints);
router.post('/activity-points', studentController.submitActivityPoint);

module.exports = router;