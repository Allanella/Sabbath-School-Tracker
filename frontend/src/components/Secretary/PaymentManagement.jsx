import React, { useState, useEffect } from 'react';
import { DollarSign, Users, Calendar, TrendingUp, Download, Filter, AlertCircle } from 'lucide-react';
import paymentService from '../../services/paymentService';
import classMemberService from '../../services/classMemberService';
import classService from '../../services/classService';
import quarterService from '../../services/quarterService';

const PaymentManagement = () => {
  const [classes, setClasses] = useState([]);
  const [quarters, setQuarters] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedQuarter, setSelectedQuarter] = useState('');
  const [selectedWeek, setSelectedWeek] = useState('all');
  const [paymentType, setPaymentType] = useState('all');
  const [members, setMembers] = useState([]);
  const [paymentTotals, setPaymentTotals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load classes and quarters on mount
  useEffect(() => {
    loadClasses();
    loadQuarters();
  }, []);

  // Load data when class/quarter changes
  useEffect(() => {
    if (selectedClass && selectedQuarter) {
      loadPaymentData();
    }
  }, [selectedClass, selectedQuarter, selectedWeek, paymentType]);

  const loadQuarters = async () => {
    try {
      const response = await quarterService.getAll();
      const quartersList = Array.isArray(response) ? response : (response.data || []);
      setQuarters(quartersList);

      const activeQuarter = quartersList.find(q => q.is_active);
      if (activeQuarter) {
        setSelectedQuarter(activeQuarter.id);
      } else if (quartersList.length > 0) {
        setSelectedQuarter(quartersList[0].id);
      }
    } catch (error) {
      console.error('Failed to load quarters:', error);
      setQuarters([]);
    }
  };

  const loadClasses = async () => {
    try {
      const quarterId = localStorage.getItem('selectedQuarterId');
      const response = await classService.getAll(quarterId);
      const classList = Array.isArray(response) ? response : (response.data || []);
      setClasses(classList);

      if (classList.length > 0 && !selectedClass) {
        setSelectedClass(classList[0].id);
      }
    } catch (error) {
      console.error('Failed to load classes:', error);
      setClasses([]);
    }
  };

  const loadPaymentData = async () => {
    try {
      setLoading(true);
      setError('');

      const membersResponse = await classMemberService.getByClass(selectedClass);
      const membersList = Array.isArray(membersResponse) ? membersResponse : (membersResponse.data || []);
      setMembers(membersList);

      const totalsResponse = await paymentService.getClassPaymentTotals(selectedClass, selectedQuarter);
      const totalsData = Array.isArray(totalsResponse) ? totalsResponse : (totalsResponse.data || []);
      
      setPaymentTotals(totalsData);

    } catch (error) {
      console.error('Failed to load payment data:', error);
      setError('Failed to load payment data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Updated Summary Calculation
  const calculateSummary = () => {
    let totalAmount = 0;
    let uniqueMembers = 0;
    let totalPayments = 0;

    paymentTotals.forEach(memberData => {
      const totals = memberData.totals || {};
      
      if (paymentType === 'all' || paymentType === 'lesson_english') {
        totalAmount += totals.lesson_english || 0;
      }
      if (paymentType === 'all' || paymentType === 'lesson_luganda') {
        totalAmount += totals.lesson_luganda || 0;
      }
      if (paymentType === 'all' || paymentType === 'morning_watch_english') {
        totalAmount += totals.morning_watch_english || 0;
      }
      if (paymentType === 'all' || paymentType === 'morning_watch_luganda') {
        totalAmount += totals.morning_watch_luganda || 0;
      }
      // Single offering calculation
      if (paymentType === 'all' || paymentType === 'offering') {
        totalAmount += totals.offering || 0;
      }

      if (totals.quarter_grand_total > 0) {
        uniqueMembers++;
      }

      totalPayments += totals.weeks_paid || 0;
    });

    return {
      totalAmount,
      uniqueMembers,
      totalMembers: members.length,
      avgPerMember: uniqueMembers > 0 ? totalAmount / uniqueMembers : 0,
      totalPayments
    };
  };

  const summary = calculateSummary();

  const exportToCSV = () => {
    const headers = ['Member Name', 'Lesson (English)', 'Lesson (Luganda)', 'MW (English)', 'MW (Luganda)', 'Offering', 'Quarter Total', 'Year Total', 'Weeks Paid'];
    
    const rows = paymentTotals.map(memberData => {
      const totals = memberData.totals || {};
      return [
        memberData.member_name,
        totals.lesson_english || 0,
        totals.lesson_luganda || 0,
        totals.morning_watch_english || 0,
        totals.morning_watch_luganda || 0,
        totals.offering || 0,
        totals.quarter_grand_total || 0,
        totals.year_grand_total || 0,
        totals.weeks_paid || 0
      ];
    });

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    const selectedClassName = classes.find(c => c.id === selectedClass)?.class_name || 'class';
    const selectedQuarterName = quarters.find(q => q.id === selectedQuarter)?.name || 'quarter';
    
    a.download = `payments-${selectedClassName}-${selectedQuarterName}.csv`;
    a.click();
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Management</h1>
        <p className="text-gray-600">Track and manage member payments</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="inline h-4 w-4 mr-1" />
              Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Class</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>{cls.class_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline h-4 w-4 mr-1" />
              Quarter
            </label>
            <select
              value={selectedQuarter}
              onChange={(e) => setSelectedQuarter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Quarter</option>
              {quarters.map((quarter) => (
                <option key={quarter.id} value={quarter.id}>
                  {quarter.name} {quarter.year}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Week Number
            </label>
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Weeks</option>
              {[...Array(13)].map((_, i) => (
                <option key={i + 1} value={i + 1}>Week {i + 1}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Type
            </label>
            <select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="lesson_english">Lesson (English)</option>
              <option value="lesson_luganda">Lesson (Luganda)</option>
              <option value="morning_watch_english">Morning Watch (English)</option>
              <option value="morning_watch_luganda">Morning Watch (Luganda)</option>
              {/* Added Offering Filter */}
              <option value="offering">Offering</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {!selectedClass || !selectedQuarter ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Filter className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Select Class and Quarter</h3>
          <p className="text-gray-600">Choose a class and quarter above to view payments</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
              <DollarSign className="h-8 w-8 opacity-80 mb-2" />
              <p className="text-green-100 text-sm font-medium mb-1">Total Amount</p>
              <p className="text-3xl font-bold">{summary.totalAmount.toLocaleString()} UGX</p>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
              <Users className="h-8 w-8 opacity-80 mb-2" />
              <p className="text-blue-100 text-sm font-medium mb-1">Unique Members</p>
              <p className="text-3xl font-bold">{summary.uniqueMembers}</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
              <TrendingUp className="h-8 w-8 opacity-80 mb-2" />
              <p className="text-purple-100 text-sm font-medium mb-1">Avg per Member</p>
              <p className="text-3xl font-bold">{Math.round(summary.avgPerMember).toLocaleString()} UGX</p>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white">
              <div className="flex justify-between items-center mb-2">
                <Calendar className="h-8 w-8 opacity-80" />
                <button
                  onClick={exportToCSV}
                  disabled={paymentTotals.length === 0}
                  className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition flex items-center gap-1"
                >
                  <Download className="h-4 w-4" /> Export
                </button>
              </div>
              <p className="text-orange-100 text-sm font-medium mb-1">Total Payments</p>
              <p className="text-3xl font-bold">{summary.totalPayments}</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Payment Details</h2>
                <span className="text-sm text-gray-600">{paymentTotals.length} members</span>
              </div>

              {paymentTotals.length === 0 ? (
                <div className="p-12 text-center text-gray-500">No payment data recorded.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member Name</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Lesson (EN)</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Lesson (LG)</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">MW (EN)</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">MW (LG)</th>
                        {/* New Offering Header */}
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Offering</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quarter Total</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Weeks Paid</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {paymentTotals.map((memberData, index) => {
                        const totals = memberData.totals || {};
                        return (
                          <tr key={memberData.id || index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap font-medium">{memberData.member_name}</td>
                            <td className="px-6 py-4 text-right">{(totals.lesson_english || 0).toLocaleString()}</td>
                            <td className="px-6 py-4 text-right">{(totals.lesson_luganda || 0).toLocaleString()}</td>
                            <td className="px-6 py-4 text-right">{(totals.morning_watch_english || 0).toLocaleString()}</td>
                            <td className="px-6 py-4 text-right">{(totals.morning_watch_luganda || 0).toLocaleString()}</td>
                            {/* New Offering Row Data */}
                            <td className="px-6 py-4 text-right">{(totals.offering || 0).toLocaleString()}</td>
                            <td className="px-6 py-4 text-right font-semibold text-green-600">
                              {(totals.quarter_grand_total || 0).toLocaleString()} UGX
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                                {totals.weeks_paid || 0}/13
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-gray-50 font-semibold">
                      <tr>
                        <td className="px-6 py-4">TOTAL</td>
                        <td className="px-6 py-4 text-right">
                          {paymentTotals.reduce((sum, m) => sum + (m.totals?.lesson_english || 0), 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {paymentTotals.reduce((sum, m) => sum + (m.totals?.lesson_luganda || 0), 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {paymentTotals.reduce((sum, m) => sum + (m.totals?.morning_watch_english || 0), 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {paymentTotals.reduce((sum, m) => sum + (m.totals?.morning_watch_luganda || 0), 0).toLocaleString()}
                        </td>
                        {/* Offering Total Footer */}
                        <td className="px-6 py-4 text-right">
                          {paymentTotals.reduce((sum, m) => sum + (m.totals?.offering || 0), 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-green-600">
                          {summary.totalAmount.toLocaleString()} UGX
                        </td>
                        <td className="px-6 py-4"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PaymentManagement;