// routes/paymentRoutes.js - Complete version with all routes
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  completePayment,
  getPaymentStats,
  getStudentPayments,
  getOverduePayments,
  getDashboardStats,
} = require('../controllers/paymentController');

router.use(protect);

// Payment routes
router.get('/', getPayments);
router.get('/stats/dashboard', getDashboardStats);
router.get('/stats/payment-stats', getPaymentStats);
router.get('/overdue', getOverduePayments);
router.get('/student/:studentId', getStudentPayments);
router.get('/:id', getPaymentById);
router.post('/', createPayment);
router.put('/:id', updatePayment);
router.put('/:id/complete', completePayment);

module.exports = router;