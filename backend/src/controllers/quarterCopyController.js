const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const supabase = require('../config/database');

// Get all class members (with optional class filter)
router.get('/', authenticate, async (req, res) => {
  try {
    const { class_id } = req.query;

    let query = supabase
      .from('class_members')
      .select('*')
      .order('member_name');

    // Filter by class_id if provided
    if (class_id) {
      query = query.eq('class_id', class_id);
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

// Get single class member
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('class_members')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Class member not found'
      });
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching class member:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch class member',
      error: error.message
    });
  }
});

// Create new class member
router.post('/', authenticate, async (req, res) => {
  try {
    const { class_id, member_name } = req.body;

    if (!class_id || !member_name) {
      return res.status(400).json({
        success: false,
        message: 'class_id and member_name are required'
      });
    }

    const { data, error } = await supabase
      .from('class_members')
      .insert({
        class_id,
        member_name
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error creating class member:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create class member',
      error: error.message
    });
  }
});

// Update class member
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { member_name } = req.body;

    const { data, error } = await supabase
      .from('class_members')
      .update({ member_name })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error updating class member:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update class member',
      error: error.message
    });
  }
});

// Delete class member
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('class_members')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Class member deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting class member:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete class member',
      error: error.message
    });
  }
});

module.exports = router;