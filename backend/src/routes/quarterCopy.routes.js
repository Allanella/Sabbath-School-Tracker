const express = require('express');
const router = express.Router();
const { copyQuarterData } = require('../controllers/quarterCopyController');
const authenticate = require('../middleware/auth');

// Copy classes and members from one quarter to another
router.post('/copy', authenticate, copyQuarterData);

module.exports = router;