const express = require('express');
const router = express.Router();
const supabase = require('../config/database');
const authenticate = require('../middleware/auth');
const checkRole = require('../middleware/roleCheck');

router.use(authenticate);

// Get all members with optional class filter via query parameter
router.get('/', async (req, res) => {
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

    res.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch members',
      error: error.message
    });
  }
});

// Get all members for a class (alternative route)
router.get('/class/:class_id', async (req, res) => {
  try {
    const { class_id } = req.params;

    const { data, error } = await supabase
      .from('class_members')
      .select('*')
      .eq('class_id', class_id)
      .order('member_name');

    if (error) throw error;

    res.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch members',
      error: error.message
    });
  }
});

// Get single member
router.get('/:id', async (req, res) => {
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
        message: 'Member not found'
      });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Get member error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch member',
      error: error.message
    });
  }
});

// Create new member
router.post('/', checkRole('admin', 'ss_secretary'), async (req, res) => {
  try {
    const { class_id, member_name } = req.body;

    console.log('Creating member:', { class_id, member_name });

    const { data, error } = await supabase
      .from('class_members')
      .insert([{ class_id, member_name }])
      .select()
      .single();

    if (error) {
      console.error('Insert member error:', error);
      throw error;
    }

    res.status(201).json({
      success: true,
      message: 'Member added successfully',
      data,
    });
  } catch (error) {
    console.error('Create member error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create member',
      error: error.message
    });
  }
});

// Update member
router.put('/:id', checkRole('admin', 'ss_secretary'), async (req, res) => {
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
      data,
    });
  } catch (error) {
    console.error('Update member error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update member',
      error: error.message
    });
  }
});

// Delete member (soft delete)
router.delete('/:id', checkRole('admin', 'ss_secretary'), async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('class_members')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Member removed successfully',
    });
  } catch (error) {
    console.error('Delete member error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete member',
      error: error.message
    });
  }
});

module.exports = router;