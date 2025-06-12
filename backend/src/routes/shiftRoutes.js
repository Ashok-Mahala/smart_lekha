const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getShifts,
  getShiftById,
  createShift,
  updateShift,
  deleteShift,
  getActiveShifts,
  getShiftsByZone,
  getShiftSchedule,
  getStaffShifts,
  getShiftStats
} = require('../controllers/shiftController');

// Public routes
router.get('/', getShifts);
router.get('/active', getActiveShifts);
router.get('/schedule', getShiftSchedule);
router.get('/zone/:zoneId', getShiftsByZone);
router.get('/staff/:staffId', getStaffShifts);
router.get('/:id', getShiftById);

// Protected routes
router.use(protect);

// Admin only routes
router.use(authorize('admin'));
router.post('/', createShift);
router.put('/:id', updateShift);
router.delete('/:id', deleteShift);
router.get('/stats', getShiftStats);

module.exports = router; 