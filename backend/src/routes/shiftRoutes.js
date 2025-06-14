const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getShifts,
  createShift,
  updateShift,
  deleteShift
} = require('../controllers/shiftControllers');

// Public routes
router.get('/', getShifts);

// Protected routes
router.use(protect);
router.post('/', createShift);
router.put('/:id', updateShift);
router.delete('/:id', deleteShift);

module.exports = router;