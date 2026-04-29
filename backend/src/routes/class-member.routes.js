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
      .eq('is_active', true)
      .order('member_name');

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
    console.error('Get class members error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch class members'
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

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Get class member error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch class member'
    });
  }
});

// Create new class member
router.post('/', authenticate, async (req, res) => {
  try {
    const { class_id, member_name } = req.body;

    const { data, error } = await supabase
      .from('class_members')
      .insert([{
        class_id,
        member_name,
        is_active: true
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Member added successfully',
      data
    });
  } catch (error) {
    console.error('Create class member error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add member'
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
      message: 'Member updated successfully',
      data
    });
  } catch (error) {
    console.error('Update class member error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update member'
    });
  }
});

// Delete class member (soft delete)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Soft delete - set is_active to false
    const { error } = await supabase
      .from('class_members')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Member removed successfully'
    });
  } catch (error) {
    console.error('Delete class member error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove member'
    });
  }
});

module.exports = router;