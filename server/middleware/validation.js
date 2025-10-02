const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// User validation rules
const validateUserRegistration = [
  body('employeeId')
    .notEmpty()
    .withMessage('Employee ID is required')
    .isLength({ min: 3, max: 20 })
    .withMessage('Employee ID must be between 3-20 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Employee ID can only contain letters, numbers, hyphens, and underscores'),
    
  body('firstName')
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2-50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),
    
  body('lastName')
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2-50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),
    
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
    
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
    
  body('role')
    .optional()
    .isIn(['admin', 'employee'])
    .withMessage('Role must be either admin or employee'),
    
  body('department')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Department name cannot exceed 100 characters'),
    
  body('position')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Position cannot exceed 100 characters'),
    
  body('phone')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number'),
    
  handleValidationErrors
];

const validateUserLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
    
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
    
  handleValidationErrors
];

const validateUserUpdate = [
  body('firstName')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2-50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),
    
  body('lastName')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2-50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),
    
  body('department')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Department name cannot exceed 100 characters'),
    
  body('position')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Position cannot exceed 100 characters'),
    
  body('phone')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number'),
    
  handleValidationErrors
];

// Attendance validation rules
const validateCheckIn = [
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be a valid number between -90 and 90'),
    
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be a valid number between -180 and 180'),
    
  body('address')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Address cannot exceed 200 characters'),
    
  handleValidationErrors
];

const validateCheckOut = [
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be a valid number between -90 and 90'),
    
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be a valid number between -180 and 180'),
    
  body('address')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Address cannot exceed 200 characters'),
    
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
    
  handleValidationErrors
];

// Geofence validation rules
const validateGeofence = [
  body('name')
    .notEmpty()
    .withMessage('Geofence name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Geofence name must be between 2-100 characters'),
    
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be a valid number between -90 and 90'),
    
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be a valid number between -180 and 180'),
    
  body('radius')
    .isInt({ min: 1, max: 10000 })
    .withMessage('Radius must be between 1 and 10000 meters'),
    
  body('address')
    .notEmpty()
    .withMessage('Address is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Address must be between 5-200 characters'),
    
  handleValidationErrors
];

// Query validation rules
const validateDateRange = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
    
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
    
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
    
  handleValidationErrors
];

const validateObjectId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format'),
    
  handleValidationErrors
];

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validateUserUpdate,
  validateCheckIn,
  validateCheckOut,
  validateGeofence,
  validateDateRange,
  validateObjectId,
  handleValidationErrors
};