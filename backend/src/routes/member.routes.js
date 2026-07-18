const express = require('express');
const router = express.Router();
const memberSearchController = require('../controllers/memberSearchController');
const authenticate = require('../middleware/auth');

router.use(authenticate);

// Search members by name across all classes
router.get('/search', memberSearchController.searchMembers);

module.exports = router;