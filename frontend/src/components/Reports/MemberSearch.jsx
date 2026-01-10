import React, { useState } from 'react';
import { Search, User, Calendar, DollarSign, FileText, TrendingUp, X } from 'lucide-react';
import weeklyDataService from '../../services/WeeklyDataService';
import classService from '../../services/classService';
import classMemberService from '../../services/classMemberService';

const MemberSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [allMatchingMembers, setAllMatchingMembers] = useState([]);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a member name');
      return;
    }

    setSearching(true);
    setError('');
    setSearchResults(null);
    setAllMatchingMembers([]);

    try {
      // Get all classes
      const classesResponse = await classService.getAll();
      const classes = classesResponse.data || [];

      // Search for ALL members that match the search query across all classes
      const matchingMembers = [];

      for (const cls of classes) {
        const membersResponse = await classMemberService.getByClass(cls.id);
        const members = membersResponse.data || [];
        
        // Find all members whose name contains the search query (case-insensitive)
        const classMatches = members.filter(m => 
          m.member_name.toLowerCase().includes(searchQuery.toLowerCase())
        );

        // Add class info to each matching member
        classMatches.forEach(member => {
          matchingMembers.push({
            ...member,
            class: cls
          });
        });
      }

      if (matchingMembers.length === 0) {
        setError('No members found matching that name');
        return;
      }

      // If multiple matches, show them all
      setAllMatchingMembers(matchingMembers);

      // If only one match, load their data automatically
      if (matchingMembers.length === 1) {
        await loadMemberData(matchingMembers[0]);
      }

    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const loadMemberData = async (memberWithClass) => {
    try {
      setSearching(true);
      
      // Get all weekly data for this member's class
      const weeklyDataResponse = await weeklyDataService.getByClass(memberWithClass.class.id);
      const allWeeklyData = weeklyDataResponse.data || [];

      // Filter and parse payment history for this member
      const paymentHistory = [];
      let totalLessonEnglish = 0;
      let totalLessonLuganda = 0;
      let totalMorningWatchEnglish = 0;
      let totalMorningWatchLuganda = 0;
      let weeksWithPayments = 0;

      allWeeklyData.forEach(weekData => {
        const weekPayments = {
          week_number: weekData.week_number,
          sabbath_date: weekData.sabbath_date,
          lesson_english: 0,
          lesson_luganda: 0,
          morning_watch_english: 0,
          morning_watch_luganda: 0,
        };

        let hasPayment = false;

        // Parse Lesson English
        if (weekData.members_paid_lesson_english) {
          const entries = weekData.members_paid_lesson_english.split(',').map(s => s.trim());
          entries.forEach(entry => {
            const [name, amount] = entry.split(':').map(s => s.trim());
            if (name === memberWithClass.member_name && amount) {
              weekPayments.lesson_english = parseFloat(amount);
              totalLessonEnglish += parseFloat(amount);
              hasPayment = true;
            }
          });
        }

        // Parse Lesson Luganda
        if (weekData.members_paid_lesson_luganda) {
          const entries = weekData.members_paid_lesson_luganda.split(',').map(s => s.trim());
          entries.forEach(entry => {
            const [name, amount] = entry.split(':').map(s => s.trim());
            if (name === memberWithClass.member_name && amount) {
              weekPayments.lesson_luganda = parseFloat(amount);
              totalLessonLuganda += parseFloat(amount);
              hasPayment = true;
            }
          });
        }

        // Parse Morning Watch English
        if (weekData.members_paid_morning_watch_english) {
          const entries = weekData.members_paid_morning_watch_english.split(',').map(s => s.trim());
          entries.forEach(entry => {
            const [name, amount] = entry.split(':').map(s => s.trim());
            if (name === memberWithClass.member_name && amount) {
              weekPayments.morning_watch_english = parseFloat(amount);
              totalMorningWatchEnglish += parseFloat(amount);
              hasPayment = true;
            }
          });
        }

        // Parse Morning Watch Luganda
        if (weekData.members_paid_morning_watch_luganda) {
          const entries = weekData.members_paid_morning_watch_luganda.split(',').map(s => s.trim());
          entries.forEach(entry => {
            const [name, amount] = entry.split(':').map(s => s.trim());
            if (name === memberWithClass.member_name && amount) {
              weekPayments.morning_watch_luganda = parseFloat(amount);
              totalMorningWatchLuganda += parseFloat(amount);
              hasPayment = true;
            }
          });
        }

        if (hasPayment) {
          paymentHistory.push(weekPayments);
          weeksWithPayments++;
        }
      });

      // Sort by week number
      paymentHistory.sort((a, b) => a.week_number - b.week_number);

      setSearchResults({
        member: memberWithClass,
        class: memberWithClass.class,
        paymentHistory,
        totals: {
          lesson_english: totalLessonEnglish,
          lesson_luganda: totalLessonLuganda,
          morning_watch_english: totalMorningWatchEnglish,
          morning_watch_luganda: totalMorningWatchLuganda,
          grand_total: totalLessonEnglish + totalLessonLuganda + totalMorningWatchEnglish + totalMorningWatchLuganda,
          weeks_with_payments: weeksWithPayments,
        }
      });

      // Clear the multiple results list
      setAllMatchingMembers([]);

    } catch (err) {
      console.error('Error loading member data:', err);
      setError('Failed to load member data. Please try again.');
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
    setAllMatchingMembers([]);
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
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Member Search</h1>
        <p className="text-blue-100">Search for any member to view their complete payment history</p>
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
              placeholder="Enter member name (e.g., John, Mary, etc.)"
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
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
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
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
      {allMatchingMembers.length > 1 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Found {allMatchingMembers.length} members matching "{searchQuery}"
          </h2>
          <p className="text-sm text-gray-600 mb-4">Click on a member to view their payment history:</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allMatchingMembers.map((member, index) => (
              <button
                key={index}
                onClick={() => loadMemberData(member)}
                className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{member.member_name}</p>
                    <p className="text-sm text-gray-600">
                      {member.class.class_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {member.class.quarter?.name} {member.class.quarter?.year}
                    </p>
                  </div>
                </div>
                <div className="text-blue-600">
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
          {/* Member Info Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="p-4 bg-blue-100 rounded-full">
                <User className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{searchResults.member.member_name}</h2>
                <p className="text-gray-600">
                  {searchResults.class.class_name} - {searchResults.class.quarter?.name} {searchResults.class.quarter?.year}
                </p>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <p className="text-sm text-green-600 font-medium mb-1">Lesson (English)</p>
                <p className="text-2xl font-bold text-green-900">
                  {searchResults.totals.lesson_english.toLocaleString()} UGX
                </p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-sm text-blue-600 font-medium mb-1">Lesson (Luganda)</p>
                <p className="text-2xl font-bold text-blue-900">
                  {searchResults.totals.lesson_luganda.toLocaleString()} UGX
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <p className="text-sm text-purple-600 font-medium mb-1">MW (English)</p>
                <p className="text-2xl font-bold text-purple-900">
                  {searchResults.totals.morning_watch_english.toLocaleString()} UGX
                </p>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <p className="text-sm text-orange-600 font-medium mb-1">MW (Luganda)</p>
                <p className="text-2xl font-bold text-orange-900">
                  {searchResults.totals.morning_watch_luganda.toLocaleString()} UGX
                </p>
              </div>
            </div>

            {/* Grand Total */}
            <div className="mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90 mb-1">Total Payments</p>
                  <p className="text-4xl font-bold">
                    {searchResults.totals.grand_total.toLocaleString()} UGX
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm opacity-90 mb-1">Weeks with Payments</p>
                  <p className="text-3xl font-bold">{searchResults.totals.weeks_with_payments}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment History Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <FileText className="h-6 w-6 mr-2 text-indigo-600" />
                Payment History
              </h3>
            </div>

            {searchResults.paymentHistory.length === 0 ? (
              <div className="p-12 text-center">
                <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No payment history found for this member</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Week
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lesson (English)
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lesson (Luganda)
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        MW (English)
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        MW (Luganda)
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {searchResults.paymentHistory.map((payment, index) => {
                      const weekTotal = 
                        payment.lesson_english + 
                        payment.lesson_luganda + 
                        payment.morning_watch_english + 
                        payment.morning_watch_luganda;

                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-full">
                              Week {payment.week_number}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(payment.sabbath_date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                            {payment.lesson_english > 0 ? (
                              <span className="text-green-600 font-semibold">
                                {payment.lesson_english.toLocaleString()} UGX
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                            {payment.lesson_luganda > 0 ? (
                              <span className="text-blue-600 font-semibold">
                                {payment.lesson_luganda.toLocaleString()} UGX
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                            {payment.morning_watch_english > 0 ? (
                              <span className="text-purple-600 font-semibold">
                                {payment.morning_watch_english.toLocaleString()} UGX
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                            {payment.morning_watch_luganda > 0 ? (
                              <span className="text-orange-600 font-semibold">
                                {payment.morning_watch_luganda.toLocaleString()} UGX
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <span className="text-lg font-bold text-gray-900">
                              {weekTotal.toLocaleString()} UGX
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-gray-50 font-bold">
                    <tr>
                      <td colSpan="2" className="px-6 py-4 text-left text-sm uppercase text-gray-700">
                        Total
                      </td>
                      <td className="px-6 py-4 text-right text-green-700">
                        {searchResults.totals.lesson_english.toLocaleString()} UGX
                      </td>
                      <td className="px-6 py-4 text-right text-blue-700">
                        {searchResults.totals.lesson_luganda.toLocaleString()} UGX
                      </td>
                      <td className="px-6 py-4 text-right text-purple-700">
                        {searchResults.totals.morning_watch_english.toLocaleString()} UGX
                      </td>
                      <td className="px-6 py-4 text-right text-orange-700">
                        {searchResults.totals.morning_watch_luganda.toLocaleString()} UGX
                      </td>
                      <td className="px-6 py-4 text-right text-lg text-indigo-700">
                        {searchResults.totals.grand_total.toLocaleString()} UGX
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

export default MemberSearch;