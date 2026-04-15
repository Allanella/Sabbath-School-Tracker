import api from './api';

const paymentService = {
  // Record a payment for a member
  recordPayment: (paymentData) => {
    return api.post('/member-payments', paymentData);
  },

  // Get payment history for a member
  getMemberPaymentHistory: (memberId, quarterId = null) => {
    const params = quarterId ? { quarter_id: quarterId } : {};
    return api.get(`/member-payments/member/${memberId}`, { params });
  },

  // Get cumulative totals for a member
  getMemberTotals: (memberId, quarterId = null) => {
    const params = quarterId ? { quarter_id: quarterId } : {};
    return api.get(`/member-payments/member/${memberId}/totals`, { params });
  },

  // Get all payments for a quarter
  getQuarterPayments: (quarterId, weekNumber = null) => {
    const params = weekNumber ? { week_number: weekNumber } : {};
    return api.get(`/member-payments/quarter/${quarterId}`, { params });
  },

  // Get payment totals for all members in a class
  getClassPaymentTotals: (classId, quarterId) => {
    return api.get(`/member-payments/class/${classId}/totals`, {
      params: { quarter_id: quarterId }
    });
  },

  // Delete a payment record
  deletePayment: (paymentId) => {
    return api.delete(`/member-payments/${paymentId}`);
  },
};

export default paymentService;