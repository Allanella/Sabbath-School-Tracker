import React, { useState, useEffect } from 'react';
import { DollarSign, Calendar, TrendingUp, Download, Search, Filter } from 'lucide-react';
import memberPaymentService from '../../services/memberPaymentService';

const PaymentHistory = () => {
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [memberTotals, setMemberTotals] = useState(null);
  const [quarters, setQuarters] = useState([]);
  const [selectedQuarter, setSelectedQuarter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadQuarters();
    loadAllMembers();
  }, []);

  useEffect(() => {
    if (selectedMember) {
      loadMemberData();
    }
  }, [selectedMember, selectedQuarter]);

  const loadQuarters = async () => {
    try {
      const response = await fetch('/api/quarters');
      const data = await response.json();
      setQuarters(data.data || []);
    } catch (error) {
      console.error('Failed to load quarters:', error);
    }
  };

  const loadAllMembers = async () => {
    try {
      const response = await fetch('/api/class-members');
      const data = await response.json();
      setMembers(data.data || []);
    } catch (error) {
      console.error('Failed to load members:', error);
    }
  };

  const loadMemberData = async () => {
    try {
      setLoading(true);
      
      const quarterId = selectedQuarter !== 'all' ? selectedQuarter : null;

      // Load payment history
      const historyResponse = await memberPaymentService.getMemberPaymentHistory(
        selectedMember.id,
        quarterId
      );
      setPaymentHistory(historyResponse.data || []);

      // Load totals
      const totalsResponse = await memberPaymentService.getMemberTotals(
        selectedMember.id,
        quarterId
      );
      setMemberTotals(totalsResponse.data);

    } catch (error) {
      console.error('Failed to load member data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter(member =>
    member.member_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const exportMemberHistory = () => {
    if (!selectedMember || paymentHistory.length === 0) return;

    const headers = [
      'Date',
      'Week',
      'Lesson English',
      'Lesson Luganda',
      'Adult English 10k',
      'Adult English 20k',
      'Adult Luganda 10k',
      'Adult Luganda 20k',
      'Morning Watch English',
      'Morning Watch Luganda',
      'Week Total',
      'Notes'
    ];

    const rows = paymentHistory.map(payment => [
      payment.payment_date,
      payment.week_number,
      payment.lesson_english || 0,
      payment.lesson_luganda || 0,
      payment.adult_lesson_english_10k ? 'Yes' : 'No',
      payment.adult_lesson_english_20k ? 'Yes' : 'No',
      payment.adult_lesson_luganda_10k ? 'Yes' : 'No',
      payment.adult_lesson_luganda_20k ? 'Yes' : 'No',
      payment.morning_watch_english || 0,
      payment.morning_watch_luganda || 0,
      payment.week_total || 0,
      payment.notes || ''
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedMember.member_name}-payment-history.csv`;
    a.click();
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment History</h1>
        <p className="text-gray-600">View detailed payment history for each member</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Member Selection */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Member</h2>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search members..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Member List */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredMembers.map((member) => (
                <button
                  key={member.id}
                  onClick={() => setSelectedMember(member)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition ${
                    selectedMember?.id === member.id
                      ? 'bg-blue-100 border-2 border-blue-500'
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  <p className="font-medium text-gray-900">{member.member_name}</p>
                  <p className="text-sm text-gray-600">
                    {member.classes?.class_name || 'Unknown Class'}
                  </p>
                </button>
              ))}

              {filteredMembers.length === 0 && (
                <p className="text-center text-gray-500 py-8">No members found</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Payment Details */}
        <div className="lg:col-span-2">
          {!selectedMember ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <DollarSign className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Member</h3>
              <p className="text-gray-600">Choose a member from the list to view their payment history</p>
            </div>
          ) : (
            <>
              {/* Member Summary */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedMember.member_name}</h2>
                    <p className="text-gray-600">{selectedMember.classes?.class_name || 'Unknown Class'}</p>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={selectedQuarter}
                      onChange={(e) => setSelectedQuarter(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Quarters</option>
                      {quarters.map((quarter) => (
                        <option key={quarter.id} value={quarter.id}>
                          {quarter.name} {quarter.year}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={exportMemberHistory}
                      disabled={paymentHistory.length === 0}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Download className="h-5 w-5" />
                      Export
                    </button>
                  </div>
                </div>

                {/* Totals */}
                {memberTotals && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm text-blue-600 font-medium mb-1">Quarter Total</p>
                      <p className="text-2xl font-bold text-blue-700">
                        {memberPaymentService.formatCurrency(memberTotals.quarter_grand_total)}
                      </p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <p className="text-sm text-purple-600 font-medium mb-1">Year Total</p>
                      <p className="text-2xl font-bold text-purple-700">
                        {memberPaymentService.formatCurrency(memberTotals.year_grand_total)}
                      </p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <p className="text-sm text-green-600 font-medium mb-1">Weeks Paid</p>
                      <p className="text-2xl font-bold text-green-700">
                        {memberTotals.weeks_paid || 0}
                      </p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-4">
                      <p className="text-sm text-orange-600 font-medium mb-1">Last Payment</p>
                      <p className="text-lg font-bold text-orange-700">
                        {memberTotals.last_payment_date 
                          ? new Date(memberTotals.last_payment_date).toLocaleDateString()
                          : 'N/A'
                        }
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment History Table */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b">
                  <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : paymentHistory.length === 0 ? (
                  <div className="p-12 text-center">
                    <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Payment History</h3>
                    <p className="text-gray-600">This member hasn't made any payments yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Week</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quarter</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Lessons</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Adult Lessons</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Morning Watch</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {paymentHistory.map((payment) => {
                          const lessonTotal = (payment.lesson_english || 0) + (payment.lesson_luganda || 0);
                          const adultTotal = 
                            (payment.adult_lesson_english_10k ? 10000 : 0) +
                            (payment.adult_lesson_english_20k ? 20000 : 0) +
                            (payment.adult_lesson_luganda_10k ? 10000 : 0) +
                            (payment.adult_lesson_luganda_20k ? 20000 : 0);
                          const morningWatchTotal = (payment.morning_watch_english || 0) + (payment.morning_watch_luganda || 0);
                          
                          return (
                            <tr key={payment.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {new Date(payment.payment_date).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                Week {payment.week_number}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {payment.quarters?.name} {payment.quarters?.year}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                {memberPaymentService.formatCurrency(lessonTotal)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                {memberPaymentService.formatCurrency(adultTotal)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                {memberPaymentService.formatCurrency(morningWatchTotal)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-blue-600">
                                {memberPaymentService.formatCurrency(payment.week_total)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-gray-50 border-t-2">
                        <tr>
                          <td colSpan="6" className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                            Grand Total:
                          </td>
                          <td className="px-6 py-4 text-right text-lg font-bold text-blue-600">
                            {memberPaymentService.formatCurrency(
                              paymentHistory.reduce((sum, p) => sum + (p.week_total || 0), 0)
                            )}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentHistory;