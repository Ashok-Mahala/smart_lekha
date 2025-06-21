const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getShifts,
  createShift,
  updateShift,
  deleteShift
} = require('../controllers/shiftControllers');

// Protected routes
router.use(protect);

router.get('/', getShifts);
router.post('/', createShift);
router.put('/:id', updateShift);
router.delete('/:id', deleteShift);

module.exports = router;