const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { 
  getReports,
  generateReport,
  getReportById,
  deleteReport
} = require('../controllers/report.controller');

// Public routes (if any)

// Protected routes
router.use(protect);

// Get all reports
router.get('/', getReports);

// Generate a new report
router.post('/', generateReport);

// Get specific report by ID
router.get('/:id', getReportById);

// Delete report
router.delete('/:id', authorize('admin'), deleteReport);

module.exports = router; 