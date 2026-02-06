const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const { verifyToken, authorizeRole } = require('../middlewares/authMiddleware');

// All routes require PLACEMENT_STAFF role
router.use(verifyToken, authorizeRole(['PLACEMENT_STAFF']));

router.post('/jobs/create', staffController.createJob);
router.get('/applications/audit', staffController.getAuditApplications);
router.get('/jobs/list', staffController.getPostedJobs);
router.get('/jobs/:jobId/applicants', staffController.getJobApplicants);
router.post('/applications/status', staffController.updateApplicationStatus);

module.exports = router;