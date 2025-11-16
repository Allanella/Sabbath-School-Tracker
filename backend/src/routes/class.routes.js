const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const authenticate = require('../middleware/auth');
const checkRole = require('../middleware/roleCheck');

router.use(authenticate);

router.post('/', checkRole('admin'), classController.create);
router.get('/', classController.getAll);
router.get('/my-classes', classController.getMyClasses);
router.get('/:id', classController.getById);
router.put('/:id', checkRole('admin'), classController.update);
router.delete('/:id', checkRole('admin'), classController.delete);

module.exports = router;