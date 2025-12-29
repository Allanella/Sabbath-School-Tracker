const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const authenticate = require('../middleware/auth');
const { validationRules, validate } = require('../middleware/validation');

// Public
router.post('/register', validationRules.register, validate, authController.register);
router.post('/login', validationRules.login, validate, authController.login);
router.post('/logout', authController.logout);

// Protected
router.get('/profile', authenticate, authController.getProfile);
router.post('/change-password', authenticate, authController.changePassword);

module.exports = router;
