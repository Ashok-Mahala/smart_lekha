const express = require('express');
const router = express.Router();
const { protect} = require('../middleware/auth');
const { handleFileUpload } = require('../utils/fileUpload');
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

// Protected routes (require authentication)
router.use(protect);
router.get('/property/:propertyId', getSeatsByProperty);
router.get('/shifts', getShifts);
router.get('/stats', getSeatStats);
router.post('/:seatId/book', handleFileUpload, bookSeat);
router.post('/:id/reserve', reserveSeat);
router.post('/:id/release', releaseSeat);
router.post('/bulk-update', bulkUpdateSeats);
router.post('/bulk-delete', bulkDeleteSeats);
router.delete('/:id', deleteSeat);

router.post('/bulk', bulkCreateSeats);
router.put('/:id/status', updateSeatStatus);

module.exports = router;