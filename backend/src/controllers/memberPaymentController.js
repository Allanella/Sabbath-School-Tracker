const getClassPaymentTotals = async (req, res) => {
  try {
    const { classId } = req.params;
    let { quarter_id, quarter_name } = req.query;

    // ✅ Resolve "Q2 2026" → actual UUID
    if (!quarter_id && quarter_name) {
      const parts = quarter_name.trim().split(' '); // ["Q2", "2026"]
      const name = parts[0];   // "Q2"
      const year = parts[1];   // "2026"

      const { data: quarter, error } = await supabase
        .from('quarters')
        .select('id')
        .eq('name', name)
        .eq('year', year)
        .single();

      if (error || !quarter) {
        return res.status(400).json({ 
          success: false, 
          message: `Quarter "${quarter_name}" not found` 
        });
      }

      quarter_id = quarter.id;
    }

    if (!quarter_id) {
      return res.status(400).json({
        success: false,
        message: 'quarter_id or quarter_name is required',
      });
    }

    // Fetch members in the class
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('id, name')
      .eq('class_id', classId);

    if (membersError) throw membersError;

    // Fetch payment totals for the specific quarter
    const { data: totals, error: totalsError } = await supabase
      .from('member_payment_totals')
      .select('*')
      .eq('quarter_id', quarter_id);

    if (totalsError) throw totalsError;

    // Map totals to members
    const result = members.map(member => {
      const memberTotal = totals.find(t => t.member_id === member.id) || {};
      return {
        ...member,
        lessons: memberTotal.lessons || 0,
        morning_watch: memberTotal.morning_watch || 0,
        offering: memberTotal.offering || 0,
        grand_total: memberTotal.grand_total || 0,
        weeks_paid: memberTotal.weeks_paid || 0
      };
    });

    return res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error in getClassPaymentTotals:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  getClassPaymentTotals,
   recordPayment,
  getMemberPaymentHistory,
  getMemberTotals,
  getQuarterPayments,
  deletePayment,
};