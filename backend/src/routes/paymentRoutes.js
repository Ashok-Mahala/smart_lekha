const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createPaymentValidation,
  updatePaymentValidation,
  getPaymentsValidation,
  completePaymentValidation,
  cancelPaymentValidation,
  getPaymentStatsValidation,
  getStudentPaymentsValidation
} = require('../validations/paymentValidation');
const {
  getPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment,
  completePayment,
  cancelPayment,
  getPaymentStats,
  getStudentPayments
} = require('../controllers/paymentController');

// Public routes
router.get('/', validate(getPaymentsValidation), getPayments);
router.get('/:id', getPaymentById);

// Protected routes
// router.use(protect);

router.post('/', validate(createPaymentValidation), createPayment);
router.put('/:id', validate(updatePaymentValidation), updatePayment);
router.put('/:id/complete', validate(completePaymentValidation), completePayment);
router.put('/:id/cancel', validate(cancelPaymentValidation), cancelPayment);
router.get('/student/:studentId', validate(getStudentPaymentsValidation), getStudentPayments);

// Admin only routes
router.use(authorize('admin'));
router.delete('/:id', deletePayment);
router.get('/stats', validate(getPaymentStatsValidation), getPaymentStats);

module.exports = router; 