const supabase = require('../config/database');

const quarterController = {
  // Create new quarter
  create: async (req, res, next) => {
    try {
      const { name, year, start_date, end_date } = req.body;

      const { data, error } = await supabase
        .from('quarters')
        .insert([{ name, year, start_date, end_date }])
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({
        success: true,
        message: 'Quarter created successfully',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  // Get all quarters
  getAll: async (req, res, next) => {
    try {
      const { data, error } = await supabase
        .from('quarters')
        .select('*')
        .order('year', { ascending: false })
        .order('name', { ascending: false });

      if (error) throw error;

      res.json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  },

  // Get active quarter
  getActive: async (req, res, next) => {
    try {
      const { data, error } = await supabase
        .from('quarters')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      res.json({
        success: true,
        data: data || null
      });
    } catch (error) {
      next(error);
    }
  },

  // Set active quarter
  setActive: async (req, res, next) => {
    try {
      const { id } = req.params;

      // Deactivate all quarters
      await supabase
        .from('quarters')
        .update({ is_active: false })
        .neq('id', '00000000-0000-0000-0000-000000000000');

      // Activate selected quarter
      const { data, error } = await supabase
        .from('quarters')
        .update({ is_active: true })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      res.json({
        success: true,
        message: 'Active quarter updated',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete quarter
  delete: async (req, res, next) => {
    try {
      const { id } = req.params;

      const { error } = await supabase
        .from('quarters')
        .delete()
        .eq('id', id);

      if (error) throw error;

      res.json({
        success: true,
        message: 'Quarter deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = quarterController;