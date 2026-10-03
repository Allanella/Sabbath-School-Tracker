// controllers/quarterController.js
const supabase = require('../config/database');

const quarterController = {
  // Create new quarter
  create: async (req, res, next) => {
    try {
      const { name, year, start_date, end_date } = req.body;

      if (!name || !year || !start_date || !end_date) {
        return res.status(400).json({
          success: false,
          message: 'name, year, start_date, and end_date are required fields.'
        });
      }

      // Prevent duplicates for the same name and year
      const { data: existing } = await supabase
        .from('quarters')
        .select('id')
        .eq('name', name)
        .eq('year', parseInt(year, 10))
        .maybeSingle();

      if (existing) {
        return res.status(409).json({
          success: false,
          message: `Quarter ${name} for year ${year} already exists.`
        });
      }

      const { data, error } = await supabase
        .from('quarters')
        .insert([
          {
            name,
            year: parseInt(year, 10),
            start_date,
            end_date,
            is_active: false
          }
        ])
        .select()
        .single();

      if (error) throw error;

      return res.status(201).json({
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

      return res.json({
        success: true,
        data: data || []
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
        .maybeSingle();

      if (error) throw error;

      return res.json({
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
      const { quarter_id } = req.body;

      if (!quarter_id) {
        return res.status(400).json({
          success: false,
          message: 'quarter_id is required'
        });
      }

      // Deactivate all quarters currently active
      const { error: deactivateError } = await supabase
        .from('quarters')
        .update({ is_active: false })
        .eq('is_active', true);

      if (deactivateError) throw deactivateError;

      // Activate selected quarter
      const { data, error } = await supabase
        .from('quarters')
        .update({ is_active: true })
        .eq('id', quarter_id)
        .select()
        .single();

      if (error) throw error;

      return res.json({
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

      // Check if quarter is active before deleting
      const { data: targetQuarter, error: fetchError } = await supabase
        .from('quarters')
        .select('is_active')
        .eq('id', id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      if (!targetQuarter) {
        return res.status(404).json({
          success: false,
          message: 'Quarter not found'
        });
      }

      if (targetQuarter.is_active) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete an active quarter. Set another quarter active first.'
        });
      }

      const { error } = await supabase
        .from('quarters')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return res.json({
        success: true,
        message: 'Quarter deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = quarterController;