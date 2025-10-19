const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  saveLayout,
  getLayout
} = require('../controllers/layoutController');

// All routes are protected
router.use(protect);

router.post('/:propertyId', saveLayout);
router.get('/:propertyId', getLayout);

module.exports = router;