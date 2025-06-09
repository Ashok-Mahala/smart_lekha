const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { validateDateRange, validateId } = require('../middleware/validation');

// Get all reports
router.get('/', validateDateRange, reportController.getAllReports);

// Get report by ID
router.get('/:id', validateId, reportController.getReportById);

// Create new report
router.post('/', reportController.createReport);

// Delete report
router.delete('/:id', validateId, reportController.deleteReport);

// Generate report
router.post('/generate', validateDateRange, reportController.generateReport);

// Download report
router.get('/:id/download', validateId, reportController.downloadReport);

module.exports = router; 