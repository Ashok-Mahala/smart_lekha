const express = require('express');
const router = express.Router();
const systemController = require('../controllers/systemController');
const { validateId } = require('../middleware/validation');

// Get system settings
router.get('/settings', systemController.getSystemSettings);

// Update system settings
router.put('/settings', systemController.updateSystemSettings);

// Get system logs
router.get('/logs', systemController.getSystemLogs);

// Get system status
router.get('/status', systemController.getSystemStatus);

// Backup system
// router.post('/backup', systemController.backupSystem);

// // Restore system
// router.post('/restore', systemController.restoreSystem);

module.exports = router; 