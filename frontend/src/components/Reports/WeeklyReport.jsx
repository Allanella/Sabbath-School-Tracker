import React, { useState, useEffect } from 'react';
import reportService from '../../services/reportService';
import quarterService from '../../services/quarterService';
import { 
  FileText, 
  Calendar, 
  Users, 
  TrendingUp, 
  DollarSign,
  Download,
  AlertCircle
} from 'lucide-react';

const WeeklyReport = () => {
  const [quarters, setQuarters] = useState([]);
  const [selectedQuarter, setSelectedQuarter] = useState('');
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadQuarters();
  }, []);

  useEffect(() => {
    if (selectedQuarter) {
      loadReport();
    }
  }, [selectedQuarter, selectedWeek]);

  const loadQuarters = async () => {
    try {
      const response = await quarterService.getAll();
      setQuarters(response.data);
      
      // Set active quarter as default
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

  const loadReport = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await reportService.getWeeklyReport(selectedQuarter, selectedWeek);
      setReportData(response.data);
    } catch (error) {
      setError('Failed to load weekly report');
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
          <h1 className="text-3xl font-bold text-gray-900">Weekly Report</h1>
          <p className="text-gray-600 mt-1">View attendance and activities for a specific week</p>
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

          <div>
            <label className="label">Select Week</label>
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(Number(e.target.value))}
              className="input"
            >
              {[...Array(13)].map((_, i) => (
                <option key={i + 1} value={i + 1}>Week {i + 1}</option>
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
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Classes Reported</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {reportData.summary.classes_count}
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
                    {reportData.summary.total_attendance}
                  </p>
                </div>
                <Users className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Visitors</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {reportData.summary.total_visitors}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Offerings (UGX)</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {reportData.summary.total_offerings.toLocaleString()}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </div>

          {/* Report Header for Print */}
          <div className="hidden print:block mb-8 text-center">
            <h1 className="text-2xl font-bold">Kanyanya Seventh-day Adventist Church</h1>
            <h2 className="text-xl mt-2">Sabbath School Weekly Report</h2>
            <p className="text-gray-600 mt-1">
              {selectedQuarterObj?.name} {selectedQuarterObj?.year} - Week {selectedWeek}
            </p>
            {reportData.classes[0] && (
              <p className="text-gray-600">
                Sabbath Date: {new Date(reportData.classes[0].sabbath_date).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Detailed Class Reports */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-6">Class Details</h2>
            
            {reportData.classes.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No data submitted for this week yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class Name</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Offering (UGX)</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Attendance</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Visits</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Bible Studies</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Visitors</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.classes.map((classData, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {classData.class.class_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              Teacher: {classData.class.teacher_name}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-green-600">
                          {parseFloat(classData.offering_global_mission || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-900">
                          {classData.total_attendance}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">
                          {classData.member_visits}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">
                          {classData.members_conducted_bible_studies}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">
                          {classData.number_of_visitors}
                        </td>
                      </tr>
                    ))}
                    {/* Totals Row */}
                    <tr className="bg-gray-50 font-semibold">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        TOTALS
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-green-700">
                        {reportData.summary.total_offerings.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                        {reportData.summary.total_attendance}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                        {reportData.summary.total_visits}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                        {reportData.summary.total_bible_studies || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                        {reportData.summary.total_visitors}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Secretary Notes */}
          {reportData.classes.some(c => c.members_summary) && (
            <div className="card mt-6">
              <h2 className="text-xl font-semibold mb-4">Secretary Notes</h2>
              <div className="space-y-4">
                {reportData.classes.map((classData, index) => (
                  classData.members_summary && (
                    <div key={index} className="border-b border-gray-200 pb-4 last:border-0">
                      <h3 className="font-medium text-gray-900 mb-2">
                        {classData.class.class_name}
                      </h3>
                      <div className="mb-2">
                        <p className="text-sm font-medium text-gray-700">Notes:</p>
                        <p className="text-sm text-gray-600">{classData.members_summary}</p>
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WeeklyReport;