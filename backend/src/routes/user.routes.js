const express = require('express');
const router = express.Router();
const supabase = require('../config/database');
const authenticate = require('../middleware/auth');
const checkRole = require('../middleware/roleCheck');

router.use(authenticate);

// Get all users (admin only)
router.get('/', checkRole('admin'), async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, role, is_active, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// Get secretaries (for class assignment)
router.get('/secretaries', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, email')
      .eq('role', 'ss_secretary')  // Changed from 'secretary' to 'ss_secretary'
      .eq('is_active', true)
      .order('full_name');

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// Update user (admin only)
router.put('/:id', checkRole('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ 
      success: true, 
      message: 'User updated successfully',
      data 
    });
  } catch (error) {
    next(error);
  }
});

// Delete user (admin only) - NEW ENDPOINT
router.delete('/:id', checkRole('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user.userId;

    // Prevent self-deletion
    if (id === currentUserId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account',
      });
    }

    // Check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', id)
      .single();

    if (fetchError || !existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Delete user
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;