const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const { validateId, validateDateRange } = require('../middleware/validation');

// Get all bookings
router.get('/', validateDateRange, bookingController.getAllBookings);

// Get booking by ID
router.get('/:id', validateId, bookingController.getBookingById);

// Create new booking
router.post('/', bookingController.createBooking);

// Update booking
router.put('/:id', validateId, bookingController.updateBooking);

// Delete booking
router.delete('/:id', validateId, bookingController.deleteBooking);

// Get booking summary
router.get('/summary', validateDateRange, bookingController.getBookingSummary);

module.exports = router; 