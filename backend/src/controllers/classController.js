const supabase = require('../config/database');

const classController = {
  // Create new class
  create: async (req, res, next) => {
    try {
      const { 
        quarter_id, 
        class_name, 
        teacher_name, 
        secretary_id, 
        secretary_name,
        church_name 
      } = req.body;

      // Check for duplicate class name in same quarter
      const { data: existing } = await supabase
        .from('classes')
        .select('id')
        .eq('quarter_id', quarter_id)
        .eq('class_name', class_name)
        .is('deleted_at', null)
        .single();

      if (existing) {
        return res.status(400).json({
          success: false,
          message: `Class "${class_name}" already exists in this quarter`
        });
      }

      const { data, error } = await supabase
        .from('classes')
        .insert([{ 
          quarter_id, 
          class_name, 
          teacher_name, 
          secretary_id, 
          secretary_name,
          church_name: church_name || 'Kanyanya Seventh-day Adventist Church'
        }])
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({
        success: true,
        message: 'Class created successfully',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  // Get all classes (excludes soft-deleted)
  getAll: async (req, res, next) => {
    try {
      const { quarter_id } = req.query;

      let query = supabase
        .from('classes')
        .select(`
          *,
          quarter:quarters(name, year, start_date, end_date),
          secretary:users!classes_secretary_id_fkey(full_name, email)
        `)
        .is('deleted_at', null);

      if (quarter_id) {
        query = query.eq('quarter_id', quarter_id);
      }

      const { data, error } = await query.order('class_name');

      if (error) throw error;

      res.json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  },

  // Get class by ID
  getById: async (req, res, next) => {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          quarter:quarters(*),
          secretary:users!classes_secretary_id_fkey(full_name, email)
        `)
        .eq('id', id)
        .is('deleted_at', null)
        .single();

      if (error) throw error;

      res.json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  },

  // Get classes for current user (secretary)
  getMyClasses: async (req, res, next) => {
    try {
      const userId = req.user.userId;

      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          quarter:quarters(*)
        `)
        .eq('secretary_id', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      res.json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  },

  // Search classes
  search: async (req, res, next) => {
    try {
      const { query } = req.query;

      if (!query || query.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
      }

      const searchTerm = query.trim();

      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          quarter:quarters(name, year, start_date, end_date),
          secretary:users!classes_secretary_id_fkey(full_name, email)
        `)
        .or(`class_name.ilike.%${searchTerm}%,teacher_name.ilike.%${searchTerm}%,secretary_name.ilike.%${searchTerm}%`)
        .eq('is_active', true)
        .is('deleted_at', null);

      if (error) throw error;

      res.json({
        success: true,
        data: data || []
      });
    } catch (error) {
      console.error('Search error:', error);
      next(error);
    }
  },

  // Update class
  update: async (req, res, next) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const { data, error } = await supabase
        .from('classes')
        .update(updates)
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
      next(error);
    }
  },

  // Soft delete class (marks as deleted, never removes data)
  delete: async (req, res, next) => {
    try {
      const { id } = req.params;

      // First check if class has any weekly data or payments
      const { data: weeklyData } = await supabase
        .from('weekly_data')
        .select('id')
        .eq('class_id', id)
        .limit(1);

      const { data: members } = await supabase
        .from('class_members')
        .select('id')
        .eq('class_id', id)
        .limit(1);

      // Warn if data exists but still allow soft delete
      const hasData = (weeklyData && weeklyData.length > 0) || (members && members.length > 0);

      // Soft delete — set deleted_at timestamp instead of removing
      const { data, error } = await supabase
        .from('classes')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      res.json({
        success: true,
        message: hasData 
          ? 'Class hidden successfully. Data preserved and can be restored.'
          : 'Class deleted successfully.',
        data,
        hasData
      });
    } catch (error) {
      next(error);
    }
  },

  // Restore a soft-deleted class
  restore: async (req, res, next) => {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('classes')
        .update({ deleted_at: null })
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
      next(error);
    }
  },

  // Get all soft-deleted classes (admin only)
  getDeleted: async (req, res, next) => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          quarter:quarters(name, year)
        `)
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });

      if (error) throw error;

      res.json({
        success: true,
        data: data || []
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = classController;