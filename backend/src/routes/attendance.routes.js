const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');
const { validateDateRange, validateId } = require('../middleware/validation');

// Get all attendance records
router.get('/', validateDateRange, attendanceController.getAllAttendance);

// Get attendance by ID
router.get('/:id', validateId, attendanceController.getAttendanceById);

// Create new attendance record
router.post('/', attendanceController.createAttendance);

// Update attendance record
router.put('/:id', validateId, attendanceController.updateAttendance);

// Delete attendance record
router.delete('/:id', validateId, attendanceController.deleteAttendance);

// Get student attendance
router.get('/student/:studentId', validateId, validateDateRange, attendanceController.getStudentAttendance);

// Get attendance stats
router.get('/stats/:studentId', validateId, validateDateRange, attendanceController.getAttendanceStats);

module.exports = router; 