// src/components/Reports/FinancialReport.jsx
import React, { useState, useEffect } from 'react';
import reportService from '../../services/reportService';
import quarterService from '../../services/quarterService';
import classService from '../../services/classService';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { 
  DollarSign, 
  Download,
  TrendingUp,
  BookOpen,
  AlertCircle
} from 'lucide-react';

const FinancialReport = () => {
  const [quarters, setQuarters] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedQuarter, setSelectedQuarter] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  useEffect(() => {
    loadQuarters();
  }, []);

  useEffect(() => {
    if (selectedQuarter) {
      loadClasses();
      loadReport();
    }
  }, [selectedQuarter, selectedClass]);

  const loadQuarters = async () => {
    try {
      const response = await quarterService.getAll();
      setQuarters(response.data);
      
      const activeQuarter = response.data.find(q => q.is_active);
      if (activeQuarter) {
        setSelectedQuarter(activeQuarter.id);
      } else if (response.data.length > 0) {
        setSelectedQuarter(response.data[0].id);
      }
    } catch (error) {
      setError('Failed to load quarters');
    }
  };

  const loadClasses = async () => {
    try {
      const response = await classService.getAll(selectedQuarter);
      setClasses(response.data);
    } catch (error) {
      console.error('Failed to load classes');
    }
  };

  const loadReport = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await reportService.getFinancialReport(
        selectedQuarter,
        selectedClass || undefined
      );
      setReportData(response.data);
    } catch (error) {
      setError('Failed to load financial report');
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const selectedQuarterObj = quarters.find(q => q.id === selectedQuarter);
  const selectedClassObj = classes.find(c => c.id === selectedClass);

  const getPieChartData = () => {
    if (!reportData?.financials) return [];
    
    return [
      { name: 'Global Mission', value: reportData.financials.global_mission },
      { name: 'Lesson Payments', value: reportData.financials.lesson_payments },
      { name: 'Morning Watch', value: reportData.financials.morning_watch_payments }
    ].filter(item => item.value > 0);
  };

  if (loading && !reportData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Report</h1>
          <p className="text-gray-600 mt-1">Track offerings and financial contributions</p>
        </div>
        <button
          onClick={handlePrint}
          className="btn-primary flex items-center space-x-2 print:hidden"
        >
          <Download className="h-5 w-5" />
          <span>Print Report</span>
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-6 print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Select Quarter</label>
            <select
              value={selectedQuarter}
              onChange={(e) => {
                setSelectedQuarter(e.target.value);
                setSelectedClass('');
              }}
              className="input"
            >
              <option value="">Choose Quarter</option>
              {quarters.map(quarter => (
                <option key={quarter.id} value={quarter.id}>
                  {quarter.name} {quarter.year} {quarter.is_active ? '(Active)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Filter by Class (Optional)</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="input"
            >
              <option value="">All Classes</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.class_name}
                </option>
              ))}
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

      {reportData && (
        <>
          {/* Print Header */}
          <div className="hidden print:block mb-8 text-center">
            <h1 className="text-2xl font-bold">Kanyanya Seventh-day Adventist Church</h1>
            <h2 className="text-xl mt-2">Sabbath School Financial Report</h2>
            <p className="text-gray-600 mt-1">
              {selectedQuarterObj?.name} {selectedQuarterObj?.year}
              {selectedClassObj && ` - ${selectedClassObj.class_name}`}
            </p>
          </div>

          {/* Financial Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700 font-medium">Total Collected</p>
                  <p className="text-3xl font-bold text-blue-900">
                    {reportData.financials.total.toLocaleString()}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">UGX</p>
                </div>
                <DollarSign className="h-10 w-10 text-blue-600" />
              </div>
            </div>

            <div className="card bg-gradient-to-br from-green-50 to-green-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700 font-medium">Global Mission</p>
                  <p className="text-3xl font-bold text-green-900">
                    {reportData.financials.global_mission.toLocaleString()}
                  </p>
                  <p className="text-xs text-green-600 mt-1">UGX</p>
                </div>
                <TrendingUp className="h-10 w-10 text-green-600" />
              </div>
            </div>

            <div className="card bg-gradient-to-br from-orange-50 to-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-700 font-medium">Lesson Payments</p>
                  <p className="text-3xl font-bold text-orange-900">
                    {reportData.financials.lesson_payments}
                  </p>
                  <p className="text-xs text-orange-600 mt-1">Members</p>
                </div>
                <BookOpen className="h-10 w-10 text-orange-600" />
              </div>
            </div>

            <div className="card bg-gradient-to-br from-purple-50 to-purple-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-700 font-medium">Morning Watch</p>
                  <p className="text-3xl font-bold text-purple-900">
                    {reportData.financials.morning_watch_payments}
                  </p>
                  <p className="text-xs text-purple-600 mt-1">Members</p>
                </div>
                <BookOpen className="h-10 w-10 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Pie Chart */}
            {getPieChartData().length > 0 && (
              <div className="card print:hidden">
                <h2 className="text-xl font-semibold mb-6">Contribution Breakdown</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={getPieChartData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getPieChartData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value.toLocaleString()} UGX`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Summary Table */}
            <div className="card">
              <h2 className="text-xl font-semibold mb-6">Financial Summary</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Global Mission Offerings</span>
                  <span className="text-lg font-bold text-blue-900">
                    {reportData.financials.global_mission.toLocaleString()} UGX
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Lesson Payments (Count)</span>
                  <span className="text-lg font-bold text-gray-900">
                    {reportData.financials.lesson_payments} members
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Morning Watch Payments (Count)</span>
                  <span className="text-lg font-bold text-gray-900">
                    {reportData.financials.morning_watch_payments} members
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg border-2 border-primary-200">
                  <span className="text-base font-bold text-gray-900">TOTAL CONTRIBUTIONS</span>
                  <span className="text-2xl font-bold text-primary-900">
                    {reportData.financials.total.toLocaleString()} UGX
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Breakdown Table */}
          {reportData.breakdown && reportData.breakdown.length > 0 && (
            <div className="card">
              <h2 className="text-xl font-semibold mb-6">Weekly Breakdown</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Week</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      {!selectedClass && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                      )}
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Global Mission</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Lesson</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Morning Watch</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.breakdown.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          Week {item.week_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(item.sabbath_date).toLocaleDateString()}
                        </td>
                        {!selectedClass && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {item.class_name}
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                          {item.offering_global_mission.toLocaleString()} UGX
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">
                          {item.lesson_payments}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">
                          {item.morning_watch_payments}
                        </td>
                      </tr>
                    ))}
                    {/* Totals Row */}
                    <tr className="bg-gray-50 font-semibold">
                      <td colSpan={selectedClass ? 2 : 3} className="px-6 py-4 text-sm text-gray-900">
                        TOTALS
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        {reportData.financials.global_mission.toLocaleString()} UGX
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                        {reportData.financials.lesson_payments}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                        {reportData.financials.morning_watch_payments}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Notes Section */}
          <div className="card mt-6 bg-blue-50 border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Financial Notes</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• Global Mission offerings are monetary contributions in Uganda Shillings (UGX)</li>
              <li>• Lesson and Morning Watch figures represent the number of members who paid</li>
              <li>• All amounts are cumulative for the selected period</li>
              <li>• For detailed payment tracking, contact your church treasurer</li>
            </ul>
          </div>
        </>
      )}

      {!reportData && !loading && (
        <div className="text-center py-12">
          <DollarSign className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">Select a quarter to view financial report</p>
        </div>
      )}
    </div>
  );
};

export default FinancialReport;