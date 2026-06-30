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
      console.error('Error in getByClass:', error);
      next(error);
    }
  },

  // Add a member to a class
  create: async (req, res, next) => {
    try {
      const { class_id, member_name } = req.body;

      // Get the quarter_id of the target class so we only check duplicates within the same quarter
      const { data: targetClass, error: classError } = await supabase
        .from('classes')
        .select('quarter_id')
        .eq('id', class_id)
        .single();

      if (classError) {
        console.error('Error fetching target class:', classError);
        throw classError;
      }

      // Check if member already exists in ANY class WITHIN THE SAME QUARTER (case-insensitive)
      const { data: existingMembers, error: checkError } = await supabase
        .from('class_members')
        .select(`
          id,
          class_id,
          member_name,
          is_active,
          class:classes!inner (
            class_name,
            teacher_name,
            quarter_id
          )
        `)
        .ilike('member_name', member_name)
        .eq('class.quarter_id', targetClass.quarter_id)
        .eq('is_active', true);

      if (checkError) {
        console.error('Error checking existing member:', checkError);
      }

      const existing = existingMembers && existingMembers.length > 0 ? existingMembers[0] : null;

      if (existing) {
        const className = existing.class?.class_name || 'Unknown Class';
        const teacherName = existing.class?.teacher_name || '';

        const errorMsg = teacherName
          ? `"${member_name}" is already a member of ${className} (Teacher: ${teacherName}) this quarter`
          : `"${member_name}" is already a member of ${className} this quarter`;

        return res.status(400).json({
          success: false,
          message: errorMsg
        });
      }

      // If no existing member found in this quarter, create new one
      const { data, error } = await supabase
        .from('class_members')
        .insert([{ class_id, member_name }])
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);

        if (error.code === '23505') {
          return res.status(400).json({
            success: false,
            message: `"${member_name}" already exists in this class`
          });
        }
        throw error;
      }

      res.status(201).json({
        success: true,
        data
      });
    } catch (error) {
      console.error('Unhandled error in create:', error);
      next(error);
    }
  },

  // Update member
  update: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { member_name } = req.body;

      // Get the current member's class and quarter
      const { data: currentMember, error: currentError } = await supabase
        .from('class_members')
        .select(`
          class_id,
          class:classes!inner (quarter_id)
        `)
        .eq('id', id)
        .single();

      if (currentError) {
        console.error('Error fetching current member:', currentError);
        throw currentError;
      }

      const quarterId = currentMember.class?.quarter_id;

      // Check if new name already exists for a different member WITHIN THE SAME QUARTER
      const { data: existingMembers, error: checkError } = await supabase
        .from('class_members')
        .select(`
          id,
          member_name,
          class:classes!inner (
            class_name,
            teacher_name,
            quarter_id
          )
        `)
        .ilike('member_name', member_name)
        .eq('class.quarter_id', quarterId)
        .eq('is_active', true)
        .neq('id', id);

      const existing = existingMembers && existingMembers.length > 0 ? existingMembers[0] : null;

      if (existing) {
        const className = existing.class?.class_name || 'another class';
        const teacherName = existing.class?.teacher_name || '';

        const errorMsg = teacherName
          ? `"${member_name}" is already a member of ${className} (Teacher: ${teacherName}) this quarter`
          : `"${member_name}" is already a member of ${className} this quarter`;

        return res.status(400).json({
          success: false,
          message: errorMsg
        });
      }

      const { data, error } = await supabase
        .from('class_members')
        .update({ member_name })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase update error:', error);

        if (error.code === '23505') {
          return res.status(400).json({
            success: false,
            message: `"${member_name}" already exists in this class`
          });
        }
        throw error;
      }

      res.json({
        success: true,
        data
      });
    } catch (error) {
      console.error('Unhandled error in update:', error);
      next(error);
    }
  },

  // Delete member (soft delete - sets is_active to false, preserves payment history)
  delete: async (req, res, next) => {
    try {
      const { id } = req.params;

      console.log('=== DELETE MEMBER REQUEST ===');
      console.log('Member ID:', id);

      // Check if member has any payment history before deleting
      const { data: paymentHistory } = await supabase
        .from('member_payment_history')
        .select('id')
        .eq('member_id', id)
        .limit(1);

      const hasPayments = paymentHistory && paymentHistory.length > 0;

      // Soft delete - set is_active to false instead of removing the row
      // This preserves all payment history and weekly data references
      const { data, error } = await supabase
        .from('class_members')
        .update({ is_active: false })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Delete error:', error);
        throw error;
      }

      console.log('Member soft-deleted successfully');

      res.json({
        success: true,
        message: hasPayments
          ? 'Member removed from class. Payment history preserved.'
          : 'Member removed successfully',
        data,
        hadPayments: hasPayments
      });
    } catch (error) {
      console.error('Unhandled error in delete:', error);
      next(error);
    }
  },

  // Restore a soft-deleted member
  restore: async (req, res, next) => {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('class_members')
        .update({ is_active: true })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      res.json({
        success: true,
        message: 'Member restored successfully',
        data
      });
    } catch (error) {
      console.error('Unhandled error in restore:', error);
      next(error);
    }
  }
};

module.exports = classMemberController;