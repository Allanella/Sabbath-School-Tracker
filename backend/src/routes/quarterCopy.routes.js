const express = require('express');
const router = express.Router();
const quarterCopyController = require('../controllers/quarterCopyController');
const authenticate = require('../middleware/auth');

// Copy classes and members from one quarter to another
router.post('/copy', authenticate, quarterCopyController.copyQuarterData);

module.exports = router;