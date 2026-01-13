import React, { useState, useEffect } from 'react';
import { Crown, Trophy, Star, TrendingUp, Users, DollarSign, Calendar, Award, Zap, Target } from 'lucide-react';
import classService from '../../services/classService';
import weeklyDataService from '../../services/WeeklyDataService';
import quarterService from '../../services/quarterService';

const OverallChampion = () => {
  const [quarters, setQuarters] = useState([]);
  const [selectedQuarter, setSelectedQuarter] = useState('');
  const [loading, setLoading] = useState(false);
  const [championData, setChampionData] = useState(null);

  useEffect(() => {
    loadQuarters();
  }, []);

  useEffect(() => {
    if (selectedQuarter) {
      loadChampionData();
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

  const loadChampionData = async () => {
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
        let totalHelpedOthers = 0;
        let totalStudiedLesson = 0;
        let totalGuidesDistributed = 0;
        let totalPayments = 0;
        let weeksReported = weeklyData.length;

        weeklyData.forEach(week => {
          totalAttendance += parseInt(week.total_attendance) || 0;
          totalOfferings += parseFloat(week.offering_global_mission) || 0;
          totalVisits += parseInt(week.member_visits) || 0;
          totalBibleStudies += parseInt(week.members_conducted_bible_studies) || 0;
          totalVisitors += parseInt(week.number_of_visitors) || 0;
          totalHelpedOthers += parseInt(week.members_helped_others) || 0;
          totalStudiedLesson += parseInt(week.members_studied_lesson) || 0;
          totalGuidesDistributed += parseInt(week.bible_study_guides_distributed) || 0;

          totalPayments += parsePaymentAmount(week.members_paid_lesson_english);
          totalPayments += parsePaymentAmount(week.members_paid_lesson_luganda);
          totalPayments += parsePaymentAmount(week.members_paid_morning_watch_english);
          totalPayments += parsePaymentAmount(week.members_paid_morning_watch_luganda);
        });

        const avgAttendance = weeksReported > 0 ? totalAttendance / weeksReported : 0;
        const avgOffering = weeksReported > 0 ? totalOfferings / weeksReported : 0;

        // Comprehensive scoring system
        const attendanceScore = avgAttendance * 10;
        const offeringScore = avgOffering / 1000;
        const visitsScore = totalVisits * 2;
        const bibleStudiesScore = totalBibleStudies * 3;
        const visitorsScore = totalVisitors * 2;
        const helpedOthersScore = totalHelpedOthers * 1.5;
        const studiedLessonScore = totalStudiedLesson * 1;
        const guidesScore = totalGuidesDistributed * 1;
        const paymentsScore = totalPayments / 10000;
        const consistencyScore = (weeksReported / 13) * 20;

        const overallScore = 
          attendanceScore + 
          offeringScore + 
          visitsScore + 
          bibleStudiesScore + 
          visitorsScore + 
          helpedOthersScore + 
          studiedLessonScore + 
          guidesScore + 
          paymentsScore + 
          consistencyScore;

        classPerformance.push({
          class: cls,
          totalAttendance,
          avgAttendance: avgAttendance.toFixed(1),
          totalOfferings,
          avgOffering: avgOffering.toFixed(0),
          totalVisits,
          totalBibleStudies,
          totalVisitors,
          totalHelpedOthers,
          totalStudiedLesson,
          totalGuidesDistributed,
          totalPayments,
          weeksReported,
          overallScore: overallScore.toFixed(2),
          weeklyData
        });
      }

      // Sort to find the champion
      classPerformance.sort((a, b) => b.overallScore - a.overallScore);

      // Get leaders in each category
      const attendanceLeader = [...classPerformance].sort((a, b) => parseFloat(b.avgAttendance) - parseFloat(a.avgAttendance))[0];
      const offeringLeader = [...classPerformance].sort((a, b) => b.totalOfferings - a.totalOfferings)[0];
      const visitsLeader = [...classPerformance].sort((a, b) => b.totalVisits - a.totalVisits)[0];
      const bibleStudiesLeader = [...classPerformance].sort((a, b) => b.totalBibleStudies - a.totalBibleStudies)[0];
      const visitorsLeader = [...classPerformance].sort((a, b) => b.totalVisitors - a.totalVisitors)[0];
      const paymentsLeader = [...classPerformance].sort((a, b) => b.totalPayments - a.totalPayments)[0];
      const consistencyLeader = [...classPerformance].sort((a, b) => b.weeksReported - a.weeksReported)[0];

      // Calculate how many categories the champion won
      const champion = classPerformance[0];
      let categoriesWon = 0;
      if (champion.class.id === attendanceLeader.class.id) categoriesWon++;
      if (champion.class.id === offeringLeader.class.id) categoriesWon++;
      if (champion.class.id === visitsLeader.class.id) categoriesWon++;
      if (champion.class.id === bibleStudiesLeader.class.id) categoriesWon++;
      if (champion.class.id === visitorsLeader.class.id) categoriesWon++;
      if (champion.class.id === paymentsLeader.class.id) categoriesWon++;
      if (champion.class.id === consistencyLeader.class.id) categoriesWon++;

      setChampionData({
        champion: { ...champion, categoriesWon },
        runners: classPerformance.slice(1, 4),
        categoryLeaders: {
          attendance: attendanceLeader,
          offering: offeringLeader,
          visits: visitsLeader,
          bibleStudies: bibleStudiesLeader,
          visitors: visitorsLeader,
          payments: paymentsLeader,
          consistency: consistencyLeader
        }
      });

    } catch (error) {
      console.error('Error loading champion data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Finding the champion...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 rounded-lg shadow-2xl p-8 text-white">
        <div className="flex items-center justify-center mb-4">
          <Crown className="h-16 w-16 animate-pulse" />
        </div>
        <h1 className="text-4xl font-bold text-center mb-2">Overall Champion</h1>
        <p className="text-center text-yellow-100 text-lg">The Best Performing Class This Quarter</p>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="max-w-md mx-auto">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Select Quarter
          </label>
          <select
            value={selectedQuarter}
            onChange={(e) => setSelectedQuarter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          >
            {quarters.map((quarter) => (
              <option key={quarter.id} value={quarter.id}>
                {quarter.name} {quarter.year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {championData && (
        <>
          {/* Champion Showcase */}
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg shadow-2xl p-8 border-4 border-yellow-400">
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <Trophy className="h-24 w-24 text-yellow-500 animate-bounce" />
              </div>
              <h2 className="text-5xl font-bold text-gray-900 mb-2">
                {championData.champion.class.class_name}
              </h2>
              <p className="text-xl text-gray-600 mb-4">
                Teacher: {championData.champion.class.teacher_name}
              </p>
              <div className="inline-block px-8 py-4 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full shadow-lg">
                <span className="text-3xl font-bold text-white">
                  🏆 Champion Score: {championData.champion.overallScore}
                </span>
              </div>
              <p className="mt-4 text-lg text-gray-700">
                <span className="font-bold text-yellow-600">{championData.champion.categoriesWon}</span> Category Winner{championData.champion.categoriesWon !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Champion Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              <div className="bg-white rounded-lg p-4 shadow text-center border-2 border-blue-200">
                <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-xs text-gray-600 mb-1">Avg Attendance</p>
                <p className="text-2xl font-bold text-blue-600">{championData.champion.avgAttendance}</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow text-center border-2 border-green-200">
                <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-xs text-gray-600 mb-1">Total Offerings</p>
                <p className="text-2xl font-bold text-green-600">{championData.champion.totalOfferings.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow text-center border-2 border-purple-200">
                <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <p className="text-xs text-gray-600 mb-1">Member Visits</p>
                <p className="text-2xl font-bold text-purple-600">{championData.champion.totalVisits}</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow text-center border-2 border-orange-200">
                <Calendar className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <p className="text-xs text-gray-600 mb-1">Bible Studies</p>
                <p className="text-2xl font-bold text-orange-600">{championData.champion.totalBibleStudies}</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow text-center border-2 border-pink-200">
                <Users className="h-8 w-8 text-pink-600 mx-auto mb-2" />
                <p className="text-xs text-gray-600 mb-1">Visitors</p>
                <p className="text-2xl font-bold text-pink-600">{championData.champion.totalVisitors}</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow text-center border-2 border-indigo-200">
                <Target className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
                <p className="text-xs text-gray-600 mb-1">Helped Others</p>
                <p className="text-2xl font-bold text-indigo-600">{championData.champion.totalHelpedOthers}</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow text-center border-2 border-yellow-200">
                <Zap className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                <p className="text-xs text-gray-600 mb-1">Total Payments</p>
                <p className="text-2xl font-bold text-yellow-600">{championData.champion.totalPayments.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow text-center border-2 border-gray-200">
                <Star className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                <p className="text-xs text-gray-600 mb-1">Consistency</p>
                <p className="text-2xl font-bold text-gray-600">{championData.champion.weeksReported}/13</p>
              </div>
            </div>
          </div>

          {/* Runners Up */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6 text-center">Runners Up</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {championData.runners.map((runner, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200 text-center">
                  <div className="flex justify-center mb-3">
                    {index === 0 && <Award className="h-12 w-12 text-gray-400" />}
                    {index === 1 && <Award className="h-12 w-12 text-orange-600" />}
                    {index === 2 && <Award className="h-10 w-10 text-gray-500" />}
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-1">
                    {index === 0 && '2nd Place'}
                    {index === 1 && '3rd Place'}
                    {index === 2 && '4th Place'}
                  </h4>
                  <p className="text-lg font-semibold text-gray-700 mb-2">{runner.class.class_name}</p>
                  <div className="inline-block px-4 py-2 bg-gray-200 rounded-full">
                    <span className="text-sm font-bold text-gray-700">Score: {runner.overallScore}</span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-gray-600">Attendance</p>
                      <p className="font-bold">{runner.avgAttendance}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Offerings</p>
                      <p className="font-bold">{runner.totalOfferings.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Category Leaders */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6 text-center">Category Champions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-blue-50 rounded-lg p-6 border-2 border-blue-300">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-semibold text-blue-900">👥 Attendance Leader</h4>
                  {championData.categoryLeaders.attendance.class.id === championData.champion.class.id && (
                    <Crown className="h-6 w-6 text-yellow-500" />
                  )}
                </div>
                <p className="text-xl font-bold text-blue-700">{championData.categoryLeaders.attendance.class.class_name}</p>
                <p className="text-sm text-blue-600 mt-2">Avg: {championData.categoryLeaders.attendance.avgAttendance}</p>
              </div>

              <div className="bg-green-50 rounded-lg p-6 border-2 border-green-300">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-semibold text-green-900">💰 Offering Leader</h4>
                  {championData.categoryLeaders.offering.class.id === championData.champion.class.id && (
                    <Crown className="h-6 w-6 text-yellow-500" />
                  )}
                </div>
                <p className="text-xl font-bold text-green-700">{championData.categoryLeaders.offering.class.class_name}</p>
                <p className="text-sm text-green-600 mt-2">{championData.categoryLeaders.offering.totalOfferings.toLocaleString()} UGX</p>
              </div>

              <div className="bg-purple-50 rounded-lg p-6 border-2 border-purple-300">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-semibold text-purple-900">🚀 Visits Leader</h4>
                  {championData.categoryLeaders.visits.class.id === championData.champion.class.id && (
                    <Crown className="h-6 w-6 text-yellow-500" />
                  )}
                </div>
                <p className="text-xl font-bold text-purple-700">{championData.categoryLeaders.visits.class.class_name}</p>
                <p className="text-sm text-purple-600 mt-2">{championData.categoryLeaders.visits.totalVisits} visits</p>
              </div>

              <div className="bg-orange-50 rounded-lg p-6 border-2 border-orange-300">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-semibold text-orange-900">📖 Bible Studies Leader</h4>
                  {championData.categoryLeaders.bibleStudies.class.id === championData.champion.class.id && (
                    <Crown className="h-6 w-6 text-yellow-500" />
                  )}
                </div>
                <p className="text-xl font-bold text-orange-700">{championData.categoryLeaders.bibleStudies.class.class_name}</p>
                <p className="text-sm text-orange-600 mt-2">{championData.categoryLeaders.bibleStudies.totalBibleStudies} studies</p>
              </div>

              <div className="bg-pink-50 rounded-lg p-6 border-2 border-pink-300">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-semibold text-pink-900">🎉 Visitors Leader</h4>
                  {championData.categoryLeaders.visitors.class.id === championData.champion.class.id && (
                    <Crown className="h-6 w-6 text-yellow-500" />
                  )}
                </div>
                <p className="text-xl font-bold text-pink-700">{championData.categoryLeaders.visitors.class.class_name}</p>
                <p className="text-sm text-pink-600 mt-2">{championData.categoryLeaders.visitors.totalVisitors} visitors</p>
              </div>

              <div className="bg-yellow-50 rounded-lg p-6 border-2 border-yellow-300">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-semibold text-yellow-900">💵 Payments Leader</h4>
                  {championData.categoryLeaders.payments.class.id === championData.champion.class.id && (
                    <Crown className="h-6 w-6 text-yellow-500" />
                  )}
                </div>
                <p className="text-xl font-bold text-yellow-700">{championData.categoryLeaders.payments.class.class_name}</p>
                <p className="text-sm text-yellow-600 mt-2">{championData.categoryLeaders.payments.totalPayments.toLocaleString()} UGX</p>
              </div>
            </div>
          </div>

          {/* Achievement Badge */}
          <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg shadow-xl p-8 text-white text-center">
            <Star className="h-16 w-16 mx-auto mb-4 animate-spin-slow" />
            <h3 className="text-3xl font-bold mb-2">Congratulations!</h3>
            <p className="text-xl mb-4">
              {championData.champion.class.class_name} is the Overall Champion
            </p>
            <p className="text-lg opacity-90">
              Outstanding performance across all metrics this quarter!
            </p>
          </div>
        </>
      )}

      {/* Add slow spin animation */}
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default OverallChampion;