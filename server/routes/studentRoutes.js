const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const jobController = require('../controllers/jobController');
const { verifyToken, authorizeRole } = require('../middlewares/authMiddleware');

// All routes require STUDENT role
router.use(verifyToken, authorizeRole(['STUDENT']));

router.get('/profile', studentController.getProfile);
router.post('/resume/upload', studentController.uploadResume);
router.get('/resumes', studentController.getResumes);
router.get('/jobs/eligible', jobController.getEligibleJobs);
router.post('/jobs/apply', jobController.applyForJob);

module.exports = router;