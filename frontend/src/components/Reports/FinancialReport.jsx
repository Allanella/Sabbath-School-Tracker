import React, { useState, useEffect } from 'react';
import quarterService from '../../services/quarterService';
import classService from '../../services/classService';
import paymentService from '../../services/paymentService';
import weeklyDataService from '../../services/WeeklyDataService';
import { DollarSign, TrendingUp, Users, FileText, Download } from 'lucide-react';

const FinancialReport = () => {
  const [quarters, setQuarters] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedQuarter, setSelectedQuarter] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
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
    if (selectedQuarter) {
      generateReport(selectedQuarter, selectedClass);
    }
  }, [selectedQuarter, selectedClass]);

  const loadQuarters = async () => {
    try {
      const response = await quarterService.getAll();
      const allQuarters = Array.isArray(response) ? response : (response.data || []);
      const quartersList = allQuarters.filter(q =>
        q.year === 2026 && (q.name === 'Q1' || q.name === 'Q2')
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

  const generateReport = async (quarterId, classId) => {
    if (!quarterId) return;
    setLoading(true);
    setReportData(null);

    try {
      // Get all classes for this quarter
      const classResponse = await classService.getAll(quarterId);
      const allClasses = Array.isArray(classResponse) ? classResponse : (classResponse.data || []);
      const filteredClasses = classId
        ? allClasses.filter(c => c.id === classId)
        : allClasses;

      let totalOfferings = 0;
      let totalLessonEnglish = 0;
      let totalLessonLuganda = 0;
      let totalMorningWatchEnglish = 0;
      let totalMorningWatchLuganda = 0;
      const classBreakdown = [];

      for (const cls of filteredClasses) {
        // Get payment totals for this class
        const totalsResponse = await paymentService.getClassPaymentTotals(cls.id, quarterId);
        const members = Array.isArray(totalsResponse)
          ? totalsResponse
          : (totalsResponse.data || []);

        let classLessonEnglish = 0;
        let classLessonLuganda = 0;
        let classMorningWatchEnglish = 0;
        let classMorningWatchLuganda = 0;
        let classOffering = 0;

        members.forEach(member => {
          const t = member.totals || {};
          classLessonEnglish += t.lesson_english || 0;
          classLessonLuganda += t.lesson_luganda || 0;
          classMorningWatchEnglish += t.morning_watch_english || 0;
          classMorningWatchLuganda += t.morning_watch_luganda || 0;
          classOffering += t.offering || 0;
        });

        // Also get offerings from weekly data
        const weeklyResponse = await weeklyDataService.getByClass(cls.id);
        const weeks = Array.isArray(weeklyResponse) ? weeklyResponse : (weeklyResponse.data || []);
        let weeklyOfferings = 0;
        weeks.forEach(w => {
          weeklyOfferings += parseFloat(w.offering_global_mission || 0);
        });

        // Use whichever offering source has data
        const finalOffering = weeklyOfferings > 0 ? weeklyOfferings : classOffering;

        totalLessonEnglish += classLessonEnglish;
        totalLessonLuganda += classLessonLuganda;
        totalMorningWatchEnglish += classMorningWatchEnglish;
        totalMorningWatchLuganda += classMorningWatchLuganda;
        totalOfferings += finalOffering;

        const classTotal = finalOffering + classLessonEnglish + classLessonLuganda +
          classMorningWatchEnglish + classMorningWatchLuganda;

        classBreakdown.push({
          className: cls.class_name,
          offerings: finalOffering,
          lessonEnglish: classLessonEnglish,
          lessonLuganda: classLessonLuganda,
          morningWatchEnglish: classMorningWatchEnglish,
          morningWatchLuganda: classMorningWatchLuganda,
          total: classTotal,
        });
      }

      const totalLessonPayments = totalLessonEnglish + totalLessonLuganda;
      const totalMorningWatchPayments = totalMorningWatchEnglish + totalMorningWatchLuganda;
      const grandTotal = totalOfferings + totalLessonPayments + totalMorningWatchPayments;

      setReportData({
        totalOfferings,
        totalLessonEnglish,
        totalLessonLuganda,
        totalMorningWatchEnglish,
        totalMorningWatchLuganda,
        totalLessonPayments,
        totalMorningWatchPayments,
        grandTotal,
        classBreakdown,
      });
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color }) => (
    <div className="bg-white rounded-lg shadow p-6 border-l-4" style={{ borderColor: color }}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()} UGX</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className="p-3 rounded-full" style={{ backgroundColor: `${color}20` }}>
          <Icon className="h-6 w-6" style={{ color }} />
        </div>
      </div>
    </div>
  );

  if (loading && !reportData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading financial report...</p>
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
            <h1 className="text-3xl font-bold mb-2">Financial Report</h1>
            <p className="text-green-100">Track offerings and financial contributions</p>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-2 px-4 py-2 bg-white text-green-600 rounded-lg hover:bg-green-50 transition"
          >
            <Download className="h-5 w-5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select Quarter
            </label>
            <select
              value={selectedQuarter}
              onChange={(e) => setSelectedQuarter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
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
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Filter by Class (Optional)
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Classes</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.class_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <span className="ml-3 text-gray-600">Calculating totals...</span>
        </div>
      )}

      {reportData && !loading && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard icon={DollarSign} title="Total Collected" value={reportData.grandTotal} subtitle="All contributions" color="#10b981" />
            <StatCard icon={TrendingUp} title="Global Mission" value={reportData.totalOfferings} subtitle="Sabbath offerings" color="#3b82f6" />
            <StatCard icon={Users} title="Lesson Payments" value={reportData.totalLessonPayments} subtitle="English + Luganda" color="#f59e0b" />
            <StatCard icon={FileText} title="Morning Watch" value={reportData.totalMorningWatchPayments} subtitle="English + Luganda" color="#8b5cf6" />
          </div>

          {/* Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contribution Breakdown</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Global Mission Offerings</span>
                  <span className="text-base font-bold text-blue-700">{reportData.totalOfferings.toLocaleString()} UGX</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Lesson (English)</span>
                  <span className="text-base font-bold text-green-700">{reportData.totalLessonEnglish.toLocaleString()} UGX</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Lesson (Luganda)</span>
                  <span className="text-base font-bold text-blue-700">{reportData.totalLessonLuganda.toLocaleString()} UGX</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Morning Watch (English)</span>
                  <span className="text-base font-bold text-purple-700">{reportData.totalMorningWatchEnglish.toLocaleString()} UGX</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Morning Watch (Luganda)</span>
                  <span className="text-base font-bold text-orange-700">{reportData.totalMorningWatchLuganda.toLocaleString()} UGX</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Summary</h3>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Global Mission Offerings</span>
                    <span className="font-semibold">{reportData.totalOfferings.toLocaleString()} UGX</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Lesson Payments</span>
                    <span className="font-semibold">{reportData.totalLessonPayments.toLocaleString()} UGX</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Morning Watch Payments</span>
                    <span className="font-semibold">{reportData.totalMorningWatchPayments.toLocaleString()} UGX</span>
                  </div>
                </div>
                <div className="p-6 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg text-white">
                  <p className="text-sm opacity-90 mb-1">Grand Total</p>
                  <p className="text-4xl font-bold">{reportData.grandTotal.toLocaleString()} UGX</p>
                </div>
              </div>
            </div>
          </div>

          {/* Class Breakdown Table */}
          {reportData.classBreakdown.length > 0 && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Class Breakdown</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Offerings</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Lesson (EN)</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Lesson (LG)</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">MW (EN)</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">MW (LG)</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.classBreakdown.map((cls, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{cls.className}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">{cls.offerings.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">{cls.lessonEnglish.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">{cls.lessonLuganda.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">{cls.morningWatchEnglish.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">{cls.morningWatchLuganda.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-green-700">
                          {cls.total.toLocaleString()} UGX
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 font-bold">
                    <tr>
                      <td className="px-6 py-4 text-sm text-gray-700">TOTAL</td>
                      <td className="px-6 py-4 text-sm text-right">{reportData.totalOfferings.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-right">{reportData.totalLessonEnglish.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-right">{reportData.totalLessonLuganda.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-right">{reportData.totalMorningWatchEnglish.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-right">{reportData.totalMorningWatchLuganda.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-right text-green-700 text-lg">
                        {reportData.grandTotal.toLocaleString()} UGX
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {reportData.classBreakdown.length === 0 && (
            <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
              No financial data found for the selected quarter.
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FinancialReport;