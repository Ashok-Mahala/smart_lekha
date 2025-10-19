const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  getStudentsByProperty,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentStatsByProperty,
  getStudentAssignmentHistory,
  getStudentCurrentAssignments
} = require('../controllers/studentController');

// Create uploads directory if it doesn't exist
const uploadsDir = 'uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Uploads directory created:', uploadsDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Ensure directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept images and PDFs
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only images and PDF files are allowed!'), false);
    }
  }
});

// All routes are protected
router.use(protect);

// Student routes
router.get('/property/:propertyId', getStudentsByProperty);
router.get('/stats/student-stats', getStudentStatsByProperty);
router.get('/:id', getStudentById);
router.post('/', upload.any(), createStudent); // Add multer middleware here
router.put('/:id', updateStudent);
router.delete('/:id', deleteStudent);

// Assignment history
router.get('/:id/assignments/current', getStudentCurrentAssignments);
router.get('/:id/assignments/history', getStudentAssignmentHistory);

module.exports = router;