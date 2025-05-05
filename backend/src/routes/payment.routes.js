const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { validateId, validateDateRange } = require('../middleware/validation');

// Get all payments
router.get('/', validateDateRange, paymentController.getAllPayments);

// Get payment by ID
router.get('/:id', validateId, paymentController.getPaymentById);

// Create new payment
router.post('/', paymentController.createPayment);

// Update payment
router.put('/:id', validateId, paymentController.updatePayment);

// Delete payment
router.delete('/:id', validateId, paymentController.deletePayment);

// Get payment summary
router.get('/summary', validateDateRange, paymentController.getPaymentSummary);

// Get payment by student
router.get('/student/:studentId', validateId, validateDateRange, paymentController.getPaymentsByStudent);

// Get payment by booking
router.get('/booking/:bookingId', validateId, validateDateRange, paymentController.getPaymentsByBooking);

// Process payment
router.post('/process', paymentController.processPayment);

// Refund payment
router.post('/:id/refund', validateId, paymentController.refundPayment);

module.exports = router; 