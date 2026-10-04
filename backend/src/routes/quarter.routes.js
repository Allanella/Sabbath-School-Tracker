// src/routes/quarter.routes.js
const express = require('express');
const router = express.Router();
const quarterController = require('../controllers/quarterController');
const authenticate = require('../middleware/auth');
const checkRole = require('../middleware/roleCheck');

router.use(authenticate);

// Explicit router definitions matching /api/quarters
router.get('/', quarterController.getAll);
router.get('/active', quarterController.getActive);
router.post('/', checkRole('admin'), quarterController.create);
router.post('/set-active', checkRole('admin'), quarterController.setActive);

module.exports = router;