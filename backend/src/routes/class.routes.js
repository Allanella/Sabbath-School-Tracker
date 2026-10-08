const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const authenticate = require('../middleware/auth');
const supabase = require('../config/database');

// Search classes (MUST be before /:id routes)
router.get('/search', authenticate, classController.search);

// Get all soft-deleted classes (admin recovery)
router.get('/deleted', authenticate, classController.getDeleted);

// Get all classes
router.get('/', authenticate, classController.getAll);

// Get single class
router.get('/:id', authenticate, classController.getById);

// Get members for a specific class
router.get('/:id/members', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { quarter_id } = req.query;

    // Guard against literal un-evaluated template strings or missing IDs
    if (!id || id === '${classId}' || id.includes('${')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing class ID parameter'
      });
    }

    // Join with the classes relation so quarter_id filtering works properly
    let query = supabase
      .from('class_members')
      .select('*, classes!inner(id, class_name, quarter_id)')
      .eq('class_id', id)
      .eq('is_active', true)
      .order('member_name');

    // Filter via the joined classes table since quarter_id does not exist on class_members
    if (quarter_id) {
      query = query.eq('classes.quarter_id', quarter_id);
    }

    const { data, error } = await query;

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

// Restore a soft-deleted class
router.put('/:id/restore', authenticate, classController.restore);

// Soft delete class
router.delete('/:id', authenticate, classController.delete);

module.exports = router;