import React, { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Menu,
  X,
  Home,
  Users,
  Calendar,
  BookOpen,
  FileText,
  DollarSign,
  LogOut,
  BarChart3,
  Heart,
  Search,
  TrendingUp,
  Trophy,
  Crown
} from 'lucide-react';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = {
    admin: [
      { name: 'Dashboard', href: '/admin', icon: Home },
      { name: 'Users', href: '/admin/users', icon: Users },
      { name: 'Quarters', href: '/admin/quarters', icon: Calendar },
      { name: 'Classes', href: '/admin/classes', icon: BookOpen },
      { name: 'Enter Data', href: '/secretary/entry', icon: FileText },
      { name: 'Member Search', href: '/reports/member-search', icon: Search },
      { name: 'Class Search', href: '/reports/class-search', icon: BookOpen },
      { name: 'Performance Comparison', href: '/reports/performance', icon: TrendingUp },
      { name: 'Class Rankings', href: '/reports/rankings', icon: Trophy },
      { name: 'Overall Champion', href: '/reports/champion', icon: Crown },
      { name: 'Weekly Reports', href: '/reports/weekly', icon: FileText },
      { name: 'Quarterly Reports', href: '/reports/quarterly', icon: BarChart3 },
      { name: 'Financial Reports', href: '/reports/financial', icon: DollarSign },
    ],
    ss_secretary: [
      { name: 'Dashboard', href: '/secretary', icon: Home },
      { name: 'Enter Data', href: '/secretary/entry', icon: FileText },
      { name: 'Member Search', href: '/reports/member-search', icon: Search },
      { name: 'Class Search', href: '/reports/class-search', icon: BookOpen },
      { name: 'Performance Comparison', href: '/reports/performance', icon: TrendingUp },
      { name: 'Class Rankings', href: '/reports/rankings', icon: Trophy },
      { name: 'Overall Champion', href: '/reports/champion', icon: Crown },
      { name: 'Weekly Reports', href: '/reports/weekly', icon: FileText },
      { name: 'Quarterly Reports', href: '/reports/quarterly', icon: BarChart3 },
    ],
    viewer: [
      { name: 'Member Search', href: '/reports/member-search', icon: Search },
      { name: 'Class Search', href: '/reports/class-search', icon: BookOpen },
      { name: 'Performance Comparison', href: '/reports/performance', icon: TrendingUp },
      { name: 'Class Rankings', href: '/reports/rankings', icon: Trophy },
      { name: 'Overall Champion', href: '/reports/champion', icon: Crown },
      { name: 'Weekly Reports', href: '/reports/weekly', icon: FileText },
      { name: 'Quarterly Reports', href: '/reports/quarterly', icon: BarChart3 },
      { name: 'Financial Reports', href: '/reports/financial', icon: DollarSign },
    ]
  };

  const currentNav = navigation[user?.role] || navigation.viewer;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-30 h-screen w-64
          bg-indigo-800 text-white
          transform transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col
        `}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between p-4 border-b border-indigo-700 flex-shrink-0">
          <h1 className="text-xl font-bold">SS Tracker</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation - scrollable if too many items */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {currentNav.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className="flex items-center space-x-3 px-4 py-3 rounded-lg
                         hover:bg-indigo-700 transition"
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>

        {/* User info + logout - fixed at bottom */}
        <div className="flex-shrink-0 p-4 border-t border-indigo-700 bg-indigo-900">
          <div className="mb-3">
            <p className="text-xs text-indigo-300 mb-1">Logged in as</p>
            <p className="font-semibold text-sm truncate" title={user?.full_name}>
              {user?.full_name}
            </p>
            <p className="text-xs text-indigo-300 capitalize mt-0.5">
              {user?.role === 'ss_secretary' ? 'SS Secretary' : user?.role}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center justify-center space-x-2 w-full
                       px-4 py-2.5 bg-indigo-700 rounded-lg
                       hover:bg-indigo-600 transition text-sm font-medium"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="lg:ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="bg-white shadow sticky top-0 z-10">
          <div className="flex items-center justify-between px-4 py-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden"
            >
              <Menu className="h-6 w-6 text-gray-700" />
            </button>

            <h2 className="text-xl font-semibold text-gray-800">
              Kanyanya SDA Church - Sabbath School Tracker
            </h2>

            <div className="w-10" />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>

        {/* Footer with developer credit */}
        <footer className="bg-white border-t border-gray-200 py-4 mt-auto">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between text-sm text-gray-600">
              {/* Left side - Copyright */}
              <div className="mb-2 md:mb-0 text-center md:text-left">
                <p>© {new Date().getFullYear()} Kanyanya SDA Church. All rights reserved.</p>
              </div>

              {/* Right side - Developer Credit */}
              <div className="flex items-center justify-center space-x-1">
                <span>Developed with</span>
                <Heart className="h-4 w-4 text-red-500 fill-current animate-pulse" />
                <span>by</span>
                <span className="font-semibold text-indigo-600">
                  Baliddawa Allan
                </span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Layout;