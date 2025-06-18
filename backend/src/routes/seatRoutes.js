const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getSeatsByProperty,
  bulkCreateSeats,
  bookSeat,
  reserveSeat,
  releaseSeat,
  getSeatStats,
  getShifts,
  updateSeatStatus,
  deleteSeat,
  bulkUpdateSeats,
  bulkDeleteSeats
} = require('../controllers/seatController');
// const {
//   bulkCreateValidation,
//   bookSeatValidation,
//   reserveSeatValidation,
//   updateStatusValidation
// } = require('../validations/seatValidation');

// Public routes
router.get('/property/:propertyId', getSeatsByProperty);
router.get('/shifts', getShifts);
router.get('/stats', getSeatStats);

// Protected routes (require authentication)
router.use(protect);

// Student routes
router.post('/:id/book', bookSeat);
router.post('/:id/reserve', reserveSeat);
router.post('/:id/release', releaseSeat);
router.post('/bulk-update', bulkUpdateSeats);
router.post('/bulk-delete', bulkDeleteSeats);
router.delete('/:id', deleteSeat);

// Admin routes
// router.use(authorize('admin'));
router.post('/bulk', bulkCreateSeats);
router.put('/:id/status', updateSeatStatus);

module.exports = router;