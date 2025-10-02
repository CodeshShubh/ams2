const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { 
  validateUserRegistration, 
  validateUserLogin 
} = require('../middleware/validation');

// Public routes
router.post('/register', validateUserRegistration, authController.register);
router.post('/login', validateUserLogin, authController.login);
router.post('/refresh-token', authController.refreshToken);

// Protected routes
router.get('/me', authenticate, authController.getMe);
router.post('/logout', authenticate, authController.logout);
router.put('/change-password', authenticate, authController.changePassword);

module.exports = router;