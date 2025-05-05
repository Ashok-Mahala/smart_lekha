const express = require('express');
const router = express.Router();
const studentController = require('../controllers/student.controller');
const { validateId } = require('../middleware/validation');

// Get all students
router.get('/', studentController.getAllStudents);

// Get student by ID
router.get('/:id', validateId, studentController.getStudentById);

// Create new student
router.post('/', studentController.createStudent);

// Update student
router.put('/:id', validateId, studentController.updateStudent);

// Delete student
router.delete('/:id', validateId, studentController.deleteStudent);

// Get student's bookings
router.get('/:id/bookings', validateId, studentController.getStudentBookings);

// Get student's payments
router.get('/:id/payments', validateId, studentController.getStudentPayments);

// Get student's attendance
router.get('/:id/attendance', validateId, studentController.getStudentAttendance);

// Upload student photo
router.post('/:id/photo', validateId, studentController.uploadStudentPhoto);

// Upload student ID proof
router.post('/:id/id-proof', validateId, studentController.uploadIdProof);

module.exports = router; 