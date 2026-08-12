import React, { useState, useEffect } from 'react';
import { DollarSign, Users, Calendar, TrendingUp, Download, Filter, AlertCircle } from 'lucide-react';
import paymentService from '../../services/paymentService';
import classMemberService from '../../services/classMemberService';
import classService from '../../services/classService';
import quarterService from '../../services/quarterService';

const PaymentManagement = () => {
  const [classes, setClasses] = useState([]);
  const [quarters, setQuarters] = useState([]);
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedQuarter, setSelectedQuarter] = useState('');
  const [selectedWeek, setSelectedWeek] = useState('all');
  const [paymentType, setPaymentType] = useState('all');
  const [members, setMembers] = useState([]);
  const [paymentTotals, setPaymentTotals] = useState([]);
  const [allClassesSummary, setAllClassesSummary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadQuarters();
  }, []);

  useEffect(() => {
    if (selectedQuarter) {
      loadClasses(selectedQuarter);
    }
  }, [selectedQuarter]);

  useEffect(() => {
    if (selectedQuarter) {
      if (selectedClass === 'all') {
        loadAllClassesData();
      } else if (selectedClass) {
        loadPaymentData();
      }
    }
  }, [selectedClass, selectedQuarter, selectedWeek, paymentType]);

  const loadQuarters = async () => {
    try {
      const response = await quarterService.getAll();
      const allQuarters = Array.isArray(response) ? response : (response.data || []);
      const quartersList = allQuarters.filter(q => q.year === 2026);
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

  const loadClasses = async (quarterId) => {
    try {
      const response = await classService.getAll(quarterId);
      const classList = Array.isArray(response) ? response : (response.data || []);
      setClasses(classList);
      setSelectedClass('all');
    } catch (error) {
      console.error('Failed to load classes:', error);
      setClasses([]);
    }
  };

  const loadAllClassesData = async () => {
    try {
      setLoading(true);
      setError('');
      const summary = [];

      for (const cls of classes) {
        const totalsResponse = await paymentService.getClassPaymentTotals(cls.id, selectedQuarter);
        const members = Array.isArray(totalsResponse) ? totalsResponse : (totalsResponse.data || []);

        let lessonEnglish = 0, lessonLuganda = 0, mwEnglish = 0, mwLuganda = 0, offering = 0, weeksPaid = 0;
        let membersWithPayments = 0;

        members.forEach(member => {
          const t = member.totals || {};
          lessonEnglish += t.lesson_english || 0;
          lessonLuganda += t.lesson_luganda || 0;
          mwEnglish += t.morning_watch_english || 0;
          mwLuganda += t.morning_watch_luganda || 0;
          offering += t.offering || 0;
          weeksPaid += t.weeks_paid || 0;
          if ((t.quarter_grand_total || 0) > 0) membersWithPayments++;
        });

        const total = lessonEnglish + lessonLuganda + mwEnglish + mwLuganda + offering;

        summary.push({
          class: cls,
          lessonEnglish,
          lessonLuganda,
          mwEnglish,
          mwLuganda,
          offering,
          total,
          membersWithPayments,
          totalMembers: members.length,
        });
      }

      summary.sort((a, b) => b.total - a.total);
      setAllClassesSummary(summary);
    } catch (error) {
      console.error('Failed to load all classes data:', error);
      setError('Failed to load payment data.');
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentData = async () => {
    try {
      setLoading(true);
      setError('');

      const membersResponse = await classMemberService.getByClass(selectedClass);
      const membersList = Array.isArray(membersResponse)
        ? membersResponse
        : (membersResponse.data || []);
      setMembers(membersList);

      const totalsResponse = await paymentService.getClassPaymentTotals(selectedClass, selectedQuarter);
      const totalsData = Array.isArray(totalsResponse)
        ? totalsResponse
        : (totalsResponse.data || []);
      setPaymentTotals(totalsData);
    } catch (error) {
      console.error('Failed to load payment data:', error);
      setError('Failed to load payment data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = () => {
    let totalAmount = 0, uniqueMembers = 0, totalPayments = 0;

    paymentTotals.forEach(memberData => {
      const totals = memberData.totals || {};
      if (paymentType === 'all' || paymentType === 'lesson_english') totalAmount += totals.lesson_english || 0;
      if (paymentType === 'all' || paymentType === 'lesson_luganda') totalAmount += totals.lesson_luganda || 0;
      if (paymentType === 'all' || paymentType === 'morning_watch_english') totalAmount += totals.morning_watch_english || 0;
      if (paymentType === 'all' || paymentType === 'morning_watch_luganda') totalAmount += totals.morning_watch_luganda || 0;
      if (paymentType === 'all' || paymentType === 'offering') totalAmount += totals.offering || 0;
      if ((totals.quarter_grand_total || 0) > 0) uniqueMembers++;
      totalPayments += totals.weeks_paid || 0;
    });

    return {
      totalAmount,
      uniqueMembers,
      avgPerMember: uniqueMembers > 0 ? totalAmount / uniqueMembers : 0,
      totalPayments,
    };
  };

  const summary = selectedClass !== 'all' ? calculateSummary() : null;

  const allClassesTotal = allClassesSummary.reduce((sum, c) => sum + c.total, 0);
  const allClassesLessonEnglish = allClassesSummary.reduce((sum, c) => sum + c.lessonEnglish, 0);
  const allClassesLessonLuganda = allClassesSummary.reduce((sum, c) => sum + c.lessonLuganda, 0);
  const allClassesMwEnglish = allClassesSummary.reduce((sum, c) => sum + c.mwEnglish, 0);
  const allClassesMwLuganda = allClassesSummary.reduce((sum, c) => sum + c.mwLuganda, 0);

  const exportToCSV = () => {
    if (selectedClass === 'all') {
      const headers = ['Class', 'Lesson (EN)', 'Lesson (LG)', 'MW (EN)', 'MW (LG)', 'Offering', 'Total'];
      const rows = allClassesSummary.map(c => [
        c.class.class_name, c.lessonEnglish, c.lessonLuganda, c.mwEnglish, c.mwLuganda, c.offering, c.total
      ]);
      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `all-classes-payments.csv`;
      a.click();
    } else {
      const headers = ['Member Name', 'Lesson (EN)', 'Lesson (LG)', 'MW (EN)', 'MW (LG)', 'Offering', 'Quarter Total', 'Weeks Paid'];
      const rows = paymentTotals.map(m => {
        const t = m.totals || {};
        return [m.member_name, t.lesson_english || 0, t.lesson_luganda || 0, t.morning_watch_english || 0, t.morning_watch_luganda || 0, t.offering || 0, t.quarter_grand_total || 0, t.weeks_paid || 0];
      });
      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const a = document.createElement('a');
      a.href = window.URL.createObjectURL(blob);
      a.download = `payments.csv`;
      a.click();
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Management</h1>
        <p className="text-gray-600">Track and manage member payments</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline h-4 w-4 mr-1" />Quarter
            </label>
            <select value={selectedQuarter} onChange={(e) => setSelectedQuarter(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              <option value="">Select Quarter</option>
              {quarters.map((q) => (
                <option key={q.id} value={q.id}>{q.name} {q.year}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="inline h-4 w-4 mr-1" />Class
            </label>
            <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              <option value="all">📊 All Classes (Summary)</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>{cls.class_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Week Number</label>
            <select value={selectedWeek} onChange={(e) => setSelectedWeek(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              <option value="all">All Weeks</option>
              {[...Array(13)].map((_, i) => (
                <option key={i + 1} value={i + 1}>Week {i + 1}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Type</label>
            <select value={paymentType} onChange={(e) => setPaymentType(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              <option value="all">All Types</option>
              <option value="lesson_english">Lesson (English)</option>
              <option value="lesson_luganda">Lesson (Luganda)</option>
              <option value="morning_watch_english">Morning Watch (English)</option>
              <option value="morning_watch_luganda">Morning Watch (Luganda)</option>
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

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading payment data...</span>
        </div>
      ) : (
        <>
          {/* ALL CLASSES VIEW */}
          {selectedClass === 'all' && allClassesSummary.length > 0 && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow p-4 text-white">
                  <p className="text-green-100 text-xs mb-1">Grand Total</p>
                  <p className="text-2xl font-bold">{allClassesTotal.toLocaleString()} UGX</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow p-4 text-white">
                  <p className="text-blue-100 text-xs mb-1">Lesson (EN+LG)</p>
                  <p className="text-2xl font-bold">{(allClassesLessonEnglish + allClassesLessonLuganda).toLocaleString()} UGX</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow p-4 text-white">
                  <p className="text-purple-100 text-xs mb-1">Morning Watch</p>
                  <p className="text-2xl font-bold">{(allClassesMwEnglish + allClassesMwLuganda).toLocaleString()} UGX</p>
                </div>
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow p-4 text-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-orange-100 text-xs mb-1">Classes</p>
                      <p className="text-2xl font-bold">{allClassesSummary.length}</p>
                    </div>
                    <button onClick={exportToCSV} className="px-2 py-1 bg-white/20 hover:bg-white/30 rounded text-xs flex items-center gap-1">
                      <Download className="h-3 w-3" /> Export
                    </button>
                  </div>
                </div>
              </div>

              {/* All Classes Table */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">All Classes Payment Summary</h2>
                  <span className="text-sm text-gray-500">{allClassesSummary.length} classes</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Lesson (EN)</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Lesson (LG)</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">MW (EN)</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">MW (LG)</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Offering</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Members Paid</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {allClassesSummary.map((item, index) => (
                        <tr
                          key={item.class.id}
                          className={`hover:bg-gray-50 cursor-pointer ${item.total > 0 ? '' : 'opacity-60'}`}
                          onClick={() => setSelectedClass(item.class.id)}
                        >
                          <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900">{item.class.class_name}</div>
                            <div className="text-xs text-gray-500">{item.class.teacher_name}</div>
                          </td>
                          <td className="px-4 py-3 text-right text-sm">{item.lessonEnglish.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right text-sm">{item.lessonLuganda.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right text-sm">{item.mwEnglish.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right text-sm">{item.mwLuganda.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right text-sm">{item.offering.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right font-bold text-green-700">
                            {item.total.toLocaleString()} UGX
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.membersWithPayments > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                              {item.membersWithPayments}/{item.totalMembers}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 font-bold">
                      <tr>
                        <td colSpan="2" className="px-4 py-3 text-sm">TOTALS</td>
                        <td className="px-4 py-3 text-right text-sm">{allClassesLessonEnglish.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-sm">{allClassesLessonLuganda.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-sm">{allClassesMwEnglish.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-sm">{allClassesMwLuganda.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-sm">{allClassesSummary.reduce((s, c) => s + c.offering, 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-green-700 text-lg">{allClassesTotal.toLocaleString()} UGX</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <div className="px-6 py-3 bg-blue-50 text-xs text-blue-600">
                  💡 Click on any class row to view individual member payments
                </div>
              </div>
            </>
          )}

          {/* SINGLE CLASS VIEW */}
          {selectedClass !== 'all' && selectedQuarter && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
                  <DollarSign className="h-8 w-8 opacity-80 mb-2" />
                  <p className="text-green-100 text-sm font-medium mb-1">Total Amount</p>
                  <p className="text-3xl font-bold">{summary?.totalAmount.toLocaleString()} UGX</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
                  <Users className="h-8 w-8 opacity-80 mb-2" />
                  <p className="text-blue-100 text-sm font-medium mb-1">Unique Members</p>
                  <p className="text-3xl font-bold">{summary?.uniqueMembers}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
                  <TrendingUp className="h-8 w-8 opacity-80 mb-2" />
                  <p className="text-purple-100 text-sm font-medium mb-1">Avg per Member</p>
                  <p className="text-3xl font-bold">{Math.round(summary?.avgPerMember || 0).toLocaleString()} UGX</p>
                </div>
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white">
                  <div className="flex justify-between items-center mb-2">
                    <Calendar className="h-8 w-8 opacity-80" />
                    <button onClick={exportToCSV} disabled={paymentTotals.length === 0} className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition flex items-center gap-1">
                      <Download className="h-4 w-4" /> Export
                    </button>
                  </div>
                  <p className="text-orange-100 text-sm font-medium mb-1">Total Payments</p>
                  <p className="text-3xl font-bold">{summary?.totalPayments}</p>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Payment Details — {classes.find(c => c.id === selectedClass)?.class_name}
                  </h2>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-600">{paymentTotals.length} members</span>
                    <button onClick={() => setSelectedClass('all')} className="text-sm text-blue-600 hover:underline">
                      ← Back to all classes
                    </button>
                  </div>
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
                          <td className="px-6 py-4 text-right">{paymentTotals.reduce((sum, m) => sum + (m.totals?.lesson_english || 0), 0).toLocaleString()}</td>
                          <td className="px-6 py-4 text-right">{paymentTotals.reduce((sum, m) => sum + (m.totals?.lesson_luganda || 0), 0).toLocaleString()}</td>
                          <td className="px-6 py-4 text-right">{paymentTotals.reduce((sum, m) => sum + (m.totals?.morning_watch_english || 0), 0).toLocaleString()}</td>
                          <td className="px-6 py-4 text-right">{paymentTotals.reduce((sum, m) => sum + (m.totals?.morning_watch_luganda || 0), 0).toLocaleString()}</td>
                          <td className="px-6 py-4 text-right">{paymentTotals.reduce((sum, m) => sum + (m.totals?.offering || 0), 0).toLocaleString()}</td>
                          <td className="px-6 py-4 text-right font-bold text-green-600">
                            {summary?.totalAmount.toLocaleString()} UGX
                          </td>
                          <td className="px-6 py-4"></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default PaymentManagement;