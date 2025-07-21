const express = require('express');
const router = express.Router();
const securityController = require('../controllers/securityController');

// Log a security event
router.post('/log', securityController.logEvent);

// Get all security logs
router.get('/', securityController.getAllLogs);

// Get log by ID
router.get('/:id', securityController.getLogById);

// Delete a log entry
router.delete('/:id', securityController.deleteLog);

module.exports = router;
