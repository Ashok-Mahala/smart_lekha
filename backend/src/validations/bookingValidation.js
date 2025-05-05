const { body, query, param } = require('express-validator');

// Create booking validation
exports.createBookingValidation = [
  body('student')
    .isMongoId()
    .withMessage('Invalid student ID'),
  body('seat')
    .isMongoId()
    .withMessage('Invalid seat ID'),
  body('startDate')
    .isISO8601()
    .withMessage('Invalid start date format')
    .custom((value, { req }) => {
      if (new Date(value) < new Date()) {
        throw new Error('Start date cannot be in the past');
      }
      return true;
    }),
  body('endDate')
    .isISO8601()
    .withMessage('Invalid end date format')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  body('purpose')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 3, max: 500 })
    .withMessage('Purpose must be between 3 and 500 characters')
];

// Update booking validation
exports.updateBookingValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid booking ID'),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format')
    .custom((value, { req }) => {
      if (new Date(value) < new Date()) {
        throw new Error('Start date cannot be in the past');
      }
      return true;
    }),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  body('purpose')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 3, max: 500 })
    .withMessage('Purpose must be between 3 and 500 characters')
];

// Get bookings validation
exports.getBookingsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(['active', 'completed', 'cancelled'])
    .withMessage('Invalid status'),
  query('student')
    .optional()
    .isMongoId()
    .withMessage('Invalid student ID'),
  query('seat')
    .optional()
    .isMongoId()
    .withMessage('Invalid seat ID')
];

// Cancel booking validation
exports.cancelBookingValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid booking ID'),
  body('reason')
    .isString()
    .trim()
    .isLength({ min: 3, max: 500 })
    .withMessage('Cancellation reason must be between 3 and 500 characters')
];

// Complete booking validation
exports.completeBookingValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid booking ID'),
  body('notes')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 3, max: 500 })
    .withMessage('Completion notes must be between 3 and 500 characters')
]; 