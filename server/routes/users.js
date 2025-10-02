const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { 
  validateUserUpdate, 
  validateObjectId 
} = require('../middleware/validation');

// Protected user routes
router.get('/profile', authenticate, userController.getProfile);
router.put('/profile', authenticate, validateUserUpdate, userController.updateProfile);
router.post('/avatar', authenticate, userController.uploadAvatar);
router.delete('/avatar', authenticate, userController.deleteAvatar);

// Admin only routes
router.get('/', authenticate, requireAdmin, userController.getAllUsers);
router.get('/stats', authenticate, requireAdmin, userController.getUserStats);
router.get('/:id', authenticate, requireAdmin, validateObjectId, userController.getUserById);
router.put('/:id', authenticate, requireAdmin, validateObjectId, validateUserUpdate, userController.updateUserById);
router.delete('/:id', authenticate, requireAdmin, validateObjectId, userController.deleteUserById);

module.exports = router;