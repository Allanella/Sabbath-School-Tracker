const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authenticate = require('../middleware/auth');

router.use(authenticate);

router.get('/weekly', reportController.getWeeklyReport);
router.get('/class/:class_id/quarterly', reportController.getClassQuarterlyReport);
router.get('/church/:quarter_id/quarterly', reportController.getChurchQuarterlyReport);
router.get('/financial', reportController.getFinancialReport);

module.exports = router;