import React, { useState } from 'react';
import { Search, Users, Calendar, DollarSign, FileText, X, BookOpen } from 'lucide-react';
import weeklyDataService from '../../services/WeeklyDataService';
import classService from '../../services/classService';
import classMemberService from '../../services/classMemberService';
import paymentService from '../../services/paymentService';

const ClassSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedClassDetails, setSelectedClassDetails] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setMessage({ type: 'error', text: 'Please enter a class name' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await classService.search(searchTerm);
      const results = Array.isArray(response) ? response : (response.data || []);
      setSearchResults(results);

      if (results.length === 0) {
        setMessage({ type: 'info', text: 'No classes found matching that name' });
      } else if (results.length === 1) {
        await loadClassData(results[0]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setMessage({ type: 'error', text: 'Failed to search classes' });
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const loadClassData = async (classItem) => {
    try {
      setLoading(true);

      // Get weekly data for this class
      const weeklyDataResponse = await weeklyDataService.getByClass(classItem.id);
      const weeklyData = Array.isArray(weeklyDataResponse)
        ? weeklyDataResponse
        : (weeklyDataResponse.data || []);

      // Get members for this class
      const membersResponse = await classMemberService.getByClass(classItem.id);
      const members = Array.isArray(membersResponse)
        ? membersResponse
        : (membersResponse.data || []);

      // Calculate weekly stats
      let totalAttendance = 0, totalVisits = 0, totalBibleStudies = 0;
      let totalVisitors = 0, totalOfferings = 0;
      const weeksReported = weeklyData.length;

      weeklyData.forEach(week => {
        totalAttendance += parseInt(week.total_attendance) || 0;
        totalVisits += parseInt(week.member_visits) || 0;
        totalBibleStudies += parseInt(week.members_conducted_bible_studies) || 0;
        totalVisitors += parseInt(week.number_of_visitors) || 0;
        totalOfferings += parseFloat(week.offering_global_mission) || 0;
      });

      // Get payment totals from member_payment_totals (correct source)
      let totalLessonEnglish = 0, totalLessonLuganda = 0;
      let totalMorningWatchEnglish = 0, totalMorningWatchLuganda = 0;

      try {
        const quarterId = classItem.quarter_id;
        if (quarterId) {
          const totalsResponse = await paymentService.getClassPaymentTotals(classItem.id, quarterId);
          const memberTotals = Array.isArray(totalsResponse)
            ? totalsResponse
            : (totalsResponse.data || []);

          memberTotals.forEach(member => {
            const t = member.totals || {};
            totalLessonEnglish += t.lesson_english || 0;
            totalLessonLuganda += t.lesson_luganda || 0;
            totalMorningWatchEnglish += t.morning_watch_english || 0;
            totalMorningWatchLuganda += t.morning_watch_luganda || 0;
          });
        }
      } catch (err) {
        console.error('Could not load payment totals:', err);
      }

      weeklyData.sort((a, b) => a.week_number - b.week_number);

      setSelectedClassDetails({
        class: classItem,
        members,
        weeklyData,
        totals: {
          attendance: totalAttendance,
          visits: totalVisits,
          bibleStudies: totalBibleStudies,
          visitors: totalVisitors,
          offerings: totalOfferings,
          lessonEnglish: totalLessonEnglish,
          lessonLuganda: totalLessonLuganda,
          morningWatchEnglish: totalMorningWatchEnglish,
          morningWatchLuganda: totalMorningWatchLuganda,
          totalPayments: totalLessonEnglish + totalLessonLuganda +
            totalMorningWatchEnglish + totalMorningWatchLuganda,
          weeksReported,
          avgAttendance: weeksReported > 0
            ? (totalAttendance / weeksReported).toFixed(1)
            : 0,
        },
      });
      setSearchResults([]);
    } catch (err) {
      console.error('Error loading class data:', err);
      setMessage({ type: 'error', text: 'Failed to load class data' });
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setSelectedClassDetails(null);
    setMessage({ type: '', text: '' });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Class Search</h1>
        <p className="text-purple-100">Search for any class to view complete information and statistics</p>
      </div>

      {/* Search Box */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Enter class name, teacher, or secretary name"
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all"
            />
            {searchTerm && (
              <button onClick={clearSearch} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !searchTerm.trim()}
            className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition disabled:opacity-50 flex items-center space-x-2"
          >
            {loading
              ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              : <Search className="h-5 w-5" />}
            <span>{loading ? 'Searching...' : 'Search'}</span>
          </button>
        </div>
        {message.text && (
          <div className={`mt-4 p-4 rounded-lg border ${message.type === 'error'
            ? 'bg-red-50 border-red-200 text-red-800'
            : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
            {message.text}
          </div>
        )}
      </div>

      {/* Multiple Results */}
      {searchResults.length > 1 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Found {searchResults.length} matches
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {searchResults.map((cls, index) => (
              <button
                key={index}
                onClick={() => loadClassData(cls)}
                className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition text-left"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-purple-100 rounded-full">
                    <BookOpen className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{cls.class_name}</p>
                    <p className="text-sm text-gray-600">Teacher: {cls.teacher_name}</p>
                    <p className="text-xs text-gray-500">
                      {cls.quarter?.name} {cls.quarter?.year}
                    </p>
                  </div>
                </div>
                <span className="text-purple-600 font-medium">View →</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Class Details */}
      {selectedClassDetails && (
        <div className="space-y-6">
          {/* Class Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="p-4 bg-purple-100 rounded-full">
                <BookOpen className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedClassDetails.class.class_name}
                </h2>
                <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                  <span>👨‍🏫 Teacher: {selectedClassDetails.class.teacher_name}</span>
                  <span>📝 Secretary: {selectedClassDetails.class.secretary_name}</span>
                  <span>📅 Quarter: {selectedClassDetails.class.quarter?.name} {selectedClassDetails.class.quarter?.year}</span>
                </div>
              </div>
            </div>

            {/* Members Count */}
            <div className="mb-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-indigo-600" />
                  <span className="font-semibold text-gray-900">Class Members</span>
                </div>
                <span className="text-2xl font-bold text-indigo-600">
                  {selectedClassDetails.members.length} members
                </span>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-sm text-blue-600 font-medium mb-1">Total Attendance</p>
                <p className="text-2xl font-bold text-blue-900">{selectedClassDetails.totals.attendance}</p>
                <p className="text-xs text-blue-600 mt-1">Avg: {selectedClassDetails.totals.avgAttendance}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <p className="text-sm text-green-600 font-medium mb-1">Total Offerings</p>
                <p className="text-2xl font-bold text-green-900">
                  {selectedClassDetails.totals.offerings.toLocaleString()}
                </p>
                <p className="text-xs text-green-600 mt-1">UGX</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <p className="text-sm text-purple-600 font-medium mb-1">Total Payments</p>
                <p className="text-2xl font-bold text-purple-900">
                  {selectedClassDetails.totals.totalPayments.toLocaleString()}
                </p>
                <p className="text-xs text-purple-600 mt-1">UGX</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <p className="text-sm text-orange-600 font-medium mb-1">Weeks Reported</p>
                <p className="text-2xl font-bold text-orange-900">
                  {selectedClassDetails.totals.weeksReported}
                </p>
              </div>
            </div>

            {/* Payment Breakdown */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs text-gray-600 font-medium mb-1">Lesson (English)</p>
                <p className="text-lg font-bold text-gray-900">
                  {selectedClassDetails.totals.lessonEnglish.toLocaleString()} UGX
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs text-gray-600 font-medium mb-1">Lesson (Luganda)</p>
                <p className="text-lg font-bold text-gray-900">
                  {selectedClassDetails.totals.lessonLuganda.toLocaleString()} UGX
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs text-gray-600 font-medium mb-1">MW (English)</p>
                <p className="text-lg font-bold text-gray-900">
                  {selectedClassDetails.totals.morningWatchEnglish.toLocaleString()} UGX
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs text-gray-600 font-medium mb-1">MW (Luganda)</p>
                <p className="text-lg font-bold text-gray-900">
                  {selectedClassDetails.totals.morningWatchLuganda.toLocaleString()} UGX
                </p>
              </div>
            </div>
          </div>

          {/* Members List */}
          {selectedClassDetails.members.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="h-6 w-6 mr-2 text-indigo-600" />
                Members ({selectedClassDetails.members.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {selectedClassDetails.members.map((member, index) => (
                  <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                    <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-indigo-600">
                        {member.member_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm text-gray-700 truncate">{member.member_name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weekly Activity */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <FileText className="h-6 w-6 mr-2 text-indigo-600" />
                Weekly Activity Report
              </h3>
            </div>
            {selectedClassDetails.weeklyData.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                No weekly data submitted for this class yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Week</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Offering</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Attendance</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Visits</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Bible Studies</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Visitors</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedClassDetails.weeklyData.map((week, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-full">
                            Week {week.week_number}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(week.sabbath_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-green-600">
                          {parseFloat(week.offering_global_mission || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                          {week.total_attendance}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                          {week.member_visits || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                          {week.members_conducted_bible_studies || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                          {week.number_of_visitors || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 font-semibold">
                    <tr>
                      <td className="px-6 py-4 text-sm" colSpan="2">TOTALS</td>
                      <td className="px-6 py-4 text-right text-sm text-green-700">
                        {selectedClassDetails.totals.offerings.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right text-sm">
                        {selectedClassDetails.totals.attendance}
                      </td>
                      <td className="px-6 py-4 text-right text-sm">
                        {selectedClassDetails.totals.visits}
                      </td>
                      <td className="px-6 py-4 text-right text-sm">
                        {selectedClassDetails.totals.bibleStudies}
                      </td>
                      <td className="px-6 py-4 text-right text-sm">
                        {selectedClassDetails.totals.visitors}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassSearch;