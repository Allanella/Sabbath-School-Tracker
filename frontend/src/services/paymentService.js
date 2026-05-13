import api from './api';

const paymentService = {
  // Record a payment for a member
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
      params: { quarter_id: quarterId },
    });
    return response.data;
  },

  // Delete a payment record
  deletePayment: async (paymentId) => {
    const response = await api.delete(`/member-payments/${paymentId}`);
    return response.data;
  },
};

export default paymentService;