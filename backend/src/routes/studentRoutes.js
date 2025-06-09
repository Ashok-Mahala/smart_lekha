const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentStats
} = require('../controllers/studentController');

// Public routes
router.get('/', getStudents);
router.get('/stats', getStudentStats);
router.get('/:id', getStudentById);

// Protected routes (require authentication)
router.use(protect);

// Admin only routes
router.use(authorize('admin'));
router.post('/', createStudent);
router.put('/:id', updateStudent);
router.delete('/:id', deleteStudent);

module.exports = router; 