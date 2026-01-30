import React, { useState, useEffect } from 'react';
import { DollarSign, Download, Users, Calendar, Filter, CheckCircle } from 'lucide-react';
import classService from '../../services/classService';
import weeklyDataService from '../../services/WeeklyDataService';
import quarterService from '../../services/quarterService';

const PaymentReport = () => {
  const [quarters, setQuarters] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedQuarter, setSelectedQuarter] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedWeek, setSelectedWeek] = useState('all');
  const [selectedPaymentType, setSelectedPaymentType] = useState('all');
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState(null);

  useEffect(() => {
    loadQuarters();
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedQuarter) {
      loadPaymentData();
    }
  }, [selectedQuarter, selectedClass, selectedWeek, selectedPaymentType]);

  const loadQuarters = async () => {
    try {
      const response = await quarterService.getAll();
      setQuarters(response.data || []);
      if (response.data && response.data.length > 0) {
        setSelectedQuarter(response.data[0].id);
      }
    } catch (error) {
      console.error('Failed to load quarters:', error);
    }
  };

  const loadClasses = async () => {
    try {
      const response = await classService.getAll();
      setClasses(response.data || []);
    } catch (error) {
      console.error('Failed to load classes:', error);
    }
  };

  const parsePayments = (paymentString) => {
    if (!paymentString || paymentString.trim() === '') return [];
    
    const payments = [];
    const entries = paymentString.split(',').map(s => s.trim()).filter(Boolean);
    
    entries.forEach(entry => {
      const [name, amount] = entry.split(':').map(s => s.trim());
      if (name && amount) {
        const numAmount = parseFloat(amount);
        if (!isNaN(numAmount)) {
          payments.push({ name, amount: numAmount });
        }
      }
    });
    
    return payments;
  };

  const loadPaymentData = async () => {
    if (!selectedQuarter) return;

    setLoading(true);
    try {
      const classesToQuery = selectedClass 
        ? [classes.find(c => c.id === selectedClass)]
        : classes.filter(c => c.quarter_id === selectedQuarter);

      const allPayments = [];

      for (const cls of classesToQuery) {
        if (!cls) continue;

        const weeklyDataResponse = await weeklyDataService.getByClass(cls.id);
        const weeklyData = weeklyDataResponse.data || [];

        weeklyData.forEach(week => {
          // Skip if specific week selected and doesn't match
          if (selectedWeek !== 'all' && week.week_number !== parseInt(selectedWeek)) {
            return;
          }

          // Lesson English
          if (selectedPaymentType === 'all' || selectedPaymentType === 'lesson_english') {
            const lessonEnglish = parsePayments(week.members_paid_lesson_english);
            lessonEnglish.forEach(payment => {
              allPayments.push({
                memberName: payment.name,
                amount: payment.amount,
                paymentType: 'Lesson (English)',
                className: cls.class_name,
                weekNumber: week.week_number,
                sabbathDate: week.sabbath_date,
                category: 'lesson_english'
              });
            });
          }

          // Lesson Luganda
          if (selectedPaymentType === 'all' || selectedPaymentType === 'lesson_luganda') {
            const lessonLuganda = parsePayments(week.members_paid_lesson_luganda);
            lessonLuganda.forEach(payment => {
              allPayments.push({
                memberName: payment.name,
                amount: payment.amount,
                paymentType: 'Lesson (Luganda)',
                className: cls.class_name,
                weekNumber: week.week_number,
                sabbathDate: week.sabbath_date,
                category: 'lesson_luganda'
              });
            });
          }

          // Morning Watch English
          if (selectedPaymentType === 'all' || selectedPaymentType === 'morning_watch_english') {
            const morningWatchEnglish = parsePayments(week.members_paid_morning_watch_english);
            morningWatchEnglish.forEach(payment => {
              allPayments.push({
                memberName: payment.name,
                amount: payment.amount,
                paymentType: 'Morning Watch (English)',
                className: cls.class_name,
                weekNumber: week.week_number,
                sabbathDate: week.sabbath_date,
                category: 'morning_watch_english'
              });
            });
          }

          // Morning Watch Luganda
          if (selectedPaymentType === 'all' || selectedPaymentType === 'morning_watch_luganda') {
            const morningWatchLuganda = parsePayments(week.members_paid_morning_watch_luganda);
            morningWatchLuganda.forEach(payment => {
              allPayments.push({
                memberName: payment.name,
                amount: payment.amount,
                paymentType: 'Morning Watch (Luganda)',
                className: cls.class_name,
                weekNumber: week.week_number,
                sabbathDate: week.sabbath_date,
                category: 'morning_watch_luganda'
              });
            });
          }
        });
      }

      // Sort by member name
      allPayments.sort((a, b) => a.memberName.localeCompare(b.memberName));

      // Calculate summary
      const summary = {
        totalPayments: allPayments.length,
        totalAmount: allPayments.reduce((sum, p) => sum + p.amount, 0),
        uniqueMembers: new Set(allPayments.map(p => p.memberName)).size,
        byType: {
          lesson_english: allPayments.filter(p => p.category === 'lesson_english').length,
          lesson_luganda: allPayments.filter(p => p.category === 'lesson_luganda').length,
          morning_watch_english: allPayments.filter(p => p.category === 'morning_watch_english').length,
          morning_watch_luganda: allPayments.filter(p => p.category === 'morning_watch_luganda').length,
        },
        amountByType: {
          lesson_english: allPayments.filter(p => p.category === 'lesson_english').reduce((sum, p) => sum + p.amount, 0),
          lesson_luganda: allPayments.filter(p => p.category === 'lesson_luganda').reduce((sum, p) => sum + p.amount, 0),
          morning_watch_english: allPayments.filter(p => p.category === 'morning_watch_english').reduce((sum, p) => sum + p.amount, 0),
          morning_watch_luganda: allPayments.filter(p => p.category === 'morning_watch_luganda').reduce((sum, p) => sum + p.amount, 0),
        }
      };

      setPaymentData({
        payments: allPayments,
        summary
      });

    } catch (error) {
      console.error('Error loading payment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getPaymentTypeColor = (category) => {
    const colors = {
      lesson_english: 'text-green-600 bg-green-50 border-green-200',
      lesson_luganda: 'text-blue-600 bg-blue-50 border-blue-200',
      morning_watch_english: 'text-purple-600 bg-purple-50 border-purple-200',
      morning_watch_luganda: 'text-orange-600 bg-orange-50 border-orange-200',
    };
    return colors[category] || 'text-gray-600 bg-gray-50 border-gray-200';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payment data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center">
              <DollarSign className="h-8 w-8 mr-3" />
              Payment Report
            </h1>
            <p className="text-green-100">Detailed list of all lesson and morning watch payments</p>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-2 px-4 py-2 bg-white text-green-600 rounded-lg hover:bg-green-50 transition"
          >
            <Download className="h-5 w-5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Quarter</label>
            <select
              value={selectedQuarter}
              onChange={(e) => setSelectedQuarter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {quarters.map((quarter) => (
                <option key={quarter.id} value={quarter.id}>
                  {quarter.name} {quarter.year}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">All Classes</option>
              {classes
                .filter(cls => cls.quarter_id === selectedQuarter)
                .map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.class_name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Week</label>
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Weeks</option>
              {[...Array(13)].map((_, i) => (
                <option key={i + 1} value={i + 1}>Week {i + 1}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Type</label>
            <select
              value={selectedPaymentType}
              onChange={(e) => setSelectedPaymentType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="lesson_english">Lesson (English)</option>
              <option value="lesson_luganda">Lesson (Luganda)</option>
              <option value="morning_watch_english">Morning Watch (English)</option>
              <option value="morning_watch_luganda">Morning Watch (Luganda)</option>
            </select>
          </div>
        </div>
      </div>

      {paymentData && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Payments</p>
                  <p className="text-3xl font-bold text-gray-900">{paymentData.summary.totalPayments}</p>
                </div>
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Unique Members</p>
                  <p className="text-3xl font-bold text-gray-900">{paymentData.summary.uniqueMembers}</p>
                </div>
                <Users className="h-10 w-10 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {paymentData.summary.totalAmount.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">UGX</p>
                </div>
                <DollarSign className="h-10 w-10 text-purple-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Avg per Payment</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {paymentData.summary.totalPayments > 0 
                      ? Math.round(paymentData.summary.totalAmount / paymentData.summary.totalPayments).toLocaleString()
                      : 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">UGX</p>
                </div>
                <Calendar className="h-10 w-10 text-orange-600" />
              </div>
            </div>
          </div>

          {/* Payment Type Breakdown */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Type Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-700 font-medium mb-2">Lesson (English)</p>
                <p className="text-2xl font-bold text-green-900">{paymentData.summary.byType.lesson_english}</p>
                <p className="text-sm text-green-600 mt-1">{paymentData.summary.amountByType.lesson_english.toLocaleString()} UGX</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700 font-medium mb-2">Lesson (Luganda)</p>
                <p className="text-2xl font-bold text-blue-900">{paymentData.summary.byType.lesson_luganda}</p>
                <p className="text-sm text-blue-600 mt-1">{paymentData.summary.amountByType.lesson_luganda.toLocaleString()} UGX</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-sm text-purple-700 font-medium mb-2">Morning Watch (English)</p>
                <p className="text-2xl font-bold text-purple-900">{paymentData.summary.byType.morning_watch_english}</p>
                <p className="text-sm text-purple-600 mt-1">{paymentData.summary.amountByType.morning_watch_english.toLocaleString()} UGX</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-sm text-orange-700 font-medium mb-2">Morning Watch (Luganda)</p>
                <p className="text-2xl font-bold text-orange-900">{paymentData.summary.byType.morning_watch_luganda}</p>
                <p className="text-sm text-orange-600 mt-1">{paymentData.summary.amountByType.morning_watch_luganda.toLocaleString()} UGX</p>
              </div>
            </div>
          </div>

          {/* Payment Details Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Payment Details</h3>
            </div>

            {paymentData.payments.length === 0 ? (
              <div className="p-12 text-center">
                <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No payments found for the selected filters</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Type</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Week</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paymentData.payments.map((payment, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-indigo-600">
                                {payment.memberName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">{payment.memberName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPaymentTypeColor(payment.category)}`}>
                            {payment.paymentType}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">
                          {payment.amount.toLocaleString()} UGX
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {payment.className}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                            Week {payment.weekNumber}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(payment.sabbathDate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 font-bold">
                    <tr>
                      <td colSpan="3" className="px-6 py-4 text-left text-sm uppercase text-gray-700">
                        Total
                      </td>
                      <td className="px-6 py-4 text-right text-lg text-green-700">
                        {paymentData.summary.totalAmount.toLocaleString()} UGX
                      </td>
                      <td colSpan="3" className="px-6 py-4 text-right text-sm text-gray-600">
                        {paymentData.payments.length} payments
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
  );
};

export default PaymentReport;