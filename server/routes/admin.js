const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { 
  validateGeofence, 
  validateDateRange 
} = require('../middleware/validation');

// Admin dashboard and statistics
router.get('/dashboard', authenticate, requireAdmin, adminController.getDashboardStats);
router.get('/attendance', authenticate, requireAdmin, validateDateRange, adminController.getAllAttendance);
router.get('/reports', authenticate, requireAdmin, validateDateRange, adminController.generateReport);

// Geofence management
router.get('/geofence', authenticate, requireAdmin, adminController.getGeofenceSettings);
router.put('/geofence', authenticate, requireAdmin, validateGeofence, adminController.updateGeofenceSettings);

// System health
router.get('/health', authenticate, requireAdmin, adminController.getSystemHealth);

module.exports = router;