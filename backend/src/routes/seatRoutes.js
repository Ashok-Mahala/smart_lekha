const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getSeatsByProperty,
  assignStudentToSeat,
  releaseStudentFromSeat,
  cancelAssignment,
  bulkCreateSeats,
  reserveSeat,
  getSeatStats,
  updateSeatStatus,
  deleteSeat,
  bulkUpdateSeats,
  bulkDeleteSeats,
  getSeatAssignmentHistory,
  getSeatDetailedHistory,
  deassignStudent
} = require('../controllers/seatController');

// All routes are protected
router.use(protect);

// Get seats by property
router.get('/property/:propertyId', getSeatsByProperty);

// Seat assignment operations
router.post('/:seatId/assign', assignStudentToSeat);
router.post('/:seatId/release', releaseStudentFromSeat);
router.post('/:seatId/cancel', cancelAssignment);

// Seat management
router.post('/bulk', bulkCreateSeats);
router.put('/:id/status', updateSeatStatus);
router.delete('/:id', deleteSeat);
router.post('/bulk-update', bulkUpdateSeats);
router.post('/bulk-delete', bulkDeleteSeats);
router.post('/:seatId/deassign', deassignStudent);

// Reservation
router.post('/:id/reserve', reserveSeat);

// Statistics
router.get('/stats/seat-stats', getSeatStats);

// History
router.get('/:seatId/history', getSeatAssignmentHistory);
router.get('/:seatId/history/detailed', getSeatDetailedHistory);

module.exports = router;