import React, { useState, useEffect } from 'react';
import reportService from '../../services/reportService';
import quarterService from '../../services/quarterService';
import classService from '../../services/classService';
import { 
  FileText, 
  Calendar, 
  Users, 
  TrendingUp, 
  DollarSign,
  Download,
  AlertCircle
} from 'lucide-react';

const QuarterlyReport = () => {
  const [quarters, setQuarters] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedQuarter, setSelectedQuarter] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('class'); // 'class' or 'church'

  useEffect(() => {
    loadQuarters();
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedQuarter) {
      if (viewMode === 'class' && selectedClass) {
        loadClassReport();
      } else if (viewMode === 'church') {
        loadChurchReport();
      }
    }
  }, [selectedQuarter, selectedClass, viewMode]);

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
      const response = await classService.getAll();
      setClasses(response.data);
    } catch (error) {
      setError('Failed to load classes');
    }
  };

  const loadClassReport = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await reportService.getClassQuarterlyReport(selectedClass);
      setReportData(response.data);
    } catch (error) {
      setError('Failed to load quarterly report');
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
      setError('Failed to load church quarterly report');
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
          <p className="text-gray-600 mt-1">View complete quarter statistics</p>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">View Mode</label>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              className="input"
            >
              <option value="class">Single Class Report</option>
              <option value="church">Entire Church Report</option>
            </select>
          </div>

          <div>
            <label className="label">Select Quarter</label>
            <select
              value={selectedQuarter}
              onChange={(e) => setSelectedQuarter(e.target.value)}
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

          {viewMode === 'class' && (
            <div>
              <label className="label">Select Class</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="input"
              >
                <option value="">Choose Class</option>
                {classes
                  .filter(cls => cls.quarter_id === selectedQuarter)
                  .map(cls => (
                    <option key={cls.id} value={cls.id}>
                      {cls.class_name}
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {reportData && viewMode === 'class' && (
        <>
          {/* Class Report Header for Print */}
          <div className="hidden print:block mb-8 text-center">
            <h1 className="text-2xl font-bold">Kanyanya Seventh-day Adventist Church</h1>
            <h2 className="text-xl mt-2">Sabbath School Quarterly Report</h2>
            <p className="text-gray-600 mt-1">
              {selectedQuarterObj?.name} {selectedQuarterObj?.year}
            </p>
            <p className="text-gray-600">
              Class: {reportData.class.class_name} - Teacher: {reportData.class.teacher_name}
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Attendance</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {reportData.totals.total_attendance}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Avg: {reportData.averages.avg_attendance}
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Offerings (UGX)</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {reportData.totals.total_offerings.toLocaleString()}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Bible Studies</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {reportData.totals.total_bible_studies}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Weeks Reported</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {reportData.totals.weeks_reported}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">out of 13</p>
                </div>
                <Calendar className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </div>

          {/* Weekly Data Table */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-6">Week by Week Data</h2>
            
            {reportData.weekly_data.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No data available for this quarter</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Week</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Offering (UGX)</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Attendance</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Visits</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Bible Studies</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Visitors</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.weekly_data.map((week, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-full">
                            Week {week.week_number}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(week.sabbath_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-green-600">
                          {parseFloat(week.offering_global_mission || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-900">
                          {week.total_attendance}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">
                          {week.member_visits}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">
                          {week.members_conducted_bible_studies}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">
                          {week.number_of_visitors}
                        </td>
                      </tr>
                    ))}
                    {/* Totals Row */}
                    <tr className="bg-gray-50 font-semibold">
                      <td colSpan="2" className="px-6 py-4 text-left text-sm text-gray-900 uppercase">
                        Total
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-green-700">
                        {reportData.totals.total_offerings.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                        {reportData.totals.total_attendance}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                        {reportData.totals.total_visits}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                        {reportData.totals.total_bible_studies}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                        {reportData.totals.total_visitors}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {reportData && viewMode === 'church' && (
        <>
          {/* Church Report Header for Print */}
          <div className="hidden print:block mb-8 text-center">
            <h1 className="text-2xl font-bold">Kanyanya Seventh-day Adventist Church</h1>
            <h2 className="text-xl mt-2">Church-Wide Quarterly Report</h2>
            <p className="text-gray-600 mt-1">
              {selectedQuarterObj?.name} {selectedQuarterObj?.year}
            </p>
          </div>

          {/* Church Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Classes</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {reportData.total_classes}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
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
                  <p className="text-sm text-gray-600">Total Offerings (UGX)</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {reportData.church_totals.total_offerings.toLocaleString()}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-600" />
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
                <TrendingUp className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </div>

          {/* Class Summaries Table */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-6">Class Summaries</h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teacher</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Weeks Reported</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Attendance</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avg Attendance</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.classes.map((classData, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {classData.class_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {classData.teacher_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                        {classData.weeks_reported}/13
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                        {classData.total_attendance}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-600">
                        {classData.avg_attendance}
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

export default QuarterlyReport;