const { body, query, param } = require('express-validator');

const validatePayment = [
  body('type').isIn(['payment', 'refund', 'adjustment']),
  body('amount').isFloat({ min: 0 }),
  body('currency').isString().isLength({ min: 3, max: 3 }),
  body('status').isIn(['pending', 'completed', 'failed', 'refunded']),
  body('paymentMethod').isString(),
  body('reference').isString(),
  body('description').isString(),
  body('studentId').isMongoId(),
  body('bookingId').optional().isMongoId()
];

const validateSystemSettings = [
  body('maintenanceMode').isBoolean(),
  body('maintenanceMessage').optional().isString(),
  body('bookingSettings.maxBookingDuration').isInt({ min: 1 }),
  body('bookingSettings.minBookingDuration').isInt({ min: 1 }),
  body('bookingSettings.maxAdvanceBookingDays').isInt({ min: 1 }),
  body('bookingSettings.allowMultipleBookings').isBoolean(),
  body('bookingSettings.cancellationPolicy.allowed').isBoolean(),
  body('bookingSettings.cancellationPolicy.gracePeriod').isInt({ min: 0 }),
  body('bookingSettings.cancellationPolicy.penalty').isFloat({ min: 0, max: 100 }),
  body('notificationSettings.emailNotifications').isBoolean(),
  body('notificationSettings.smsNotifications').isBoolean(),
  body('notificationSettings.notificationTypes').isArray(),
  body('paymentSettings.currency').isString().isLength({ min: 3, max: 3 }),
  body('paymentSettings.paymentMethods').isArray(),
  body('paymentSettings.taxRate').isFloat({ min: 0, max: 100 }),
  body('paymentSettings.lateFee').isFloat({ min: 0 }),
  body('securitySettings.sessionTimeout').isInt({ min: 1 }),
  body('securitySettings.maxLoginAttempts').isInt({ min: 1 }),
  body('securitySettings.passwordPolicy.minLength').isInt({ min: 6 }),
  body('securitySettings.passwordPolicy.requireSpecialChar').isBoolean(),
  body('securitySettings.passwordPolicy.requireNumbers').isBoolean()
];

const validateOperation = [
  body('type').isIn(['shift', 'maintenance', 'alert', 'log']),
  body('status').isIn(['pending', 'in_progress', 'completed', 'failed']),
  body('priority').isIn(['low', 'medium', 'high', 'critical']),
  body('title').isString(),
  body('description').isString(),
  body('assignedTo').isMongoId(),
  body('startTime').isISO8601(),
  body('endTime').optional().isISO8601(),
  body('location').optional().isString(),
  body('notes').optional().isString()
];

const validateReport = [
  body('type').isIn(['attendance', 'revenue', 'utilization', 'activity', 'trends', 'performance', 'custom']),
  body('period.start').isISO8601(),
  body('period.end').isISO8601(),
  body('filters').optional().isObject(),
  body('format').optional().isIn(['json', 'csv', 'pdf', 'excel'])
];

const validateDateRange = [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
];

const validatePagination = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
];

const validateId = [
  param('id').isMongoId()
];

module.exports = {
  validatePayment,
  validateSystemSettings,
  validateOperation,
  validateReport,
  validateDateRange,
  validatePagination,
  validateId
}; 