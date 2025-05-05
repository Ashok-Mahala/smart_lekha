const { body, query, param } = require('express-validator');

// Create attendance validation
exports.createAttendanceValidation = [
  body('student')
    .isMongoId()
    .withMessage('Invalid student ID'),
  body('seat')
    .isMongoId()
    .withMessage('Invalid seat ID'),
  body('date')
    .isISO8601()
    .withMessage('Invalid date format'),
  body('status')
    .isIn(['present', 'absent', 'late'])
    .withMessage('Invalid status'),
  body('notes')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 3, max: 500 })
    .withMessage('Notes must be between 3 and 500 characters')
];

// Update attendance validation
exports.updateAttendanceValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid attendance record ID'),
  body('status')
    .optional()
    .isIn(['present', 'absent', 'late'])
    .withMessage('Invalid status'),
  body('notes')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 3, max: 500 })
    .withMessage('Notes must be between 3 and 500 characters')
];

// Get attendance records validation
exports.getAttendanceValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('student')
    .optional()
    .isMongoId()
    .withMessage('Invalid student ID'),
  query('seat')
    .optional()
    .isMongoId()
    .withMessage('Invalid seat ID'),
  query('status')
    .optional()
    .isIn(['present', 'absent', 'late'])
    .withMessage('Invalid status'),
  query('date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format')
];

// Get attendance stats validation
exports.getAttendanceStatsValidation = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format')
    .custom((value, { req }) => {
      if (req.query.startDate && new Date(value) < new Date(req.query.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    })
];

// Get student attendance validation
exports.getStudentAttendanceValidation = [
  param('studentId')
    .isMongoId()
    .withMessage('Invalid student ID'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format')
    .custom((value, { req }) => {
      if (req.query.startDate && new Date(value) < new Date(req.query.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    })
]; 