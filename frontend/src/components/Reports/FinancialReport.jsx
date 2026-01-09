import React, { useState, useEffect } from 'react';
import quarterService from '../../services/quarterService';
import weeklyDataService from '../../services/WeeklyDataService';
import classService from '../../services/classService';
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
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedQuarter) {
      generateReport();
    }
  }, [selectedQuarter, selectedClass]);

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

  const parsePaymentAmount = (paymentString, memberName = null) => {
    if (!paymentString || paymentString.trim() === '') return 0;
    
    let total = 0;
    const entries = paymentString.split(',').map(s => s.trim()).filter(Boolean);
    
    entries.forEach(entry => {
      const [name, amount] = entry.split(':').map(s => s.trim());
      if (amount) {
        const numAmount = parseFloat(amount);
        if (!isNaN(numAmount)) {
          if (memberName) {
            // If looking for specific member
            if (name === memberName) {
              total += numAmount;
            }
          } else {
            // Sum all payments
            total += numAmount;
          }
        }
      }
    });
    
    return total;
  };

  const generateReport = async () => {
    if (!selectedQuarter) return;

    setLoading(true);
    try {
      // Filter classes by quarter and optionally by selected class
      const filteredClasses = classes.filter(cls => {
        const matchesQuarter = cls.quarter_id === selectedQuarter;
        const matchesClass = !selectedClass || cls.id === selectedClass;
        return matchesQuarter && matchesClass;
      });

      let totalOfferings = 0;
      let totalLessonEnglish = 0;
      let totalLessonLuganda = 0;
      let totalMorningWatchEnglish = 0;
      let totalMorningWatchLuganda = 0;
      let memberPayments = {};

      const classBreakdown = [];

      for (const cls of filteredClasses) {
        const weeklyDataResponse = await weeklyDataService.getByClass(cls.id);
        const weeklyData = weeklyDataResponse.data || [];

        let classOfferings = 0;
        let classLessonEnglish = 0;
        let classLessonLuganda = 0;
        let classMorningWatchEnglish = 0;
        let classMorningWatchLuganda = 0;

        weeklyData.forEach(week => {
          // Sum offerings (numeric field)
          classOfferings += parseFloat(week.offering_global_mission) || 0;

          // Parse payment strings
          classLessonEnglish += parsePaymentAmount(week.members_paid_lesson_english);
          classLessonLuganda += parsePaymentAmount(week.members_paid_lesson_luganda);
          classMorningWatchEnglish += parsePaymentAmount(week.members_paid_morning_watch_english);
          classMorningWatchLuganda += parsePaymentAmount(week.members_paid_morning_watch_luganda);
        });

        totalOfferings += classOfferings;
        totalLessonEnglish += classLessonEnglish;
        totalLessonLuganda += classLessonLuganda;
        totalMorningWatchEnglish += classMorningWatchEnglish;
        totalMorningWatchLuganda += classMorningWatchLuganda;

        classBreakdown.push({
          className: cls.class_name,
          offerings: classOfferings,
          lessonEnglish: classLessonEnglish,
          lessonLuganda: classLessonLuganda,
          morningWatchEnglish: classMorningWatchEnglish,
          morningWatchLuganda: classMorningWatchLuganda,
          total: classOfferings + classLessonEnglish + classLessonLuganda + 
                 classMorningWatchEnglish + classMorningWatchLuganda
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
        classBreakdown
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
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
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
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Filter by Class (Optional)
            </label>
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
        </div>
      </div>

      {reportData && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard
              icon={DollarSign}
              title="Total Collected"
              value={reportData.grandTotal}
              subtitle="All contributions"
              color="#10b981"
            />
            <StatCard
              icon={TrendingUp}
              title="Global Mission"
              value={reportData.totalOfferings}
              subtitle="Sabbath offerings"
              color="#3b82f6"
            />
            <StatCard
              icon={Users}
              title="Lesson Payments"
              value={reportData.totalLessonPayments}
              subtitle="Members"
              color="#f59e0b"
            />
            <StatCard
              icon={FileText}
              title="Morning Watch"
              value={reportData.totalMorningWatchPayments}
              subtitle="Members"
              color="#8b5cf6"
            />
          </div>

          {/* Contribution Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contribution Breakdown</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Global Mission Offerings</span>
                  <span className="text-lg font-bold text-blue-700">
                    {reportData.totalOfferings.toLocaleString()} UGX
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Lesson (English)</span>
                  <span className="text-lg font-bold text-green-700">
                    {reportData.totalLessonEnglish.toLocaleString()} UGX
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Lesson (Luganda)</span>
                  <span className="text-lg font-bold text-blue-700">
                    {reportData.totalLessonLuganda.toLocaleString()} UGX
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Morning Watch (English)</span>
                  <span className="text-lg font-bold text-purple-700">
                    {reportData.totalMorningWatchEnglish.toLocaleString()} UGX
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Morning Watch (Luganda)</span>
                  <span className="text-lg font-bold text-orange-700">
                    {reportData.totalMorningWatchLuganda.toLocaleString()} UGX
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Summary</h3>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Global Mission Offerings</span>
                    <span className="font-semibold">{reportData.totalOfferings.toLocaleString()} UGX</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Class
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Offerings
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lesson (Eng)
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lesson (Lug)
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        MW (Eng)
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        MW (Lug)
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.classBreakdown.map((cls, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {cls.className}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          {cls.offerings.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          {cls.lessonEnglish.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          {cls.lessonLuganda.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          {cls.morningWatchEnglish.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          {cls.morningWatchLuganda.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                          {cls.total.toLocaleString()} UGX
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 font-bold">
                    <tr>
                      <td className="px-6 py-4 text-sm text-gray-700">TOTAL</td>
                      <td className="px-6 py-4 text-sm text-right text-gray-900">
                        {reportData.totalOfferings.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-gray-900">
                        {reportData.totalLessonEnglish.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-gray-900">
                        {reportData.totalLessonLuganda.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-gray-900">
                        {reportData.totalMorningWatchEnglish.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-gray-900">
                        {reportData.totalMorningWatchLuganda.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-green-700 text-lg">
                        {reportData.grandTotal.toLocaleString()} UGX
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FinancialReport;