const express = require('express');
const router = express.Router();
const weeklyDataController = require('../controllers/weeklyDataController');
const authenticate = require('../middleware/auth');
const checkRole = require('../middleware/roleCheck');

router.use(authenticate);

router.post('/', checkRole('admin', 'secretary'), weeklyDataController.create);
router.get('/class/:class_id', weeklyDataController.getByClass);
router.get('/class/:class_id/week/:week_number', weeklyDataController.getByWeek);
router.put('/:id', checkRole('admin', 'secretary'), weeklyDataController.update);
router.delete('/:id', checkRole('admin'), weeklyDataController.delete);

module.exports = router;