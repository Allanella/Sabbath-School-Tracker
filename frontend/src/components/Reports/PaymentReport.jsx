import React, { useState, useEffect } from 'react';
import { DollarSign, Download, Users, Calendar, Filter, CheckCircle } from 'lucide-react';
import classService from '../../services/classService';
import quarterService from '../../services/quarterService';
import paymentService from '../../services/paymentService';
import weeklyDataService from '../../services/WeeklyDataService';

const PaymentReport = () => {
  const [quarters, setQuarters] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedQuarter, setSelectedQuarter] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedPaymentType, setSelectedPaymentType] = useState('all');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    loadQuarters();
  }, []);

  useEffect(() => {
    if (selectedQuarter) {
      loadClasses(selectedQuarter);
    }
  }, [selectedQuarter]);

  useEffect(() => {
    if (selectedQuarter && selectedClass) {
      loadReportData();
    } else {
      setReportData(null);
    }
  }, [selectedQuarter, selectedClass, selectedPaymentType]);

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
    }
  };

  const loadClasses = async (quarterId) => {
    try {
      const response = await classService.getAll(quarterId);
      const classList = Array.isArray(response) ? response : (response.data || []);
      setClasses(classList);
      setSelectedClass('');
      setReportData(null);
    } catch (error) {
      console.error('Failed to load classes:', error);
      setClasses([]);
    }
  };

  const loadReportData = async () => {
    if (!selectedQuarter || !selectedClass) return;
    setLoading(true);

    try {
      // Get member payment totals (lesson/morning watch)
      const totalsResponse = await paymentService.getClassPaymentTotals(selectedClass, selectedQuarter);
      const members = Array.isArray(totalsResponse)
        ? totalsResponse
        : (totalsResponse.data || []);

      // Get weekly data for offerings and attendance stats
      const weeklyResponse = await weeklyDataService.getByClass(selectedClass);
      const weeklyData = Array.isArray(weeklyResponse)
        ? weeklyResponse
        : (weeklyResponse.data || []);

      // Calculate weekly totals
      let totalAttendance = 0;
      let totalOfferings = 0;
      let totalVisits = 0;
      let totalBibleStudies = 0;
      let totalVisitors = 0;
      let totalHelpedOthers = 0;
      let totalStudiedLesson = 0;
      const weeksReported = weeklyData.length;

      weeklyData.forEach(week => {
        totalAttendance += parseInt(week.total_attendance) || 0;
        totalOfferings += parseFloat(week.offering_global_mission) || 0;
        totalVisits += parseInt(week.member_visits) || 0;
        totalBibleStudies += parseInt(week.members_conducted_bible_studies) || 0;
        totalVisitors += parseInt(week.number_of_visitors) || 0;
        totalHelpedOthers += parseInt(week.members_helped_others) || 0;
        totalStudiedLesson += parseInt(week.members_studied_lesson) || 0;
      });

      // Calculate member payment totals
      let totalLessonEnglish = 0;
      let totalLessonLuganda = 0;
      let totalMwEnglish = 0;
      let totalMwLuganda = 0;
      let membersWithPayments = 0;

      const memberPayments = members.map(member => {
        const t = member.totals || {};
        const lessonEng = t.lesson_english || 0;
        const lessonLug = t.lesson_luganda || 0;
        const mwEng = t.morning_watch_english || 0;
        const mwLug = t.morning_watch_luganda || 0;
        const total = lessonEng + lessonLug + mwEng + mwLug;

        if (total > 0) membersWithPayments++;

        totalLessonEnglish += lessonEng;
        totalLessonLuganda += lessonLug;
        totalMwEnglish += mwEng;
        totalMwLuganda += mwLug;

        return {
          name: member.member_name,
          lessonEnglish: lessonEng,
          lessonLuganda: lessonLug,
          morningWatchEnglish: mwEng,
          morningWatchLuganda: mwLug,
          total,
          weeksPaid: t.weeks_paid || 0,
        };
      }).filter(m => {
        if (selectedPaymentType === 'all') return m.total > 0 || totalOfferings > 0;
        if (selectedPaymentType === 'lesson_english') return m.lessonEnglish > 0;
        if (selectedPaymentType === 'lesson_luganda') return m.lessonLuganda > 0;
        if (selectedPaymentType === 'morning_watch_english') return m.morningWatchEnglish > 0;
        if (selectedPaymentType === 'morning_watch_luganda') return m.morningWatchLuganda > 0;
        return false;
      }).sort((a, b) => a.name.localeCompare(b.name));

      const totalMemberPayments = totalLessonEnglish + totalLessonLuganda + totalMwEnglish + totalMwLuganda;
      const grandTotal = totalOfferings + totalMemberPayments;

      setReportData({
        memberPayments,
        weeklyData,
        summary: {
          totalAttendance,
          totalOfferings,
          totalVisits,
          totalBibleStudies,
          totalVisitors,
          totalHelpedOthers,
          totalStudiedLesson,
          weeksReported,
          totalLessonEnglish,
          totalLessonLuganda,
          totalMwEnglish,
          totalMwLuganda,
          totalMemberPayments,
          grandTotal,
          membersWithPayments,
          totalMembers: members.length,
        },
      });
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedClassName = classes.find(c => c.id === selectedClass)?.class_name || '';

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
            <p className="text-green-100">Offerings, lessons and morning watch payments</p>
          </div>
          <button onClick={() => window.print()} className="flex items-center space-x-2 px-4 py-2 bg-white text-green-600 rounded-lg hover:bg-green-50 transition">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Quarter</label>
            <select value={selectedQuarter} onChange={(e) => setSelectedQuarter(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
              <option value="">Choose Quarter</option>
              {quarters.map((quarter) => (
                <option key={quarter.id} value={quarter.id}>
                  {quarter.name} {quarter.year} {quarter.is_active ? '(Active)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Class</label>
            <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
              <option value="">Select a class</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>{cls.class_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Type</label>
            <select value={selectedPaymentType} onChange={(e) => setSelectedPaymentType(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
              <option value="all">All Types</option>
              <option value="lesson_english">Lesson (English)</option>
              <option value="lesson_luganda">Lesson (Luganda)</option>
              <option value="morning_watch_english">Morning Watch (English)</option>
              <option value="morning_watch_luganda">Morning Watch (Luganda)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Prompt */}
      {!selectedClass && (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
          <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-lg font-medium">Select a quarter and class to view the report</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <span className="ml-3 text-gray-600">Loading report...</span>
        </div>
      )}

      {reportData && !loading && (
        <>
          {/* Class Title */}
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
            <p className="text-lg font-bold text-gray-900">{selectedClassName}</p>
            <p className="text-sm text-gray-600">{reportData.summary.weeksReported} weeks reported · {reportData.summary.totalMembers} members</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
              <p className="text-xs text-gray-600 mb-1">Total Attendance</p>
              <p className="text-2xl font-bold text-gray-900">{reportData.summary.totalAttendance}</p>
              <p className="text-xs text-gray-500">Avg: {reportData.summary.weeksReported > 0 ? (reportData.summary.totalAttendance / reportData.summary.weeksReported).toFixed(1) : 0}/week</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
              <p className="text-xs text-gray-600 mb-1">Global Mission Offerings</p>
              <p className="text-2xl font-bold text-gray-900">{reportData.summary.totalOfferings.toLocaleString()}</p>
              <p className="text-xs text-gray-500">UGX</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
              <p className="text-xs text-gray-600 mb-1">Member Payments</p>
              <p className="text-2xl font-bold text-gray-900">{reportData.summary.totalMemberPayments.toLocaleString()}</p>
              <p className="text-xs text-gray-500">UGX · {reportData.summary.membersWithPayments} members paid</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
              <p className="text-xs text-gray-600 mb-1">Grand Total</p>
              <p className="text-2xl font-bold text-orange-600">{reportData.summary.grandTotal.toLocaleString()}</p>
              <p className="text-xs text-gray-500">UGX</p>
            </div>
          </div>

          {/* Activity Stats */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-700">{reportData.summary.totalVisits}</p>
                <p className="text-xs text-gray-600 mt-1">Member Visits</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-700">{reportData.summary.totalBibleStudies}</p>
                <p className="text-xs text-gray-600 mt-1">Bible Studies</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-700">{reportData.summary.totalVisitors}</p>
                <p className="text-xs text-gray-600 mt-1">Visitors</p>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-700">{reportData.summary.totalHelpedOthers}</p>
                <p className="text-xs text-gray-600 mt-1">Helped Others</p>
              </div>
            </div>
          </div>

          {/* Weekly Offerings Table */}
          {reportData.weeklyData.length > 0 && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Weekly Offerings</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Week</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Offering (UGX)</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Attendance</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Visits</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Bible Studies</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Visitors</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {reportData.weeklyData.sort((a, b) => a.week_number - b.week_number).map((week, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-3">
                          <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
                            Week {week.week_number}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-600">
                          {new Date(week.sabbath_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-3 text-right text-sm font-semibold text-green-600">
                          {parseFloat(week.offering_global_mission || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-3 text-right text-sm">{week.total_attendance}</td>
                        <td className="px-6 py-3 text-right text-sm">{week.member_visits || 0}</td>
                        <td className="px-6 py-3 text-right text-sm">{week.members_conducted_bible_studies || 0}</td>
                        <td className="px-6 py-3 text-right text-sm">{week.number_of_visitors || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 font-bold">
                    <tr>
                      <td colSpan="2" className="px-6 py-3 text-sm">TOTALS</td>
                      <td className="px-6 py-3 text-right text-sm text-green-700">{reportData.summary.totalOfferings.toLocaleString()}</td>
                      <td className="px-6 py-3 text-right text-sm">{reportData.summary.totalAttendance}</td>
                      <td className="px-6 py-3 text-right text-sm">{reportData.summary.totalVisits}</td>
                      <td className="px-6 py-3 text-right text-sm">{reportData.summary.totalBibleStudies}</td>
                      <td className="px-6 py-3 text-right text-sm">{reportData.summary.totalVisitors}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Member Payment Breakdown */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Member Payment Breakdown</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-700 font-medium mb-1">Lesson (English)</p>
                <p className="text-xl font-bold text-green-900">{reportData.summary.totalLessonEnglish.toLocaleString()} UGX</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700 font-medium mb-1">Lesson (Luganda)</p>
                <p className="text-xl font-bold text-blue-900">{reportData.summary.totalLessonLuganda.toLocaleString()} UGX</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-sm text-purple-700 font-medium mb-1">MW (English)</p>
                <p className="text-xl font-bold text-purple-900">{reportData.summary.totalMwEnglish.toLocaleString()} UGX</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-sm text-orange-700 font-medium mb-1">MW (Luganda)</p>
                <p className="text-xl font-bold text-orange-900">{reportData.summary.totalMwLuganda.toLocaleString()} UGX</p>
              </div>
            </div>

            {reportData.memberPayments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Lesson (EN)</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Lesson (LG)</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">MW (EN)</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">MW (LG)</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Weeks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {reportData.memberPayments.map((member, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{member.name}</td>
                        <td className="px-4 py-3 text-right text-sm">{member.lessonEnglish.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-sm">{member.lessonLuganda.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-sm">{member.morningWatchEnglish.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-sm">{member.morningWatchLuganda.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-sm font-bold text-green-700">{member.total.toLocaleString()} UGX</td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                            {member.weeksPaid}/13
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No lesson or morning watch payments recorded yet for this class.</p>
                <p className="text-sm mt-1">Offerings data is shown above in Weekly Offerings section.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default PaymentReport;