const { body, query, param } = require('express-validator');

// Create seat validation
const createSeatValidation = [
  body('seatNumber')
    .notEmpty()
    .withMessage('Seat number is required')
    .isString()
    .withMessage('Seat number must be a string'),
  body('row')
    .notEmpty()
    .withMessage('Row is required')
    .isString()
    .withMessage('Row must be a string'),
  body('column')
    .notEmpty()
    .withMessage('Column is required')
    .isInt()
    .withMessage('Column must be a number'),
  body('type')
    .notEmpty()
    .withMessage('Type is required')
    .isIn(['standard', 'premium', 'handicap', 'other'])
    .withMessage('Invalid seat type'),
  body('features')
    .optional()
    .isArray()
    .withMessage('Features must be an array')
    .custom((value) => {
      const validFeatures = ['power_outlet', 'table', 'extra_space', 'window', 'aisle'];
      return value.every(feature => validFeatures.includes(feature));
    })
    .withMessage('Invalid feature type')
];

// Update seat validation
const updateSeatValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid seat ID'),
  body('seatNumber')
    .optional()
    .isString()
    .withMessage('Seat number must be a string'),
  body('row')
    .optional()
    .isString()
    .withMessage('Row must be a string'),
  body('column')
    .optional()
    .isInt()
    .withMessage('Column must be a number'),
  body('type')
    .optional()
    .isIn(['standard', 'premium', 'handicap', 'other'])
    .withMessage('Invalid seat type'),
  body('features')
    .optional()
    .isArray()
    .withMessage('Features must be an array')
    .custom((value) => {
      const validFeatures = ['power_outlet', 'table', 'extra_space', 'window', 'aisle'];
      return value.every(feature => validFeatures.includes(feature));
    })
    .withMessage('Invalid feature type')
];

// Get seats validation
const getSeatsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive number'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(['available', 'occupied', 'reserved', 'maintenance'])
    .withMessage('Invalid status'),
  query('type')
    .optional()
    .isIn(['standard', 'premium', 'handicap', 'other'])
    .withMessage('Invalid type'),
  query('features')
    .optional()
    .isString()
    .withMessage('Features must be a comma-separated string')
];

// Assign student validation
const assignStudentValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid seat ID'),
  body('studentId')
    .isMongoId()
    .withMessage('Invalid student ID')
];

module.exports = {
  createSeatValidation,
  updateSeatValidation,
  getSeatsValidation,
  assignStudentValidation
}; 