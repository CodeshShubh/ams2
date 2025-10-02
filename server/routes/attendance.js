const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticate, requireEmployee } = require('../middleware/auth');
const { 
  validateCheckIn, 
  validateCheckOut, 
  validateDateRange 
} = require('../middleware/validation');

// Employee attendance routes
router.post('/checkin', authenticate, requireEmployee, validateCheckIn, attendanceController.checkIn);
router.post('/checkout', authenticate, requireEmployee, validateCheckOut, attendanceController.checkOut);
router.post('/upload-photo', authenticate, requireEmployee, attendanceController.uploadAttendancePhoto);
router.get('/status', authenticate, requireEmployee, attendanceController.getCurrentStatus);
router.get('/history', authenticate, requireEmployee, validateDateRange, attendanceController.getAttendanceHistory);
router.get('/monthly-summary', authenticate, requireEmployee, attendanceController.getMonthlySummary);

module.exports = router;