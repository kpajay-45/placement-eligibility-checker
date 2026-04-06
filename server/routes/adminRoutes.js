const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const utilController = require('../controllers/utilController');
const { verifyToken, authorizeRole } = require('../middlewares/authMiddleware');

// All routes require ADMIN role
router.use(verifyToken, authorizeRole(['ADMIN']));

// ── Staff Management ──
router.get('/staff', adminController.getAllStaff);
router.post('/staff/status', adminController.updateStaffStatus);

// ── Analytics ──
router.get('/stats', adminController.getStats);

// ── Student Management ──
router.get('/students', adminController.getAllStudents);
router.get('/students/:studentId/full', utilController.getStudentFullDetails);
router.post('/students/status', adminController.updateStudentStatus);

// ── Activity Points Verification ──
router.get('/activity-points', adminController.getPendingActivityPoints);
router.post('/activity-points/verify', adminController.verifyActivityPoint);

// ── Company Management ──
router.get('/companies', adminController.getAllCompanies);
router.get('/companies/detail/:id', adminController.getCompanyDetails);
router.get('/job-roles/analytics/:id', adminController.getJobRoleAnalytics);
router.get('/job-roles/offered-students/:id', adminController.getJobRoleOfferedStudents);

module.exports = router;