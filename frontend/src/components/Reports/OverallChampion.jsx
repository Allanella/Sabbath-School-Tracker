import React, { useState, useEffect } from 'react';
import { Crown, Trophy, Star, TrendingUp, Users, DollarSign, Calendar, Award, Zap, Target } from 'lucide-react';
import classService from '../../services/classService';
import weeklyDataService from '../../services/WeeklyDataService';
import quarterService from '../../services/quarterService';
import paymentService from '../../services/paymentService';

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
      const allQuarters = Array.isArray(response) ? response : (response.data || []);
      const quartersList = allQuarters.filter(q =>
        q.year === 2026
      );
      setQuarters(quartersList);
      const activeQuarter = quartersList.find(q => q.is_active);
      if (activeQuarter) {
        setSelectedQuarter(activeQuarter.id);
      } else if (quartersList.length > 0) {
        setSelectedQuarter(quartersList[0].id);
      }
    } catch (error) {
      console.error('Failed to load quarters:', error);
    }
  };

  const loadChampionData = async () => {
    if (!selectedQuarter) return;
    setLoading(true);

    try {
      // Get classes for this quarter only
      const classesResponse = await classService.getAll(selectedQuarter);
      const allClasses = Array.isArray(classesResponse)
        ? classesResponse
        : (classesResponse.data || []);

      const classPerformance = [];

      for (const cls of allClasses) {
        // Get weekly data for attendance/offerings/stats
        const weeklyDataResponse = await weeklyDataService.getByClass(cls.id);
        const weeklyData = Array.isArray(weeklyDataResponse)
          ? weeklyDataResponse
          : (weeklyDataResponse.data || []);

        let totalAttendance = 0;
        let totalOfferings = 0;
        let totalVisits = 0;
        let totalBibleStudies = 0;
        let totalVisitors = 0;
        let totalHelpedOthers = 0;
        let totalStudiedLesson = 0;
        let totalGuidesDistributed = 0;
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
        });

        // Get payment totals from member_payment_totals (correct source)
        let totalPayments = 0;
        try {
          const totalsResponse = await paymentService.getClassPaymentTotals(cls.id, selectedQuarter);
          const members = Array.isArray(totalsResponse)
            ? totalsResponse
            : (totalsResponse.data || []);

          members.forEach(member => {
            const t = member.totals || {};
            totalPayments += (t.lesson_english || 0) +
              (t.lesson_luganda || 0) +
              (t.morning_watch_english || 0) +
              (t.morning_watch_luganda || 0) +
              (t.offering || 0);
          });
        } catch (err) {
          console.error('Could not load payment totals for', cls.class_name);
        }

        const avgAttendance = weeksReported > 0 ? totalAttendance / weeksReported : 0;
        const avgOffering = weeksReported > 0 ? totalOfferings / weeksReported : 0;

        // Scoring system
        const attendanceScore = avgAttendance * 5;
        const offeringScore = (totalOfferings / 1000) * 2;
        const visitsScore = totalVisits * 3;
        const bibleStudiesScore = totalBibleStudies * 4;
        const visitorsScore = totalVisitors * 3;
        const helpedOthersScore = totalHelpedOthers * 2;
        const studiedLessonScore = totalStudiedLesson * 1;
        const guidesScore = totalGuidesDistributed * 2;
        const paymentsScore = (totalPayments / 5000) * 1;
        const consistencyScore = (weeksReported / 13) * 30;

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
          weeklyData,
        });
      }

      // Sort to find champion
      classPerformance.sort((a, b) => b.overallScore - a.overallScore);

      if (classPerformance.length === 0) {
        setChampionData(null);
        return;
      }

      // Category leaders
      const attendanceLeader = [...classPerformance].sort((a, b) => parseFloat(b.avgAttendance) - parseFloat(a.avgAttendance))[0];
      const offeringLeader = [...classPerformance].sort((a, b) => b.totalOfferings - a.totalOfferings)[0];
      const visitsLeader = [...classPerformance].sort((a, b) => b.totalVisits - a.totalVisits)[0];
      const bibleStudiesLeader = [...classPerformance].sort((a, b) => b.totalBibleStudies - a.totalBibleStudies)[0];
      const visitorsLeader = [...classPerformance].sort((a, b) => b.totalVisitors - a.totalVisitors)[0];
      const paymentsLeader = [...classPerformance].sort((a, b) => b.totalPayments - a.totalPayments)[0];
      const consistencyLeader = [...classPerformance].sort((a, b) => b.weeksReported - a.weeksReported)[0];

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
        allClasses: classPerformance,
        categoryLeaders: {
          attendance: attendanceLeader,
          offering: offeringLeader,
          visits: visitsLeader,
          bibleStudies: bibleStudiesLeader,
          visitors: visitorsLeader,
          payments: paymentsLeader,
          consistency: consistencyLeader,
        },
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
          <label className="block text-sm font-semibold text-gray-700 mb-2">Select Quarter</label>
          <select
            value={selectedQuarter}
            onChange={(e) => setSelectedQuarter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
          >
            <option value="">Choose Quarter</option>
            {quarters.map((quarter) => (
              <option key={quarter.id} value={quarter.id}>
                {quarter.name} {quarter.year} {quarter.is_active ? '(Active)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!championData && !loading && selectedQuarter && (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
          No data available for the selected quarter.
        </div>
      )}

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

            {/* Champion Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              {[
                { icon: Users, label: 'Avg Attendance', value: championData.champion.avgAttendance, color: 'blue' },
                { icon: DollarSign, label: 'Total Offerings', value: championData.champion.totalOfferings.toLocaleString(), color: 'green' },
                { icon: TrendingUp, label: 'Member Visits', value: championData.champion.totalVisits, color: 'purple' },
                { icon: Calendar, label: 'Bible Studies', value: championData.champion.totalBibleStudies, color: 'orange' },
                { icon: Users, label: 'Visitors', value: championData.champion.totalVisitors, color: 'pink' },
                { icon: Target, label: 'Helped Others', value: championData.champion.totalHelpedOthers, color: 'indigo' },
                { icon: Zap, label: 'Total Payments', value: championData.champion.totalPayments.toLocaleString(), color: 'yellow' },
                { icon: Star, label: 'Consistency', value: `${championData.champion.weeksReported}/13`, color: 'gray' },
              ].map((stat, i) => (
                <div key={i} className={`bg-white rounded-lg p-4 shadow text-center border-2 border-${stat.color}-200`}>
                  <stat.icon className={`h-8 w-8 text-${stat.color}-600 mx-auto mb-2`} />
                  <p className="text-xs text-gray-600 mb-1">{stat.label}</p>
                  <p className={`text-2xl font-bold text-${stat.color}-600`}>{stat.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* All Classes Ranking Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-2xl font-semibold text-gray-900">Full Rankings</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Score</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avg Attendance</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Offerings</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Payments</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Weeks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {championData.allClasses.map((cls, index) => (
                    <tr key={index} className={index === 0 ? 'bg-yellow-50' : 'hover:bg-gray-50'}>
                      <td className="px-4 py-3 text-sm font-bold">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{cls.class.class_name}</td>
                      <td className="px-4 py-3 text-sm text-right font-bold text-yellow-600">{cls.overallScore}</td>
                      <td className="px-4 py-3 text-sm text-right">{cls.avgAttendance}</td>
                      <td className="px-4 py-3 text-sm text-right">{cls.totalOfferings.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-right">{cls.totalPayments.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-center">{cls.weeksReported}/13</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                    {index === 0 ? '2nd Place' : index === 1 ? '3rd Place' : '4th Place'}
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
              {[
                { key: 'attendance', label: '👥 Attendance Leader', color: 'blue', value: `Avg: ${championData.categoryLeaders.attendance.avgAttendance}` },
                { key: 'offering', label: '💰 Offering Leader', color: 'green', value: `${championData.categoryLeaders.offering.totalOfferings.toLocaleString()} UGX` },
                { key: 'visits', label: '🚀 Visits Leader', color: 'purple', value: `${championData.categoryLeaders.visits.totalVisits} visits` },
                { key: 'bibleStudies', label: '📖 Bible Studies Leader', color: 'orange', value: `${championData.categoryLeaders.bibleStudies.totalBibleStudies} studies` },
                { key: 'visitors', label: '🎉 Visitors Leader', color: 'pink', value: `${championData.categoryLeaders.visitors.totalVisitors} visitors` },
                { key: 'payments', label: '💵 Payments Leader', color: 'yellow', value: `${championData.categoryLeaders.payments.totalPayments.toLocaleString()} UGX` },
              ].map((cat) => (
                <div key={cat.key} className={`bg-${cat.color}-50 rounded-lg p-6 border-2 border-${cat.color}-300`}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className={`text-lg font-semibold text-${cat.color}-900`}>{cat.label}</h4>
                    {championData.categoryLeaders[cat.key].class.id === championData.champion.class.id && (
                      <Crown className="h-6 w-6 text-yellow-500" />
                    )}
                  </div>
                  <p className={`text-xl font-bold text-${cat.color}-700`}>
                    {championData.categoryLeaders[cat.key].class.class_name}
                  </p>
                  <p className={`text-sm text-${cat.color}-600 mt-2`}>{cat.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Congratulations */}
          <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg shadow-xl p-8 text-white text-center">
            <Star className="h-16 w-16 mx-auto mb-4 animate-spin-slow" />
            <h3 className="text-3xl font-bold mb-2">Congratulations!</h3>
            <p className="text-xl mb-4">{championData.champion.class.class_name} is the Overall Champion</p>
            <p className="text-lg opacity-90">Outstanding performance across all metrics this quarter!</p>
          </div>
        </>
      )}

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