const express = require('express');
const router = express.Router();
const seatController = require('../controllers/seat.controller');
const { validateId } = require('../middleware/validation');

// Get all seats
router.get('/', seatController.getAllSeats);

// Get seat by ID
router.get('/:id', validateId, seatController.getSeatById);

// Create new seat
router.post('/', seatController.createSeat);

// Update seat
router.put('/:id', validateId, seatController.updateSeat);

// Delete seat
router.delete('/:id', validateId, seatController.deleteSeat);

// Get seat availability
router.get('/:id/availability', validateId, seatController.getSeatAvailability);

// Update seat status
router.put('/:id/status', validateId, seatController.updateSeatStatus);

// Get seat types
router.get('/types', seatController.getSeatTypes);

// Get seat summary
router.get('/summary', seatController.getSeatSummary);

module.exports = router; 