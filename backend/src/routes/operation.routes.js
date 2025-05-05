const express = require('express');
const router = express.Router();
const operationController = require('../controllers/operation.controller');
const { validateId } = require('../middleware/validation');

// Get all operations
router.get('/', operationController.getAllOperations);

// Get operation by ID
router.get('/:id', validateId, operationController.getOperationById);

// Create new operation
router.post('/', operationController.createOperation);

// Update operation
router.put('/:id', validateId, operationController.updateOperation);

// Delete operation
router.delete('/:id', validateId, operationController.deleteOperation);

// Get operations by type
router.get('/type/:type', operationController.getOperationsByType);

// Get operations summary
router.get('/summary', operationController.getOperationsSummary);

module.exports = router; 