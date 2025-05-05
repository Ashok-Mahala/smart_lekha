const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createAttendanceValidation,
  updateAttendanceValidation,
  getAttendanceValidation,
  getAttendanceStatsValidation,
  getStudentAttendanceValidation
} = require('../validations/attendanceValidation');
const {
  getAttendanceRecords,
  getAttendanceById,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  getAttendanceStats,
  getStudentAttendance
} = require('../controllers/attendance.controller');

// Public routes
router.get('/', validate(getAttendanceValidation), getAttendanceRecords);
router.get('/:id', getAttendanceById);

// Protected routes
router.use(protect);

router.post('/', validate(createAttendanceValidation), createAttendance);
router.put('/:id', validate(updateAttendanceValidation), updateAttendance);
router.get('/student/:studentId', validate(getStudentAttendanceValidation), getStudentAttendance);

// Admin only routes
router.use(authorize('admin'));
router.delete('/:id', deleteAttendance);
router.get('/stats', validate(getAttendanceStatsValidation), getAttendanceStats);

module.exports = router; 