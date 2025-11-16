import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, BookOpen, Calendar, TrendingUp } from 'lucide-react';
import classService from '../../services/classService';
import quarterService from '../../services/quarterService';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    activeQuarter: null,
    totalClasses: 0,
    loading: true
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [quarterRes, classesRes] = await Promise.all([
        quarterService.getActive(),
        classService.getAll()
      ]);

      setStats({
        activeQuarter: quarterRes.data,
        totalClasses: classesRes.data?.length || 0,
        loading: false
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  const cards = [
    { 
      title: 'Active Quarter', 
      value: stats.activeQuarter ? `${stats.activeQuarter.name} ${stats.activeQuarter.year}` : 'None',
      icon: Calendar,
      link: '/admin/quarters',
      color: 'bg-blue-500'
    },
    { 
      title: 'Total Classes', 
      value: stats.totalClasses,
      icon: BookOpen,
      link: '/admin/classes',
      color: 'bg-green-500'
    },
    { 
      title: 'User Management', 
      value: 'Manage',
      icon: Users,
      link: '/admin/users',
      color: 'bg-purple-500'
    },
    { 
      title: 'Reports', 
      value: 'View',
      icon: TrendingUp,
      link: '/reports/weekly',
      color: 'bg-orange-500'
    },
  ];

  if (stats.loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((card) => (
          <Link key={card.title} to={card.link}>
            <div className="card hover:shadow-md transition cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${card.color}`}>
                  <card.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link to="/admin/quarters" className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
              <p className="font-medium">Setup New Quarter</p>
              <p className="text-sm text-gray-600">Create and manage quarters</p>
            </Link>
            <Link to="/admin/classes" className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
              <p className="font-medium">Add New Class</p>
              <p className="text-sm text-gray-600">Register Sabbath School classes</p>
            </Link>
            <Link to="/reports/quarterly" className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
              <p className="font-medium">View Reports</p>
              <p className="text-sm text-gray-600">Access quarterly and weekly reports</p>
            </Link>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-4">System Information</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Church Name:</span>
              <span className="font-medium">Kanyanya SDA Church</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Active Quarter:</span>
              <span className="font-medium">
                {stats.activeQuarter ? `${stats.activeQuarter.name} ${stats.activeQuarter.year}` : 'None'}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Total Classes:</span>
              <span className="font-medium">{stats.totalClasses}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;