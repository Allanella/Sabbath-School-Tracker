// routes/quarter.routes.js
const express = require('express');
const router = express.Router();
const quarterController = require('../controllers/quarterController');
const authenticate = require('../middleware/auth');
const checkRole = require('../middleware/roleCheck');

router.use(authenticate); // All routes require authentication

// GET /api/quarters
router.get('/', quarterController.getAll);

// GET /api/quarters/active
router.get('/active', quarterController.getActive);

// POST /api/quarters (handles quarter creation and optional member copy via copy_from_quarter_id)
router.post('/', checkRole('admin'), quarterController.create);

// POST /api/quarters/set-active
router.post('/set-active', checkRole('admin'), quarterController.setActive);

module.exports = router;