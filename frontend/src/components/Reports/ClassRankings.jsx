import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, TrendingUp, Users, DollarSign, Calendar, Download, Star } from 'lucide-react';
import classService from '../../services/classService';
import weeklyDataService from '../../services/WeeklyDataService';
import quarterService from '../../services/quarterService';

const ClassRankings = () => {
  const [quarters, setQuarters] = useState([]);
  const [selectedQuarter, setSelectedQuarter] = useState('');
  const [loading, setLoading] = useState(false);
  const [rankings, setRankings] = useState(null);

  useEffect(() => {
    loadQuarters();
  }, []);

  useEffect(() => {
    if (selectedQuarter) {
      loadRankings();
    }
  }, [selectedQuarter]);

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

  const loadRankings = async () => {
    if (!selectedQuarter) return;

    setLoading(true);
    try {
      const classesResponse = await classService.getAll();
      const allClasses = (classesResponse.data || []).filter(cls => cls.quarter_id === selectedQuarter);

      const classPerformance = [];

      for (const cls of allClasses) {
        const weeklyDataResponse = await weeklyDataService.getByClass(cls.id);
        const weeklyData = weeklyDataResponse.data || [];

        let totalAttendance = 0;
        let totalOfferings = 0;
        let totalVisits = 0;
        let totalBibleStudies = 0;
        let totalVisitors = 0;
        let totalPayments = 0;
        let weeksReported = weeklyData.length;

        weeklyData.forEach(week => {
          totalAttendance += parseInt(week.total_attendance) || 0;
          totalOfferings += parseFloat(week.offering_global_mission) || 0;
          totalVisits += parseInt(week.member_visits) || 0;
          totalBibleStudies += parseInt(week.members_conducted_bible_studies) || 0;
          totalVisitors += parseInt(week.number_of_visitors) || 0;

          totalPayments += parsePaymentAmount(week.members_paid_lesson_english);
          totalPayments += parsePaymentAmount(week.members_paid_lesson_luganda);
          totalPayments += parsePaymentAmount(week.members_paid_morning_watch_english);
          totalPayments += parsePaymentAmount(week.members_paid_morning_watch_luganda);
        });

        const avgAttendance = weeksReported > 0 ? totalAttendance / weeksReported : 0;
        const avgOffering = weeksReported > 0 ? totalOfferings / weeksReported : 0;

        // Calculate performance score (weighted)
        const attendanceScore = avgAttendance * 10;
        const offeringScore = avgOffering / 1000;
        const visitsScore = totalVisits * 2;
        const bibleStudiesScore = totalBibleStudies * 3;
        const visitorsScore = totalVisitors * 2;
        const paymentsScore = totalPayments / 10000;

        const overallScore = attendanceScore + offeringScore + visitsScore + bibleStudiesScore + visitorsScore + paymentsScore;

        classPerformance.push({
          class: cls,
          totalAttendance,
          avgAttendance: avgAttendance.toFixed(1),
          totalOfferings,
          avgOffering: avgOffering.toFixed(0),
          totalVisits,
          totalBibleStudies,
          totalVisitors,
          totalPayments,
          weeksReported,
          overallScore: overallScore.toFixed(2),
          grade: getGrade(overallScore)
        });
      }

      // Sort by overall score
      classPerformance.sort((a, b) => b.overallScore - a.overallScore);

      // Create rankings for each category
      const attendanceRanking = [...classPerformance].sort((a, b) => parseFloat(b.avgAttendance) - parseFloat(a.avgAttendance));
      const offeringRanking = [...classPerformance].sort((a, b) => b.totalOfferings - a.totalOfferings);
      const visitsRanking = [...classPerformance].sort((a, b) => b.totalVisits - a.totalVisits);
      const bibleStudiesRanking = [...classPerformance].sort((a, b) => b.totalBibleStudies - a.totalBibleStudies);
      const paymentsRanking = [...classPerformance].sort((a, b) => b.totalPayments - a.totalPayments);

      setRankings({
        overall: classPerformance,
        attendance: attendanceRanking,
        offering: offeringRanking,
        visits: visitsRanking,
        bibleStudies: bibleStudiesRanking,
        payments: paymentsRanking
      });

    } catch (error) {
      console.error('Error loading rankings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGrade = (score) => {
    if (score >= 100) return { letter: 'A+', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
    if (score >= 80) return { letter: 'A', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
    if (score >= 70) return { letter: 'B+', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
    if (score >= 60) return { letter: 'B', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
    if (score >= 50) return { letter: 'C+', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' };
    if (score >= 40) return { letter: 'C', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' };
    if (score >= 30) return { letter: 'D', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' };
    return { letter: 'F', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return <Trophy className="h-6 w-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />;
    if (rank === 3) return <Award className="h-6 w-6 text-orange-600" />;
    return <span className="text-gray-500 font-bold">#{rank}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading rankings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center">
              <Trophy className="h-8 w-8 mr-3" />
              Class Rankings & Grades
            </h1>
            <p className="text-yellow-100">Performance rankings across all metrics</p>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-2 px-4 py-2 bg-white text-orange-600 rounded-lg hover:bg-orange-50 transition"
          >
            <Download className="h-5 w-5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="max-w-md">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Select Quarter
          </label>
          <select
            value={selectedQuarter}
            onChange={(e) => setSelectedQuarter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            {quarters.map((quarter) => (
              <option key={quarter.id} value={quarter.id}>
                {quarter.name} {quarter.year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {rankings && (
        <>
          {/* Top 3 Podium */}
          {rankings.overall.length >= 3 && (
            <div className="grid grid-cols-3 gap-4">
              {/* 2nd Place */}
              <div className="bg-white rounded-lg shadow-lg p-6 transform translate-y-8">
                <div className="flex flex-col items-center">
                  <Medal className="h-12 w-12 text-gray-400 mb-2" />
                  <span className="text-4xl font-bold text-gray-400">2nd</span>
                  <h3 className="text-lg font-semibold text-gray-900 mt-4 text-center">
                    {rankings.overall[1].class.class_name}
                  </h3>
                  <div className={`mt-3 px-4 py-2 rounded-full ${rankings.overall[1].grade.bg} border-2 ${rankings.overall[1].grade.border}`}>
                    <span className={`text-2xl font-bold ${rankings.overall[1].grade.color}`}>
                      {rankings.overall[1].grade.letter}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">Score: {rankings.overall[1].overallScore}</p>
                </div>
              </div>

              {/* 1st Place */}
              <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg shadow-2xl p-6 transform -translate-y-4">
                <div className="flex flex-col items-center text-white">
                  <Trophy className="h-16 w-16 mb-2 animate-pulse" />
                  <span className="text-5xl font-bold">1st</span>
                  <h3 className="text-xl font-bold mt-4 text-center">
                    {rankings.overall[0].class.class_name}
                  </h3>
                  <div className="mt-3 px-6 py-3 bg-white rounded-full">
                    <span className={`text-3xl font-bold ${rankings.overall[0].grade.color}`}>
                      {rankings.overall[0].grade.letter}
                    </span>
                  </div>
                  <p className="text-sm mt-2">Score: {rankings.overall[0].overallScore}</p>
                  <Star className="h-6 w-6 mt-2" />
                </div>
              </div>

              {/* 3rd Place */}
              <div className="bg-white rounded-lg shadow-lg p-6 transform translate-y-12">
                <div className="flex flex-col items-center">
                  <Award className="h-12 w-12 text-orange-600 mb-2" />
                  <span className="text-4xl font-bold text-orange-600">3rd</span>
                  <h3 className="text-lg font-semibold text-gray-900 mt-4 text-center">
                    {rankings.overall[2].class.class_name}
                  </h3>
                  <div className={`mt-3 px-4 py-2 rounded-full ${rankings.overall[2].grade.bg} border-2 ${rankings.overall[2].grade.border}`}>
                    <span className={`text-2xl font-bold ${rankings.overall[2].grade.color}`}>
                      {rankings.overall[2].grade.letter}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">Score: {rankings.overall[2].overallScore}</p>
                </div>
              </div>
            </div>
          )}

          {/* Overall Rankings Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <Trophy className="h-6 w-6 mr-2 text-yellow-500" />
                Overall Performance Rankings
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Grade</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Score</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avg Attendance</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Offerings</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Visits</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Bible Studies</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Weeks</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rankings.overall.map((item, index) => (
                    <tr key={index} className={`hover:bg-gray-50 ${index < 3 ? 'bg-yellow-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getRankBadge(index + 1)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{item.class.class_name}</div>
                        <div className="text-xs text-gray-500">{item.class.teacher_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex justify-center">
                          <span className={`px-4 py-2 rounded-full font-bold text-lg ${item.grade.bg} ${item.grade.color} border-2 ${item.grade.border}`}>
                            {item.grade.letter}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">
                        {item.overallScore}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        {item.avgAttendance}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-green-600 font-semibold">
                        {item.totalOfferings.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        {item.totalVisits}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        {item.totalBibleStudies}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                        {item.weeksReported}/13
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Category Rankings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Attendance Leaders */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2 text-blue-600" />
                Attendance Leaders
              </h3>
              <div className="space-y-3">
                {rankings.attendance.slice(0, 5).map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="font-bold text-gray-500">#{index + 1}</span>
                      <span className="text-sm font-medium text-gray-900">{item.class.class_name}</span>
                    </div>
                    <span className="text-sm font-bold text-blue-600">{item.avgAttendance}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Offering Leaders */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                Offering Leaders
              </h3>
              <div className="space-y-3">
                {rankings.offering.slice(0, 5).map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="font-bold text-gray-500">#{index + 1}</span>
                      <span className="text-sm font-medium text-gray-900">{item.class.class_name}</span>
                    </div>
                    <span className="text-sm font-bold text-green-600">{item.totalOfferings.toLocaleString()} UGX</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Visits Leaders */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-purple-600" />
                Most Active (Visits)
              </h3>
              <div className="space-y-3">
                {rankings.visits.slice(0, 5).map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="font-bold text-gray-500">#{index + 1}</span>
                      <span className="text-sm font-medium text-gray-900">{item.class.class_name}</span>
                    </div>
                    <span className="text-sm font-bold text-purple-600">{item.totalVisits}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bible Studies Leaders */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-orange-600" />
                Bible Studies Leaders
              </h3>
              <div className="space-y-3">
                {rankings.bibleStudies.slice(0, 5).map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="font-bold text-gray-500">#{index + 1}</span>
                      <span className="text-sm font-medium text-gray-900">{item.class.class_name}</span>
                    </div>
                    <span className="text-sm font-bold text-orange-600">{item.totalBibleStudies}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Grading Legend */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Grading Scale</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
              {[
                { letter: 'A+', range: '100+', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
                { letter: 'A', range: '80-99', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
                { letter: 'B+', range: '70-79', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
                { letter: 'B', range: '60-69', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
                { letter: 'C+', range: '50-59', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
                { letter: 'C', range: '40-49', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
                { letter: 'D', range: '30-39', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
                { letter: 'F', range: '<30', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
              ].map((grade, idx) => (
                <div key={idx} className={`p-3 rounded-lg ${grade.bg} border-2 ${grade.border} text-center`}>
                  <div className={`text-2xl font-bold ${grade.color}`}>{grade.letter}</div>
                  <div className="text-xs text-gray-600 mt-1">{grade.range}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ClassRankings;