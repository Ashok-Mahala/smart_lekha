const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createBookingValidation,
  updateBookingValidation,
  getBookingsValidation,
  cancelBookingValidation,
  completeBookingValidation
} = require('../validations/bookingValidation');
const {
  getBookings,
  getBookingById,
  createBooking,
  updateBooking,
  deleteBooking,
  cancelBooking,
  completeBooking,
  getBookingStats
} = require('../controllers/bookingController');

// Public routes
router.get('/', validate(getBookingsValidation), getBookings);
router.get('/:id', getBookingById);

// Protected routes
router.use(protect);

router.post('/', validate(createBookingValidation), createBooking);
router.put('/:id', validate(updateBookingValidation), updateBooking);
router.put('/:id/cancel', validate(cancelBookingValidation), cancelBooking);
router.put('/:id/complete', validate(completeBookingValidation), completeBooking);

// Admin only routes
router.use(authorize('admin'));
router.delete('/:id', deleteBooking);
router.get('/stats', getBookingStats);

module.exports = router; 