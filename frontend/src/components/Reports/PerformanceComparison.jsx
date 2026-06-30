import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, BarChart3, Calendar, Download } from 'lucide-react';
import classService from '../../services/classService';
import weeklyDataService from '../../services/WeeklyDataService';
import quarterService from '../../services/quarterService';
import paymentService from '../../services/paymentService';

const PerformanceComparison = () => {
  const [quarters, setQuarters] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedQuarter, setSelectedQuarter] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [loading, setLoading] = useState(false);
  const [performanceData, setPerformanceData] = useState(null);

  useEffect(() => {
    loadQuarters();
  }, []);

  useEffect(() => {
    if (selectedQuarter) {
      loadClasses(selectedQuarter);
    }
  }, [selectedQuarter]);

  useEffect(() => {
    if (selectedClass) {
      loadPerformanceData();
    }
  }, [selectedClass]);

  const loadQuarters = async () => {
    try {
      const response = await quarterService.getAll();
      const allQuarters = Array.isArray(response) ? response : (response.data || []);
      const quartersList = allQuarters.filter(q =>
        q.year === 2026
      );
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
    } catch (error) {
      console.error('Failed to load classes:', error);
      setClasses([]);
    }
  };

  const loadPerformanceData = async () => {
    if (!selectedClass) return;
    setLoading(true);

    try {
      // Get weekly data
      const response = await weeklyDataService.getByClass(selectedClass);
      const weeklyData = (Array.isArray(response) ? response : (response.data || []))
        .sort((a, b) => a.week_number - b.week_number);

      // Get payment totals per week from member_payment_history
      const weeklyPayments = {};
      try {
        const totalsResponse = await paymentService.getClassPaymentTotals(selectedClass, selectedQuarter);
        const members = Array.isArray(totalsResponse) ? totalsResponse : (totalsResponse.data || []);
        // Calculate total payments for the class
        let total = 0;
        members.forEach(member => {
          const t = member.totals || {};
          total += (t.lesson_english || 0) + (t.lesson_luganda || 0) +
            (t.morning_watch_english || 0) + (t.morning_watch_luganda || 0);
        });
        // Distribute evenly across weeks for display
        weeklyPayments.total = total;
        weeklyPayments.perWeek = weeklyData.length > 0 ? total / weeklyData.length : 0;
      } catch (err) {
        console.error('Could not load payment totals:', err);
      }

      const performance = weeklyData.map((week, index) => {
        const previousWeek = index > 0 ? weeklyData[index - 1] : null;

        const currentAttendance = parseInt(week.total_attendance) || 0;
        const currentOffering = parseFloat(week.offering_global_mission) || 0;
        const currentVisits = parseInt(week.member_visits) || 0;
        const currentBibleStudies = parseInt(week.members_conducted_bible_studies) || 0;
        const currentVisitors = parseInt(week.number_of_visitors) || 0;
        const currentTotalPayments = Math.round(weeklyPayments.perWeek || 0);

        let changes = {};
        if (previousWeek) {
          const prevAttendance = parseInt(previousWeek.total_attendance) || 0;
          const prevOffering = parseFloat(previousWeek.offering_global_mission) || 0;
          const prevVisits = parseInt(previousWeek.member_visits) || 0;
          const prevBibleStudies = parseInt(previousWeek.members_conducted_bible_studies) || 0;
          const prevVisitors = parseInt(previousWeek.number_of_visitors) || 0;

          changes = {
            attendance: currentAttendance - prevAttendance,
            attendancePercent: prevAttendance > 0
              ? ((currentAttendance - prevAttendance) / prevAttendance * 100).toFixed(1) : 0,
            offering: currentOffering - prevOffering,
            offeringPercent: prevOffering > 0
              ? ((currentOffering - prevOffering) / prevOffering * 100).toFixed(1) : 0,
            visits: currentVisits - prevVisits,
            bibleStudies: currentBibleStudies - prevBibleStudies,
            visitors: currentVisitors - prevVisitors,
            totalPayments: 0,
            totalPaymentsPercent: 0,
          };
        }

        return {
          week_number: week.week_number,
          sabbath_date: week.sabbath_date,
          attendance: currentAttendance,
          offering: currentOffering,
          visits: currentVisits,
          bibleStudies: currentBibleStudies,
          visitors: currentVisitors,
          totalPayments: currentTotalPayments,
          changes,
          hasComparison: !!previousWeek,
        };
      });

      if (performance.length === 0) {
        setPerformanceData(null);
        setLoading(false);
        return;
      }

      const totalWeeks = performance.length;
      const avgAttendance = performance.reduce((sum, p) => sum + p.attendance, 0) / totalWeeks;
      const avgOffering = performance.reduce((sum, p) => sum + p.offering, 0) / totalWeeks;
      const totalOffering = performance.reduce((sum, p) => sum + p.offering, 0);
      const totalPayments = weeklyPayments.total || 0;

      const bestAttendance = performance.reduce((max, p) => p.attendance > max.attendance ? p : max, performance[0]);
      const worstAttendance = performance.reduce((min, p) => p.attendance < min.attendance ? p : min, performance[0]);
      const bestOffering = performance.reduce((max, p) => p.offering > max.offering ? p : max, performance[0]);

      setPerformanceData({
        performance,
        stats: {
          totalWeeks,
          avgAttendance: avgAttendance.toFixed(1),
          avgOffering: avgOffering.toFixed(0),
          totalOffering,
          totalPayments,
          bestAttendance,
          worstAttendance,
          bestOffering,
        },
      });
    } catch (error) {
      console.error('Error loading performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (value) => {
    if (value > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (value < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const getTrendColor = (value) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading performance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Performance Comparison</h1>
            <p className="text-indigo-100">Analyze week-over-week performance trends and growth</p>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-2 px-4 py-2 bg-white text-indigo-600 rounded-lg hover:bg-indigo-50 transition"
          >
            <Download className="h-5 w-5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Select Quarter</label>
            <select
              value={selectedQuarter}
              onChange={(e) => setSelectedQuarter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Choose Quarter</option>
              {quarters.map((quarter) => (
                <option key={quarter.id} value={quarter.id}>
                  {quarter.name} {quarter.year} {quarter.is_active ? '(Active)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Select Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Choose a class</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>{cls.class_name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {!selectedClass && (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
          Select a quarter and class to view performance data.
        </div>
      )}

      {selectedClass && !performanceData && !loading && (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
          No weekly data submitted for this class yet.
        </div>
      )}

      {performanceData && (
        <>
          {/* Summary Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
              <p className="text-sm text-gray-600 mb-1">Average Attendance</p>
              <p className="text-3xl font-bold text-gray-900">{performanceData.stats.avgAttendance}</p>
              <p className="text-xs text-gray-500 mt-1">per week</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
              <p className="text-sm text-gray-600 mb-1">Average Offering</p>
              <p className="text-3xl font-bold text-gray-900">
                {parseFloat(performanceData.stats.avgOffering).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">UGX per week</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
              <p className="text-sm text-gray-600 mb-1">Total Offering</p>
              <p className="text-3xl font-bold text-gray-900">
                {performanceData.stats.totalOffering.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">UGX</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
              <p className="text-sm text-gray-600 mb-1">Total Payments</p>
              <p className="text-3xl font-bold text-gray-900">
                {performanceData.stats.totalPayments.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">UGX</p>
            </div>
          </div>

          {/* Best/Worst Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center space-x-2 mb-3">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-gray-900">Best Attendance</h3>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {performanceData.stats.bestAttendance.attendance}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Week {performanceData.stats.bestAttendance.week_number} — {formatDate(performanceData.stats.bestAttendance.sabbath_date)}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center space-x-2 mb-3">
                <TrendingDown className="h-5 w-5 text-red-600" />
                <h3 className="font-semibold text-gray-900">Lowest Attendance</h3>
              </div>
              <p className="text-2xl font-bold text-red-600">
                {performanceData.stats.worstAttendance.attendance}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Week {performanceData.stats.worstAttendance.week_number} — {formatDate(performanceData.stats.worstAttendance.sabbath_date)}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center space-x-2 mb-3">
                <BarChart3 className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-gray-900">Best Offering</h3>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {performanceData.stats.bestOffering.offering.toLocaleString()} UGX
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Week {performanceData.stats.bestOffering.week_number} — {formatDate(performanceData.stats.bestOffering.sabbath_date)}
              </p>
            </div>
          </div>

          {/* Week-by-Week Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Week-by-Week Performance</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Week</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Attendance</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Change</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Offering</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Change</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Visits</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Bible Studies</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Visitors</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {performanceData.performance.map((week, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-full">
                          Week {week.week_number}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(week.sabbath_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                        {week.attendance}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        {week.hasComparison ? (
                          <div className="flex items-center justify-end space-x-1">
                            {getTrendIcon(week.changes.attendance)}
                            <span className={`font-semibold ${getTrendColor(week.changes.attendance)}`}>
                              {week.changes.attendance > 0 ? '+' : ''}{week.changes.attendance}
                            </span>
                            <span className={`text-xs ${getTrendColor(week.changes.attendance)}`}>
                              ({week.changes.attendancePercent}%)
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-green-600">
                        {week.offering.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        {week.hasComparison ? (
                          <div className="flex items-center justify-end space-x-1">
                            {getTrendIcon(week.changes.offering)}
                            <span className={`font-semibold ${getTrendColor(week.changes.offering)}`}>
                              {week.changes.offering > 0 ? '+' : ''}{week.changes.offering.toLocaleString()}
                            </span>
                            <span className={`text-xs ${getTrendColor(week.changes.offering)}`}>
                              ({week.changes.offeringPercent}%)
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        {week.visits}
                        {week.hasComparison && week.changes.visits !== 0 && (
                          <span className={`ml-2 text-xs ${getTrendColor(week.changes.visits)}`}>
                            ({week.changes.visits > 0 ? '+' : ''}{week.changes.visits})
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        {week.bibleStudies}
                        {week.hasComparison && week.changes.bibleStudies !== 0 && (
                          <span className={`ml-2 text-xs ${getTrendColor(week.changes.bibleStudies)}`}>
                            ({week.changes.bibleStudies > 0 ? '+' : ''}{week.changes.bibleStudies})
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        {week.visitors}
                        {week.hasComparison && week.changes.visitors !== 0 && (
                          <span className={`ml-2 text-xs ${getTrendColor(week.changes.visitors)}`}>
                            ({week.changes.visitors > 0 ? '+' : ''}{week.changes.visitors})
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PerformanceComparison;