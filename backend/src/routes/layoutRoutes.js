const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { validateId, validateDateRange } = require('../middleware/validation');
const { saveLayout, getLayout } = require ('../controllers/layoutController');

// Save/update layout
router.post('/:propertyId', saveLayout);

// Get layout by property
router.get('/:propertyId', getLayout);

module.exports = router;