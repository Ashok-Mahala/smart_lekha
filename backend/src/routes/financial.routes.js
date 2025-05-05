const express = require('express');
const router = express.Router();
const financialController = require('../controllers/financial.controller');
const { validateId, validateDateRange } = require('../middleware/validation');

// Get all financial records
router.get('/', validateDateRange, financialController.getAllFinancialRecords);

// Get financial record by ID
router.get('/:id', validateId, financialController.getFinancialRecordById);

// Create new financial record
router.post('/', financialController.createFinancialRecord);

// Update financial record
router.put('/:id', validateId, financialController.updateFinancialRecord);

// Delete financial record
router.delete('/:id', validateId, financialController.deleteFinancialRecord);

// Get financial summary
router.get('/summary', validateDateRange, financialController.getFinancialSummary);

module.exports = router; 