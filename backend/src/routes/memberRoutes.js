const express = require('express');
const router = express.Router();
const memberSearchController = require('../controllers/memberSearchController');
const authMiddleware = require('../middleware/authMiddleware');

// Search members
router.get('/search', authMiddleware, memberSearchController.searchMembers);

module.exports = router;