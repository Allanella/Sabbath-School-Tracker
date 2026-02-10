const supabase = require('../config/database');

const classMemberController = {
  // Get all members for a class
  getByClass: async (req, res, next) => {
    try {
      const { class_id } = req.params;

      const { data, error } = await supabase
        .from('class_members')
        .select('*')
        .eq('class_id', class_id)
        .order('member_name');

      if (error) throw error;

      res.json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  },

  // Add a member to a class
  create: async (req, res, next) => {
    try {
      const { class_id, member_name } = req.body;

      // Check if member already exists in this class (case-insensitive)
      const { data: existing, error: checkError } = await supabase
        .from('class_members')
        .select('id')
        .eq('class_id', class_id)
        .ilike('member_name', member_name)
        .maybeSingle();

      if (existing) {
        return res.status(400).json({
          success: false,
          message: `"${member_name}" is already a member of this class`
        });
      }

      // If no existing member found, create new one
      const { data, error } = await supabase
        .from('class_members')
        .insert([{ class_id, member_name }])
        .select()
        .single();

      if (error) {
        // Handle unique constraint violation
        if (error.code === '23505') {
          return res.status(400).json({
            success: false,
            message: `"${member_name}" is already a member of this class`
          });
        }
        throw error;
      }

      res.status(201).json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  },

  // Update member
  update: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { member_name } = req.body;

      const { data, error } = await supabase
        .from('class_members')
        .update({ member_name })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        // Handle unique constraint violation
        if (error.code === '23505') {
          return res.status(400).json({
            success: false,
            message: `"${member_name}" is already a member of this class`
          });
        }
        throw error;
      }

      res.json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete member
  delete: async (req, res, next) => {
    try {
      const { id } = req.params;

      const { error } = await supabase
        .from('class_members')
        .delete()
        .eq('id', id);

      if (error) throw error;

      res.json({
        success: true,
        message: 'Member removed successfully'
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = classMemberController;
