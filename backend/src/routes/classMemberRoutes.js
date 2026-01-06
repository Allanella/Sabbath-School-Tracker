const express = require('express');
const router = express.Router();
const supabase = require('../config/database');
const authenticate = require('../middleware/auth');
const checkRole = require('../middleware/roleCheck');

router.use(authenticate);

// Get all members for a class
router.get('/class/:class_id', async (req, res, next) => {
  try {
    const { class_id } = req.params;

    const { data, error } = await supabase
      .from('class_members')
      .select('*')
      .eq('class_id', class_id)
      .eq('is_active', true)
      .order('member_name');

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Get members error:', error);
    next(error);
  }
});

// Create new member
router.post('/', checkRole('admin', 'ss_secretary'), async (req, res, next) => {
  try {
    const { class_id, member_name } = req.body;

    console.log('Creating member:', { class_id, member_name }); // Debug

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
    next(error);
  }
});

// Update member
router.put('/:id', checkRole('admin', 'ss_secretary'), async (req, res, next) => {
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
    next(error);
  }
});

// Delete member (soft delete)
router.delete('/:id', checkRole('admin', 'ss_secretary'), async (req, res, next) => {
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
    next(error);
  }
});

module.exports = router;