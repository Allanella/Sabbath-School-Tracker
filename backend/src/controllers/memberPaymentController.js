const supabase = require('../config/database');

const memberPaymentController = {
  // Record a weekly payment
  recordPayment: async (req, res) => {
    try {
      const {
        member_id,
        quarter_id,
        week_number,
        payment_date,
        lesson_english,
        lesson_luganda,
        adult_lesson_english_10k,
        adult_lesson_english_20k,
        adult_lesson_luganda_10k,
        adult_lesson_luganda_20k,
        morning_watch_english,
        morning_watch_luganda,
        notes
      } = req.body;

      console.log('Recording payment:', req.body);

      // Validate required fields
      if (!member_id || !quarter_id || !week_number) {
        return res.status(400).json({
          success: false,
          message: 'member_id, quarter_id, and week_number are required'
        });
      }

      // Insert or update payment record
      const { data, error } = await supabase
        .from('member_payment_history')
        .upsert({
          member_id,
          quarter_id,
          week_number,
          payment_date: payment_date || new Date().toISOString().split('T')[0],
          lesson_english: lesson_english || 0,
          lesson_luganda: lesson_luganda || 0,
          adult_lesson_english_10k: adult_lesson_english_10k || false,
          adult_lesson_english_20k: adult_lesson_english_20k || false,
          adult_lesson_luganda_10k: adult_lesson_luganda_10k || false,
          adult_lesson_luganda_20k: adult_lesson_luganda_20k || false,
          morning_watch_english: morning_watch_english || 0,
          morning_watch_luganda: morning_watch_luganda || 0,
          notes,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'member_id,quarter_id,week_number'
        })
        .select()
        .single();

      if (error) {
        console.error('Payment record error:', error);
        throw error;
      }

      console.log('Payment recorded:', data);

      res.json({
        success: true,
        message: 'Payment recorded successfully',
        data
      });
    } catch (error) {
      console.error('Record payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to record payment',
        error: error.message
      });
    }
  },

  // Get payment history for a member
  getMemberPaymentHistory: async (req, res) => {
    try {
      const { memberId } = req.params;
      const { quarter_id } = req.query;

      let query = supabase
        .from('member_payment_history')
        .select(`
          *,
          class_members!inner (
            id,
            member_name
          ),
          quarters!inner (
            id,
            name,
            year
          )
        `)
        .eq('member_id', memberId)
        .order('payment_date', { ascending: false });

      if (quarter_id) {
        query = query.eq('quarter_id', quarter_id);
      }

      const { data, error } = await query;

      if (error) throw error;

      res.json({
        success: true,
        data,
        count: data.length
      });
    } catch (error) {
      console.error('Get payment history error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payment history',
        error: error.message
      });
    }
  },

  // Get cumulative totals for a member
  getMemberTotals: async (req, res) => {
    try {
      const { memberId } = req.params;
      const { quarter_id } = req.query;

      let query = supabase
        .from('member_payment_totals')
        .select(`
          *,
          class_members!inner (
            id,
            member_name
          ),
          quarters!inner (
            id,
            name,
            year
          )
        `)
        .eq('member_id', memberId);

      if (quarter_id) {
        query = query.eq('quarter_id', quarter_id);
      }

      const { data, error } = await query;

      if (error) throw error;

      res.json({
        success: true,
        data: data.length > 0 ? data[0] : null
      });
    } catch (error) {
      console.error('Get member totals error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch member totals',
        error: error.message
      });
    }
  },

  // Get all payments for a quarter
  getQuarterPayments: async (req, res) => {
    try {
      const { quarterId } = req.params;
      const { week_number } = req.query;

      let query = supabase
        .from('member_payment_history')
        .select(`
          *,
          class_members!inner (
            id,
            member_name,
            classes!inner (
              id,
              class_name,
              teacher_name
            )
          )
        `)
        .eq('quarter_id', quarterId)
        .order('payment_date', { ascending: false });

      if (week_number) {
        query = query.eq('week_number', week_number);
      }

      const { data, error } = await query;

      if (error) throw error;

      res.json({
        success: true,
        data,
        count: data.length
      });
    } catch (error) {
      console.error('Get quarter payments error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch quarter payments',
        error: error.message
      });
    }
  },

  // Get payment totals for all members in a class
  getClassPaymentTotals: async (req, res) => {
    try {
      const { classId } = req.params;
      const { quarter_id } = req.query;

      if (!quarter_id) {
        return res.status(400).json({
          success: false,
          message: 'quarter_id is required'
        });
      }

      // Get all members in the class
      const { data: members, error: membersError } = await supabase
        .from('class_members')
        .select('id, member_name')
        .eq('class_id', classId);

      if (membersError) throw membersError;

      // Get payment totals for each member
      const memberIds = members.map(m => m.id);

      const { data: totals, error: totalsError } = await supabase
        .from('member_payment_totals')
        .select('*')
        .in('member_id', memberIds)
        .eq('quarter_id', quarter_id);

      if (totalsError) throw totalsError;

      // Combine member info with their totals
      const result = members.map(member => {
        const memberTotal = totals.find(t => t.member_id === member.id);
        return {
          ...member,
          totals: memberTotal || {
            quarter_grand_total: 0,
            year_grand_total: 0,
            weeks_paid: 0
          }
        };
      });

      res.json({
        success: true,
        data: result,
        count: result.length
      });
    } catch (error) {
      console.error('Get class payment totals error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch class payment totals',
        error: error.message
      });
    }
  },

  // Delete a payment record
  deletePayment: async (req, res) => {
    try {
      const { paymentId } = req.params;

      const { error } = await supabase
        .from('member_payment_history')
        .delete()
        .eq('id', paymentId);

      if (error) throw error;

      res.json({
        success: true,
        message: 'Payment deleted successfully'
      });
    } catch (error) {
      console.error('Delete payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete payment',
        error: error.message
      });
    }
  }
};

module.exports = memberPaymentController;