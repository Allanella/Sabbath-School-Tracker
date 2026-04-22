const supabase = require('../config/database');

// Record a payment for a member
const recordPayment = async (req, res) => {
  try {
    const paymentData = req.body;
    
    const { data, error } = await supabase
      .from('member_payment_history')
      .insert(paymentData)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data,
      message: 'Payment recorded successfully'
    });
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record payment',
      error: error.message
    });
  }
};

// Get payment history for a member
const getMemberPaymentHistory = async (req, res) => {
  try {
    const { memberId } = req.params;
    const { quarter_id } = req.query;

    let query = supabase
      .from('member_payment_history')
      .select(`
        *,
        class_members!inner(member_name, class_id),
        quarters(name, year)
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
      data: data || [],
      count: data?.length || 0
    });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment history',
      error: error.message
    });
  }
};

// Get cumulative totals for a member
const getMemberTotals = async (req, res) => {
  try {
    const { memberId } = req.params;
    const { quarter_id } = req.query;

    let query = supabase
      .from('member_payment_totals')
      .select('*')
      .eq('member_id', memberId);

    if (quarter_id) {
      query = query.eq('quarter_id', quarter_id);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: data || [],
      count: data?.length || 0
    });
  } catch (error) {
    console.error('Error fetching member totals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch member totals',
      error: error.message
    });
  }
};

// Get all payments for a quarter
const getQuarterPayments = async (req, res) => {
  try {
    const { quarterId } = req.params;
    const { week_number } = req.query;

    let query = supabase
      .from('member_payment_history')
      .select(`
        *,
        class_members!inner(member_name, class_id)
      `)
      .eq('quarter_id', quarterId)
      .order('week_number', { ascending: true });

    if (week_number) {
      query = query.eq('week_number', week_number);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: data || [],
      count: data?.length || 0
    });
  } catch (error) {
    console.error('Error fetching quarter payments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quarter payments',
      error: error.message
    });
  }
};

// Get payment totals for all members in a class
const getClassPaymentTotals = async (req, res) => {
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
      .select('*')
      .eq('class_id', classId);

    if (membersError) throw membersError;

    // Get payment totals for these members
    const memberIds = members.map(m => m.id);
    
    const { data: totals, error: totalsError } = await supabase
      .from('member_payment_totals')
      .select('*')
      .in('member_id', memberIds)
      .eq('quarter_id', quarter_id);

    if (totalsError) throw totalsError;

    // Map totals to members with correct field names
    const result = members.map(member => {
      const memberTotal = totals.find(t => t.member_id === member.id);
      return {
        ...member,
        totals: memberTotal ? {
          lesson_english: memberTotal.quarter_lesson_english_total || 0,
          lesson_luganda: memberTotal.quarter_lesson_luganda_total || 0,
          morning_watch_english: memberTotal.quarter_morning_watch_english_total || 0,
          morning_watch_luganda: memberTotal.quarter_morning_watch_luganda_total || 0,
          adult_lesson_english: memberTotal.quarter_adult_lesson_english_total || 0,
          adult_lesson_luganda: memberTotal.quarter_adult_lesson_luganda_total || 0,
          quarter_grand_total: memberTotal.quarter_grand_total || 0,
          year_grand_total: memberTotal.year_grand_total || 0,
          weeks_paid: memberTotal.weeks_paid || 0
        } : {
          lesson_english: 0,
          lesson_luganda: 0,
          morning_watch_english: 0,
          morning_watch_luganda: 0,
          adult_lesson_english: 0,
          adult_lesson_luganda: 0,
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
    console.error('Error fetching class payment totals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch class payment totals',
      error: error.message
    });
  }
};

// Delete a payment record
const deletePayment = async (req, res) => {
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
    console.error('Error deleting payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete payment',
      error: error.message
    });
  }
};

module.exports = {
  recordPayment,
  getMemberPaymentHistory,
  getMemberTotals,
  getQuarterPayments,
  getClassPaymentTotals,
  deletePayment
};