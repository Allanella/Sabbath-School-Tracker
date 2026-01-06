const supabase = require('../config/database');
const weeklyDataController = {
  // Submit weekly data
  create: async (req, res, next) => {
    try {
      const weeklyData = {
        ...req.body,
        submitted_by: req.user.userId
      };

      // Check if data already exists for this week
      const { data: existing } = await supabase
        .from('weekly_data')
        .select('id')
        .eq('class_id', weeklyData.class_id)
        .eq('week_number', weeklyData.week_number)
        .single();

      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Data for this week already submitted. Use update instead.'
        });
      }

      const { data, error } = await supabase
        .from('weekly_data')
        .insert([weeklyData])
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({
        success: true,
        message: 'Weekly data submitted successfully',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  // Get weekly data for a class
  getByClass: async (req, res, next) => {
    try {
      const { class_id } = req.params;

      const { data, error } = await supabase
        .from('weekly_data')
        .select(`
          *,
          submitted_by_user:users!weekly_data_submitted_by_fkey(full_name)
        `)
        .eq('class_id', class_id)
        .order('week_number');

      if (error) throw error;

      res.json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  },

  // Get specific week data
  getByWeek: async (req, res, next) => {
    try {
      const { class_id, week_number } = req.params;

      const { data, error } = await supabase
        .from('weekly_data')
        .select('*')
        .eq('class_id', class_id)
        .eq('week_number', week_number)
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

  // Update weekly data
  update: async (req, res, next) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const { data, error } = await supabase
        .from('weekly_data')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      res.json({
        success: true,
        message: 'Weekly data updated successfully',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete weekly data
  delete: async (req, res, next) => {
    try {
      const { id } = req.params;

      const { error } = await supabase
        .from('weekly_data')
        .delete()
        .eq('id', id);

      if (error) throw error;

      res.json({
        success: true,
        message: 'Weekly data deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = weeklyDataController;