const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { 
  getReportData,
  generateReport,
  //getReportById,
  //deleteReport
} = require('../controllers/reportController');

// Public routes (if any)

// Protected routes
router.use(protect);

// Get all reports
router.get('/', getReportData);

// Generate a new report
router.post('/', generateReport);

// // Get specific report by ID
// router.get('/:id', getReportById);

// // Delete report
// router.delete('/:id', authorize('admin'), deleteReport);

module.exports = router; 