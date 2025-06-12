const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');
const { protect, authorize } = require('../middleware/auth');

// GET /smlekha/properties
router.get('/', protect, propertyController.getProperties);

// GET /smlekha/properties/:id
router.get('/:id', propertyController.getPropertyById);

// POST /smlekha/properties (protected route)
router.post('/', protect, propertyController.createProperty);

// PUT /smlekha/properties/:id (protected route)
router.put('/:id', protect, propertyController.updateProperty);

// DELETE /smlekha/properties/:id (protected route)
router.delete('/:id', protect, propertyController.deleteProperty);

module.exports = router;