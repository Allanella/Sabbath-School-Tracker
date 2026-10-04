const supabase = require('../config/database');

const quarterController = {
  // Create new quarter with optional member copying from a previous quarter
  create: async (req, res, next) => {
    try {
      const { name, year, start_date, end_date, copy_from_quarter_id } = req.body;

      if (!name || !year || !start_date || !end_date) {
        return res.status(400).json({
          success: false,
          message: 'name, year, start_date, and end_date are required fields.'
        });
      }

      // 1. Check for duplicates
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

      // 2. Insert new quarter
      const { data: newQuarter, error: createError } = await supabase
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

      if (createError) throw createError;

      let copiedCount = 0;

      // 3. Copy members via RPC or fallback if source quarter is provided
      if (copy_from_quarter_id) {
        const { data: count, error: copyError } = await supabase.rpc(
          'copy_quarter_members',
          {
            p_source_quarter_id: copy_from_quarter_id,
            p_target_quarter_id: newQuarter.id
          }
        );

        if (copyError) {
          console.error('Error copying members during creation:', copyError);
        } else {
          copiedCount = count || 0;
        }
      }

      return res.status(201).json({
        success: true,
        message: `Quarter created successfully.${
          copy_from_quarter_id ? ` Copied ${copiedCount} members.` : ''
        }`,
        data: {
          ...newQuarter,
          copied_members_count: copiedCount
        }
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

      // Deactivate currently active quarter
      const { error: deactivateError } = await supabase
        .from('quarters')
        .update({ is_active: false })
        .eq('is_active', true);

      if (deactivateError) throw deactivateError;

      // Activate target quarter
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

  // Copy classes and active members from a source quarter to a target quarter
  copyMembers: async (req, res, next) => {
    try {
      const { source_quarter_id, target_quarter_id } = req.body;

      console.log('Copying quarter data:', { source_quarter_id, target_quarter_id });

      if (!source_quarter_id || !target_quarter_id) {
        return res.status(400).json({
          success: false,
          message: 'source_quarter_id and target_quarter_id are required'
        });
      }

      // 1. Fetch classes from source quarter
      const { data: sourceClasses, error: classesError } = await supabase
        .from('classes')
        .select('*')
        .eq('quarter_id', source_quarter_id);

      if (classesError) {
        console.error('Error fetching source classes:', classesError);
        throw classesError;
      }

      let totalClassesCopied = 0;
      let totalMembersCopied = 0;

      // 2. Loop through classes and duplicate them into target quarter
      for (const sourceClass of sourceClasses || []) {
        const { data: newClass, error: newClassError } = await supabase
          .from('classes')
          .insert({
            quarter_id: target_quarter_id,
            class_name: sourceClass.class_name,
            teacher_name: sourceClass.teacher_name,
            secretary_name: sourceClass.secretary_name || '',
            secretary_id: sourceClass.secretary_id,
            church_name: sourceClass.church_name
          })
          .select()
          .single();

        if (newClassError) {
          console.error(`Error creating class ${sourceClass.class_name}:`, newClassError);
          continue;
        }

        totalClassesCopied++;

        // 3. Get active members from source class
        const { data: sourceMembers, error: membersError } = await supabase
          .from('class_members')
          .select('*')
          .eq('class_id', sourceClass.id)
          .eq('is_active', true);

        if (membersError) {
          console.error(`Error fetching members for class ${sourceClass.class_name}:`, membersError);
          continue;
        }

        // 4. Insert members into new class
        if (sourceMembers && sourceMembers.length > 0) {
          const membersToInsert = sourceMembers.map((member) => ({
            class_id: newClass.id,
            member_name: member.member_name,
            is_active: true
          }));

          const { data: newMembers, error: insertMembersError } = await supabase
            .from('class_members')
            .insert(membersToInsert)
            .select();

          if (insertMembersError) {
            console.error(`Error inserting members for ${newClass.class_name}:`, insertMembersError);
          } else if (newMembers) {
            totalMembersCopied += newMembers.length;
          }
        }
      }

      return res.json({
        success: true,
        message: 'Quarter data copied successfully',
        data: {
          classes_copied: totalClassesCopied,
          members_copied: totalMembersCopied
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = quarterController;