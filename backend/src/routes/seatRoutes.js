const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createSeatValidation,
  updateSeatValidation,
  getSeatsValidation,
  assignStudentValidation
} = require('../validations/seatValidation');
const {
  getSeats,
  getSeatById,
  createSeat,
  updateSeat,
  deleteSeat,
  getSeatAvailability,
  assignStudent,
  releaseSeat,
  getSeatStats
} = require('../controllers/seatController');

// Public routes
router.get('/', validate(getSeatsValidation), getSeats);
router.get('/availability', getSeatAvailability);
router.get('/stats', getSeatStats);
router.get('/:id', getSeatById);

// Protected routes (require authentication)
// router.use(protect);

// Admin only routes
router.use(authorize('admin'));
router.post('/', validate(createSeatValidation), createSeat);
router.put('/:id', validate(updateSeatValidation), updateSeat);
router.delete('/:id', deleteSeat);
router.post('/:id/assign', validate(assignStudentValidation), assignStudent);
router.post('/:id/release', releaseSeat);

module.exports = router; 