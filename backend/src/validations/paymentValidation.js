const { body, query, param } = require('express-validator');

// Create payment validation
exports.createPaymentValidation = [
  body('student')
    .isMongoId()
    .withMessage('Invalid student ID'),
  body('amount')
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),
  body('type')
    .isIn(['tuition', 'seat', 'other'])
    .withMessage('Invalid payment type'),
  body('description')
    .isString()
    .trim()
    .isLength({ min: 3, max: 500 })
    .withMessage('Description must be between 3 and 500 characters'),
  body('paymentMethod')
    .isIn(['cash', 'card', 'bank_transfer', 'other'])
    .withMessage('Invalid payment method')
];

// Update payment validation
exports.updatePaymentValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid payment ID'),
  body('amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),
  body('type')
    .optional()
    .isIn(['tuition', 'seat', 'other'])
    .withMessage('Invalid payment type'),
  body('description')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 3, max: 500 })
    .withMessage('Description must be between 3 and 500 characters'),
  body('paymentMethod')
    .optional()
    .isIn(['cash', 'card', 'bank_transfer', 'other'])
    .withMessage('Invalid payment method')
];

// Get payments validation
exports.getPaymentsValidation = [
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
  query('status')
    .optional()
    .isIn(['pending', 'completed', 'cancelled'])
    .withMessage('Invalid status'),
  query('type')
    .optional()
    .isIn(['tuition', 'seat', 'other'])
    .withMessage('Invalid payment type'),
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

// Complete payment validation
exports.completePaymentValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid payment ID'),
  body('notes')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 3, max: 500 })
    .withMessage('Notes must be between 3 and 500 characters')
];

// Cancel payment validation
exports.cancelPaymentValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid payment ID'),
  body('reason')
    .isString()
    .trim()
    .isLength({ min: 3, max: 500 })
    .withMessage('Cancellation reason must be between 3 and 500 characters')
];

// Get payment stats validation
exports.getPaymentStatsValidation = [
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

// Get student payments validation
exports.getStudentPaymentsValidation = [
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