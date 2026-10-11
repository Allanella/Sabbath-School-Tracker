const express = require('express');
const router = express.Router();
const supabase = require('../config/database');
const authenticate = require('../middleware/auth');
const checkRole = require('../middleware/roleCheck');

router.use(authenticate);

// Get members by class
router.get('/class/:class_id', async (req, res) => {
  try {
    const { class_id } = req.params;
    const { quarter_id } = req.query;

    let query = supabase
      .from('class_members')
      .select('*')
      .eq('class_id', class_id)
      .order('member_name');

    if (quarter_id) query = query.eq('quarter_id', quarter_id);

    const { data, error } = await query;
    if (error) throw error;

    res.json({ success: true, data: data || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add a member to a class
router.post('/', checkRole('admin', 'ss_secretary'), async (req, res) => {
  try {
    const { class_id, quarter_id, member_name } = req.body;

    if (!class_id || !member_name) {
      return res.status(400).json({ success: false, message: 'class_id and member_name are required' });
    }

    const { data, error } = await supabase
      .from('class_members')
      .insert([{ class_id, quarter_id, member_name }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, message: 'Member added successfully', data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update a member
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

    res.json({ success: true, message: 'Member updated successfully', data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete a member
router.delete('/:id', checkRole('admin', 'ss_secretary'), async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('class_members')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true, message: 'Member deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;