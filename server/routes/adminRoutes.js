const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, authorizeRole } = require('../middlewares/authMiddleware');

// All routes require ADMIN role
router.use(verifyToken, authorizeRole(['ADMIN']));

router.get('/staff', adminController.getAllStaff);
router.post('/staff/status', adminController.updateStaffStatus);

module.exports = router;