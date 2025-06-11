const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const financialController = require('../controllers/financialController');
const { validateId, validateDateRange } = require('../middleware/validation');

// Public routes
router.get('/', validateDateRange, financialController.getAllPayments);
router.get('/:id', validateId, financialController.getPaymentById);

// Protected routes
// router.use(protect);
router.post('/', financialController.createPayment);
router.put('/:id', validateId, financialController.updatePayment);
router.get('/user', financialController.getPaymentsByUser);

// Admin only routes
router.use(authorize('admin'));
router.delete('/:id', validateId, financialController.deletePayment);
router.get('/summary', validateDateRange, financialController.getPaymentsSummary);

module.exports = router;