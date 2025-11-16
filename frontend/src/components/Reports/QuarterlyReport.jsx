
import React, { useState, useEffect } from 'react';
import reportService from '../../services/reportService';
import quarterService from '../../services/quarterService';
import classService from '../../services/classService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { 
  FileText, 
  Download,
  TrendingUp,
  Users,
  BookOpen,
  AlertCircle
} from 'lucide-react';

const QuarterlyReport = () => {
  const [quarters, setQuarters] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedQuarter, setSelectedQuarter] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadQuarters();
  }, []);

  useEffect(() => {
    if (selectedQuarter) {
      loadClasses();
      if (selectedClass !== 'all') {
        loadClassReport();
      } else {
        loadChurchReport();
      }
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

  const loadClassReport = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await reportService.getClassQuarterlyReport(selectedClass);
      setReportData(response.data);
    } catch (error) {
      setError('Failed to load class report');
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const loadChurchReport = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await reportService.getChurchQuarterlyReport(selectedQuarter);
      setReportData(response.data);
    } catch (error) {
      setError('Failed to load church report');
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const selectedQuarterObj = quarters.find(q => q.id === selectedQuarter);

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
          <h1 className="text-3xl font-bold text-gray-900">Quarterly Report</h1>
          <p className="text-gray-600 mt-1">Complete quarterly summary and analysis</p>
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
                setSelectedClass('all');
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
            <label className="label">Select Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="input"
            >
              <option value="all">All Classes (Church Summary)</option>
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
            <h2 className="text-xl mt-2">Sabbath School Quarterly Report</h2>
            <p className="text-gray-600 mt-1">
              {selectedQuarterObj?.name} {selectedQuarterObj?.year}
            </p>
          </div>

          {/* Church-Wide Summary */}
          {selectedClass === 'all' && reportData.church_totals && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Classes</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {reportData.total_classes}
                      </p>
                    </div>
                    <BookOpen className="h-8 w-8 text-blue-600" />
                  </div>
                </div>

                <div className="card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Attendance</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {reportData.church_totals.total_attendance}
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-green-600" />
                  </div>
                </div>

                <div className="card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Bible Studies</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {reportData.church_totals.total_bible_studies}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                  </div>
                </div>

                <div className="card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Offerings</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {reportData.church_totals.total_offerings.toLocaleString()} UGX
                      </p>
                    </div>
                    <FileText className="h-8 w-8 text-orange-600" />
                  </div>
                </div>
              </div>

              {/* Class Comparison Table */}
              <div className="card mb-8">
                <h2 className="text-xl font-semibold mb-6">Class Performance Summary</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Weeks</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Total Att.</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Avg Att.</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teacher</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.classes.map((cls, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {cls.class_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">
                            {cls.weeks_reported}/13
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                            {cls.total_attendance}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                            {cls.avg_attendance}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {cls.teacher_name}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Attendance Chart */}
              <div className="card print:hidden">
                <h2 className="text-xl font-semibold mb-6">Attendance Comparison</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={reportData.classes}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="class_name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="total_attendance" fill="#3b82f6" name="Total Attendance" />
                    <Bar dataKey="avg_attendance" fill="#10b981" name="Average Attendance" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}

          {/* Individual Class Report */}
          {selectedClass !== 'all' && reportData.class && (
            <>
              <div className="card mb-8">
                <div className="border-b pb-4 mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">{reportData.class.class_name}</h2>
                  <div className="mt-2 space-y-1 text-sm text-gray-600">
                    <p>Teacher: {reportData.class.teacher_name}</p>
                    <p>Secretary: {reportData.class.secretary_name}</p>
                    <p>Quarter: {reportData.class.quarter.name} {reportData.class.quarter.year}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Weeks Reported</p>
                    <p className="text-3xl font-bold text-gray-900">{reportData.totals.weeks_reported}/13</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Attendance</p>
                    <p className="text-3xl font-bold text-gray-900">{reportData.totals.total_attendance}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Avg Attendance</p>
                    <p className="text-3xl font-bold text-gray-900">{reportData.averages.avg_attendance}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Offerings</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {reportData.totals.total_offerings.toLocaleString()} UGX
                    </p>
                  </div>
                </div>
              </div>

              {/* Detailed Metrics */}
              <div className="card mb-8">
                <h3 className="text-lg font-semibold mb-4">Activity Metrics</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Member Visits</p>
                    <p className="text-2xl font-bold text-gray-900">{reportData.totals.total_visits}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Bible Studies</p>
                    <p className="text-2xl font-bold text-gray-900">{reportData.totals.total_bible_studies}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Helped Others</p>
                    <p className="text-2xl font-bold text-gray-900">{reportData.totals.total_helped_others}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Studied Lesson</p>
                    <p className="text-2xl font-bold text-gray-900">{reportData.totals.total_studied_lesson}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Visitors</p>
                    <p className="text-2xl font-bold text-gray-900">{reportData.totals.total_visitors}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Guides Distributed</p>
                    <p className="text-2xl font-bold text-gray-900">{reportData.totals.total_guides_distributed}</p>
                  </div>
                </div>
              </div>

              {/* Weekly Breakdown */}
              {reportData.weekly_data && reportData.weekly_data.length > 0 && (
                <div className="card print:hidden">
                  <h3 className="text-lg font-semibold mb-4">Weekly Attendance Trend</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={reportData.weekly_data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week_number" label={{ value: 'Week', position: 'insideBottom', offset: -5 }} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="total_attendance" fill="#3b82f6" name="Attendance" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default QuarterlyReport;