import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import weeklyDataService from '../../services/WeeklyDataService';
import classService from '../../services/classService';
import { 
  Plus, 
  FileText, 
  Calendar, 
  Users, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const SecretaryDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalClasses: 0,
    entriesThisWeek: 0,
    totalEntries: 0,
    recentEntries: []
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load classes
      const classesResponse = await classService.getAll();
      const classes = classesResponse.data || [];

      // Load recent entries (limit to 5)
      const allEntries = [];
      for (const cls of classes) {
        try {
          const entriesResponse = await weeklyDataService.getByClass(cls.id);
          const entries = entriesResponse.data || [];
          
          entries.forEach(entry => {
            allEntries.push({
              ...entry,
              class_name: cls.class_name,
              quarter: cls.quarter
            });
          });
        } catch (error) {
          console.error(`Error loading entries for class ${cls.id}:`, error);
        }
      }

      // Sort by created date (most recent first)
      allEntries.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      // Get current week number
      const currentWeek = getCurrentWeekOfQuarter();

      // Count entries this week
      const entriesThisWeek = allEntries.filter(e => e.week_number === currentWeek).length;

      setStats({
        totalClasses: classes.length,
        entriesThisWeek,
        totalEntries: allEntries.length,
        recentEntries: allEntries.slice(0, 5)
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentWeekOfQuarter = () => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const weekOfYear = Math.ceil((((now - startOfYear) / 86400000) + startOfYear.getDay() + 1) / 7);
    return ((weekOfYear - 1) % 13) + 1;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const StatCard = ({ icon: Icon, title, value, color, description }) => (
    <div className="bg-white rounded-lg shadow p-6 border-l-4" style={{ borderColor: color }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {description && (
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          )}
        </div>
        <div className="p-3 rounded-full" style={{ backgroundColor: `${color}20` }}>
          <Icon className="h-8 w-8" style={{ color }} />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {user?.full_name}! 👋
            </h1>
            <p className="text-indigo-100">
              Ready to track this week's Sabbath School data?
            </p>
          </div>
          <button
            onClick={() => navigate('/secretary/entry')}
            className="flex items-center space-x-2 px-6 py-3 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-indigo-50 transition shadow-lg"
          >
            <Plus className="h-5 w-5" />
            <span>Enter Data</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Users}
          title="Total Classes"
          value={stats.totalClasses}
          color="#3b82f6"
          description="Classes you manage"
        />
        <StatCard
          icon={CheckCircle}
          title="This Week"
          value={stats.entriesThisWeek}
          color="#10b981"
          description="Entries submitted"
        />
        <StatCard
          icon={FileText}
          title="Total Entries"
          value={stats.totalEntries}
          color="#8b5cf6"
          description="All time records"
        />
        <StatCard
          icon={TrendingUp}
          title="Completion"
          value={`${Math.round((stats.entriesThisWeek / stats.totalClasses) * 100)}%`}
          color="#f59e0b"
          description="Week progress"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => navigate('/secretary/entry')}
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition text-left"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Plus className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Enter Weekly Data</h3>
              <p className="text-sm text-gray-600">Add new entry</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate('/reports/weekly')}
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition text-left"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">View Reports</h3>
              <p className="text-sm text-gray-600">Check weekly data</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate('/reports/quarterly')}
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition text-left"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Quarter Summary</h3>
              <p className="text-sm text-gray-600">View analytics</p>
            </div>
          </div>
        </button>
      </div>

      {/* Recent Entries */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Recent Entries</h2>
            <button
              onClick={() => navigate('/reports/weekly')}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              View All →
            </button>
          </div>
        </div>

        {stats.recentEntries.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No entries yet</p>
            <button
              onClick={() => navigate('/secretary/entry')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              Create First Entry
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {stats.recentEntries.map((entry, index) => (
              <div key={index} className="p-6 hover:bg-gray-50 transition">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-semibold text-gray-900">{entry.class_name}</h3>
                      <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
                        Week {entry.week_number}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(entry.sabbath_date)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>{entry.total_attendance} attendees</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>Entered {formatDate(entry.created_at)}</span>
                      </div>
                    </div>
                    {entry.submitted_by_user?.full_name && (
                      <p className="mt-1 text-xs text-gray-500">
                        Submitted by: {entry.submitted_by_user.full_name}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => navigate(`/secretary/entry?class=${entry.class_id}&week=${entry.week_number}`)}
                    className="ml-4 px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                  >
                    View/Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SecretaryDashboard;