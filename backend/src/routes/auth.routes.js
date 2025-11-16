const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticate = require('../middleware/auth');
const { validationRules, validate } = require('../middleware/validation');

// Public routes
router.post('/register', validationRules.register, validate, authController.register);
router.post('/login', validationRules.login, validate, authController.login);

// Protected routes
router.get('/profile', authenticate, authController.getProfile);
router.post('/change-password', authenticate, authController.changePassword);

module.exports = router;