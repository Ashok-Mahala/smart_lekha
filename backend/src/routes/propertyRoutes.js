const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');

// GET /smlekha/properties
router.get('/', propertyController.getProperties);

// GET /smlekha/properties/:id
router.get('/:id', propertyController.getPropertyById);

// POST /smlekha/properties
router.post('/', propertyController.createProperty);

// PUT /smlekha/properties/:id
router.put('/:id', propertyController.updateProperty);

// DELETE /smlekha/properties/:id
router.delete('/:id', propertyController.deleteProperty);

module.exports = router; 