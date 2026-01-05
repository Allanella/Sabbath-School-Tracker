const express = require('express');
const router = express.Router();
const weeklyDataController = require('../controllers/weeklyDataController');
const authenticate = require('../middleware/auth');
const checkRole = require('../middleware/roleCheck');

router.use(authenticate);

// Create weekly data - admin and ss_secretary can create
router.post('/', checkRole('admin', 'ss_secretary'), weeklyDataController.create);

// Get weekly data by class - everyone can view
router.get('/class/:class_id', weeklyDataController.getByClass);

// Get weekly data by specific week - everyone can view
router.get('/class/:class_id/week/:week_number', weeklyDataController.getByWeek);

// Update weekly data - admin and ss_secretary can update
router.put('/:id', checkRole('admin', 'ss_secretary'), weeklyDataController.update);

// Delete weekly data - admin and ss_secretary can delete
router.delete('/:id', checkRole('admin', 'ss_secretary'), weeklyDataController.delete);

module.exports = router;