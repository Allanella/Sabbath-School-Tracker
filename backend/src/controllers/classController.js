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

  // Get all classes
  getAll: async (req, res, next) => {
    try {
      const { quarter_id } = req.query;

      let query = supabase
        .from('classes')
        .select(`
          *,
          quarter:quarters(name, year, start_date, end_date),
          secretary:users!classes_secretary_id_fkey(full_name, email)
        `);

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

  // Delete class
  delete: async (req, res, next) => {
    try {
      const { id } = req.params;

      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      res.json({
        success: true,
        message: 'Class deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = classController;