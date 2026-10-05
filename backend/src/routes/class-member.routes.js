const supabase = require('../config/database');

// Get all classes
exports.getAll = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .order('id', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Get all classes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch classes',
      error: error.message
    });
  }
};

// Get single class by ID
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Get class by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch class',
      error: error.message
    });
  }
};

// Search classes
exports.search = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query parameter "q" is required'
      });
    }

    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .ilike('class_name', `%${q}%`);

    if (error) throw error;

    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Search classes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search classes',
      error: error.message
    });
  }
};

// Get deleted classes
exports.getDeleted = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('is_active', false);

    if (error) throw error;

    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Get deleted classes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch deleted classes',
      error: error.message
    });
  }
};

// Create new class
exports.create = async (req, res) => {
  try {
    const { class_name, name } = req.body;
    const title = class_name || name;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Class name is required'
      });
    }

    const { data, error } = await supabase
      .from('classes')
      .insert([{ class_name: title, is_active: true }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Class created successfully',
      data
    });
  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create class',
      error: error.message
    });
  }
};

// Update class
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { class_name, name } = req.body;
    const title = class_name || name;

    const { data, error } = await supabase
      .from('classes')
      .update({ class_name: title })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Class updated successfully',
      data
    });
  } catch (error) {
    console.error('Update class error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update class',
      error: error.message
    });
  }
};

// Restore class
exports.restore = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('classes')
      .update({ is_active: true })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Class restored successfully',
      data
    });
  } catch (error) {
    console.error('Restore class error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to restore class',
      error: error.message
    });
  }
};

// Delete class (Soft delete)
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('classes')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Class deleted successfully'
    });
  } catch (error) {
    console.error('Delete class error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete class',
      error: error.message
    });
  }
};