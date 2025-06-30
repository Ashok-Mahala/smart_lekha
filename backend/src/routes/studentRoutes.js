const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getStudentsByProperty,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentStatsByProperty
} = require('../controllers/studentController');

router.use(protect);

router.get('/property/:propertyId', getStudentsByProperty);
router.get('/stats', getStudentStatsByProperty);
router.get('/:id', getStudentById);
router.post('/', createStudent);
router.put('/:id', updateStudent);
router.delete('/:id', deleteStudent);

module.exports = router;
