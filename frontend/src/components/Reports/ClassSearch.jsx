import React, { useState } from 'react';
import { Search, Users, Calendar, DollarSign, FileText, TrendingUp, X, BookOpen } from 'lucide-react';
import weeklyDataService from '../../services/WeeklyDataService';
import classService from '../../services/classService';
import classMemberService from '../../services/classMemberService';

const ClassSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [allMatchingClasses, setAllMatchingClasses] = useState([]);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a class name');
      return;
    }

    setSearching(true);
    setError('');
    setSearchResults(null);
    setAllMatchingClasses([]);

    try {
      // Get all classes
      const classesResponse = await classService.getAll();
      const allClasses = classesResponse.data || [];

      // Find all classes that match the search query (case-insensitive)
      const matchingClasses = allClasses.filter(cls =>
        cls.class_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cls.teacher_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cls.secretary_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );

      if (matchingClasses.length === 0) {
        setError('No classes found matching that name');
        return;
      }

      // If multiple matches, show them all
      setAllMatchingClasses(matchingClasses);

      // If only one match, load its data automatically
      if (matchingClasses.length === 1) {
        await loadClassData(matchingClasses[0]);
      }

    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const loadClassData = async (classItem) => {
    try {
      setSearching(true);

      // Get all weekly data for this class
      const weeklyDataResponse = await weeklyDataService.getByClass(classItem.id);
      const weeklyData = weeklyDataResponse.data || [];

      // Get class members
      const membersResponse = await classMemberService.getByClass(classItem.id);
      const members = membersResponse.data || [];

      // Calculate totals
      let totalAttendance = 0;
      let totalVisits = 0;
      let totalBibleStudies = 0;
      let totalVisitors = 0;
      let totalOfferings = 0;
      let totalLessonEnglish = 0;
      let totalLessonLuganda = 0;
      let totalMorningWatchEnglish = 0;
      let totalMorningWatchLuganda = 0;
      let weeksReported = weeklyData.length;

      const parsePaymentAmount = (paymentString) => {
        if (!paymentString || paymentString.trim() === '') return 0;
        let total = 0;
        const entries = paymentString.split(',').map(s => s.trim()).filter(Boolean);
        entries.forEach(entry => {
          const [name, amount] = entry.split(':').map(s => s.trim());
          if (amount) {
            const numAmount = parseFloat(amount);
            if (!isNaN(numAmount)) {
              total += numAmount;
            }
          }
        });
        return total;
      };

      weeklyData.forEach(week => {
        totalAttendance += parseInt(week.total_attendance) || 0;
        totalVisits += parseInt(week.member_visits) || 0;
        totalBibleStudies += parseInt(week.members_conducted_bible_studies) || 0;
        totalVisitors += parseInt(week.number_of_visitors) || 0;
        totalOfferings += parseFloat(week.offering_global_mission) || 0;
        
        totalLessonEnglish += parsePaymentAmount(week.members_paid_lesson_english);
        totalLessonLuganda += parsePaymentAmount(week.members_paid_lesson_luganda);
        totalMorningWatchEnglish += parsePaymentAmount(week.members_paid_morning_watch_english);
        totalMorningWatchLuganda += parsePaymentAmount(week.members_paid_morning_watch_luganda);
      });

      // Sort weekly data by week number
      weeklyData.sort((a, b) => a.week_number - b.week_number);

      setSearchResults({
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
          totalPayments: totalLessonEnglish + totalLessonLuganda + totalMorningWatchEnglish + totalMorningWatchLuganda,
          weeksReported,
          avgAttendance: weeksReported > 0 ? (totalAttendance / weeksReported).toFixed(1) : 0
        }
      });

      // Clear the multiple results list
      setAllMatchingClasses([]);

    } catch (err) {
      console.error('Error loading class data:', err);
      setError('Failed to load class data. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
    setAllMatchingClasses([]);
    setError('');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter class name, teacher, or secretary name"
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          <button
            onClick={handleSearch}
            disabled={searching || !searchQuery.trim()}
            className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {searching ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Search className="h-5 w-5" />
                <span>Search</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}
      </div>

      {/* Multiple Matches - Show List */}
      {allMatchingClasses.length > 1 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Found {allMatchingClasses.length} classes matching "{searchQuery}"
          </h2>
          <p className="text-sm text-gray-600 mb-4">Click on a class to view details:</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allMatchingClasses.map((cls, index) => (
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
                <div className="text-purple-600">
                  <span className="text-sm font-medium">View →</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      {searchResults && (
        <div className="space-y-6">
          {/* Class Info Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="p-4 bg-purple-100 rounded-full">
                <BookOpen className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{searchResults.class.class_name}</h2>
                <p className="text-gray-600">
                  {searchResults.class.quarter?.name} {searchResults.class.quarter?.year}
                </p>
                <div className="flex space-x-4 mt-2 text-sm text-gray-600">
                  <span>👨‍🏫 Teacher: {searchResults.class.teacher_name}</span>
                  <span>📝 Secretary: {searchResults.class.secretary_name}</span>
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
                  {searchResults.members.length} members
                </span>
              </div>
              {searchResults.members.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {searchResults.members.slice(0, 10).map((member, idx) => (
                    <span key={idx} className="px-3 py-1 bg-white border border-indigo-200 rounded-full text-sm text-gray-700">
                      {member.member_name}
                    </span>
                  ))}
                  {searchResults.members.length > 10 && (
                    <span className="px-3 py-1 bg-indigo-600 text-white rounded-full text-sm">
                      +{searchResults.members.length - 10} more
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Summary Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-sm text-blue-600 font-medium mb-1">Total Attendance</p>
                <p className="text-2xl font-bold text-blue-900">
                  {searchResults.totals.attendance}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Avg: {searchResults.totals.avgAttendance}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <p className="text-sm text-green-600 font-medium mb-1">Total Offerings</p>
                <p className="text-2xl font-bold text-green-900">
                  {searchResults.totals.offerings.toLocaleString()}
                </p>
                <p className="text-xs text-green-600 mt-1">UGX</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <p className="text-sm text-purple-600 font-medium mb-1">Member Visits</p>
                <p className="text-2xl font-bold text-purple-900">
                  {searchResults.totals.visits}
                </p>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <p className="text-sm text-orange-600 font-medium mb-1">Weeks Reported</p>
                <p className="text-2xl font-bold text-orange-900">
                  {searchResults.totals.weeksReported}
                </p>
                <p className="text-xs text-orange-600 mt-1">out of 13</p>
              </div>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <DollarSign className="h-6 w-6 mr-2 text-green-600" />
              Financial Summary
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Offerings</p>
                <p className="text-lg font-bold text-gray-900">
                  {searchResults.totals.offerings.toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Lesson (Eng)</p>
                <p className="text-lg font-bold text-green-700">
                  {searchResults.totals.lessonEnglish.toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Lesson (Lug)</p>
                <p className="text-lg font-bold text-blue-700">
                  {searchResults.totals.lessonLuganda.toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">MW (Eng)</p>
                <p className="text-lg font-bold text-purple-700">
                  {searchResults.totals.morningWatchEnglish.toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">MW (Lug)</p>
                <p className="text-lg font-bold text-orange-700">
                  {searchResults.totals.morningWatchLuganda.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="mt-4 p-6 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg text-white">
              <p className="text-sm opacity-90 mb-1">Grand Total (All Payments)</p>
              <p className="text-4xl font-bold">
                {(searchResults.totals.offerings + searchResults.totals.totalPayments).toLocaleString()} UGX
              </p>
            </div>
          </div>

          {/* Weekly Data Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <FileText className="h-6 w-6 mr-2 text-indigo-600" />
                Weekly Activity Report
              </h3>
            </div>

            {searchResults.weeklyData.length === 0 ? (
              <div className="p-12 text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No weekly data available for this class</p>
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
                    {searchResults.weeklyData.map((week, index) => (
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
                          {week.member_visits}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                          {week.members_conducted_bible_studies}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                          {week.number_of_visitors}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 font-bold">
                    <tr>
                      <td colSpan="2" className="px-6 py-4 text-left text-sm uppercase text-gray-700">
                        Total
                      </td>
                      <td className="px-6 py-4 text-right text-green-700">
                        {searchResults.totals.offerings.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-900">
                        {searchResults.totals.attendance}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-900">
                        {searchResults.totals.visits}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-900">
                        {searchResults.totals.bibleStudies}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-900">
                        {searchResults.totals.visitors}
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