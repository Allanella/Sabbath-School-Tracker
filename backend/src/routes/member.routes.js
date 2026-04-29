const express = require('express');
const router = express.Router();
const memberSearchController = require('../controllers/memberSearchController');
const authenticate = require('../middleware/auth');

// Search members
router.get('/search', authenticate, memberSearchController.searchMembers);

module.exports = router;
