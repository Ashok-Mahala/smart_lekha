const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getSeatsByProperty,
  assignStudentToSeat,
  releaseStudentFromSeat,
  bulkCreateSeats,
  reserveSeat,
  updateSeatStatus,
  deleteSeat,
  bulkUpdateSeats,
  getSeatAssignmentHistory,
  deassignStudent,
  changeStudentSeat
} = require('../controllers/seatController');

// All routes are protected
router.use(protect);

// Get seats by property
router.get('/property/:propertyId', getSeatsByProperty);

// Seat assignment operations
router.post('/:seatId/assign', assignStudentToSeat);
router.post('/:seatId/release', releaseStudentFromSeat);

// Seat management
router.post('/bulk', bulkCreateSeats);
router.put('/:id/status', updateSeatStatus);
router.delete('/:id', deleteSeat);
router.post('/bulk-update', bulkUpdateSeats);
router.post('/:seatId/deassign', deassignStudent);
router.post('/change-seat', changeStudentSeat);

// Reservation
router.post('/:id/reserve', reserveSeat);

// History
router.get('/:seatId/history', getSeatAssignmentHistory);

module.exports = router;