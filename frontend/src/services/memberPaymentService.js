import api from './api';

const memberPaymentService = {
  // Record a weekly payment
  recordPayment: async (paymentData) => {
    const response = await api.post('/member-payments', paymentData);
    return response.data;
  },

  // Get payment history for a member
  getMemberPaymentHistory: async (memberId, quarterId = null) => {
    const params = quarterId ? { quarter_id: quarterId } : {};
    const response = await api.get(`/member-payments/member/${memberId}`, { params });
    return response.data;
  },

  // Get cumulative totals for a member
  getMemberTotals: async (memberId, quarterId = null) => {
    const params = quarterId ? { quarter_id: quarterId } : {};
    const response = await api.get(`/member-payments/member/${memberId}/totals`, { params });
    return response.data;
  },

  // Get all payments for a quarter
  getQuarterPayments: async (quarterId, weekNumber = null) => {
    const params = weekNumber ? { week_number: weekNumber } : {};
    const response = await api.get(`/member-payments/quarter/${quarterId}`, { params });
    return response.data;
  },

  // Get payment totals for all members in a class
  getClassPaymentTotals: async (classId, quarterId) => {
    const response = await api.get(`/member-payments/class/${classId}/totals`, {
      params: { quarter_id: quarterId }
    });
    return response.data;
  },

  // Delete a payment record
  deletePayment: async (paymentId) => {
    const response = await api.delete(`/member-payments/${paymentId}`);
    return response.data;
  },

  // Calculate week total based on payment selections
  calculateWeekTotal: (payment) => {
    let total = 0;
    
    // Regular lessons (3,000 each)
    total += parseFloat(payment.lesson_english || 0);
    total += parseFloat(payment.lesson_luganda || 0);
    
    // Adult lessons
    if (payment.adult_lesson_english_10k) total += 10000;
    if (payment.adult_lesson_english_20k) total += 20000;
    if (payment.adult_lesson_luganda_10k) total += 10000;
    if (payment.adult_lesson_luganda_20k) total += 20000;
    
    // Morning watch (3,000 each)
    total += parseFloat(payment.morning_watch_english || 0);
    total += parseFloat(payment.morning_watch_luganda || 0);
    
    return total;
  },

  // Format currency for display
  formatCurrency: (amount) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  }
};

export default memberPaymentService;