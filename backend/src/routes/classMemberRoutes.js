const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const authenticate = require('../middleware/auth');

// Search classes (MUST be before /:id routes)
router.get('/search', authenticate, classController.search);

// Get all classes (with optional quarter filter)
router.get('/', authenticate, classController.getAll);

// Get single class
router.get('/:id', authenticate, classController.getById);

// Get members for a specific class
router.get('/:id/members', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const supabase = require('../config/database');
    
    const { data, error } = await supabase
      .from('class_members')
      .select('*')
      .eq('class_id', id)
      .order('member_name');

    if (error) throw error;

    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Error fetching class members:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch class members',
      error: error.message
    });
  }
});

// Create new class
router.post('/', authenticate, classController.create);

// Update class
router.put('/:id', authenticate, classController.update);

// Delete class
router.delete('/:id', authenticate, classController.delete);

module.exports = router;