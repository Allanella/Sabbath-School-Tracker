const express = require('express');
const router = express.Router();
const quarterController = require('../controllers/quarterController');
const quarterCopyController = require('../controllers/quarterCopyController');
const authenticate = require('../middleware/auth');
const checkRole = require('../middleware/roleCheck');

router.use(authenticate); // All routes require authentication

router.post('/', checkRole('admin'), quarterController.create);
router.get('/', quarterController.getAll);
router.get('/active', quarterController.getActive);
router.patch('/:id/set-active', checkRole('admin'), quarterController.setActive);

// Copy classes and members from one quarter to another
router.post('/copy', checkRole('admin'), quarterCopyController.copyQuarterData);

router.delete('/:id', checkRole('admin'), quarterController.delete);

module.exports = router;