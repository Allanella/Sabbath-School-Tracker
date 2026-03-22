const express = require('express');
const router = express.Router();
const memberPaymentController = require('../controllers/memberPaymentController');
const authenticate = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Record a payment
router.post('/', memberPaymentController.recordPayment);

// Get payment history for a specific member
router.get('/member/:memberId', memberPaymentController.getMemberPaymentHistory);

// Get cumulative totals for a specific member
router.get('/member/:memberId/totals', memberPaymentController.getMemberTotals);

// Get all payments for a quarter
router.get('/quarter/:quarterId', memberPaymentController.getQuarterPayments);

// Get payment totals for all members in a class
router.get('/class/:classId/totals', memberPaymentController.getClassPaymentTotals);

// Delete a payment record
router.delete('/:paymentId', memberPaymentController.deletePayment);

module.exports = router;