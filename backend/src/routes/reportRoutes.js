const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { validateDateRange, validateId } = require('../middleware/validation');

// Get daily summary report
router.get('/summary', reportController.getDailySummary);

// Get occupancy data
router.get('/occupancy', validateDateRange, reportController.getOccupancyData);

// Get revenue data
router.get('/revenue', validateDateRange, reportController.getRevenueData);

// Get student activity data
router.get('/student-activity', validateDateRange, reportController.getStudentActivityData);

// Get financial data
router.get('/financial', validateDateRange, reportController.getFinancialData);

// Get all reports
router.get('/', validateDateRange, reportController.getAllReports);

// Get report by ID
router.get('/:id', validateId, reportController.getReportById);

// Create new report
router.post('/', reportController.createReport);

// Delete report
router.delete('/:id', validateId, reportController.deleteReport);

// // Generate report
router.post('/generate', validateDateRange, reportController.generateReport);

// // Download report
router.get('/:id/download', validateId, reportController.downloadReport);

module.exports = router; 