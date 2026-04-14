import api from './api';

const paymentService = {
  // Get payment totals for members in a class
  getPaymentTotals: (classId) => {
    return api.get(`/member-payments/totals?class_id=${classId}`);
  },

  // Record a payment (adds to total)
  recordPayment: (paymentData) => {
    return api.post('/member-payments/record', paymentData);
  },

  // Get payment history for a member
  getPaymentHistory: (memberId) => {
    return api.get(`/member-payments/history/${memberId}`);
  },
};

export default paymentService;