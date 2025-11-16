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
  BarChart3
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
      { name: 'Weekly Reports', href: '/reports/weekly', icon: FileText },
      { name: 'Quarterly Reports', href: '/reports/quarterly', icon: BarChart3 },
      { name: 'Financial Reports', href: '/reports/financial', icon: DollarSign },
    ],
    secretary: [
      { name: 'Dashboard', href: '/secretary', icon: Home },
      { name: 'Enter Data', href: '/secretary/entry', icon: FileText },
      { name: 'Weekly Reports', href: '/reports/weekly', icon: FileText },
      { name: 'Quarterly Reports', href: '/reports/quarterly', icon: BarChart3 },
    ],
    viewer: [
      { name: 'Weekly Reports', href: '/reports/weekly', icon: FileText },
      { name: 'Quarterly Reports', href: '/reports/quarterly', icon: BarChart3 },
      { name: 'Financial Reports', href: '/reports/financial', icon: DollarSign },
    ]
  };

  const currentNav = navigation[user?.role] || navigation.viewer;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-30 h-screen w-64 bg-primary-800 text-white transition-transform
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center justify-between p-4 border-b border-primary-700">
          <h1 className="text-xl font-bold">SS Tracker</h1>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {currentNav.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-primary-700 transition"
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-primary-700">
          <div className="mb-4">
            <p className="text-sm text-primary-200">Logged in as</p>
            <p className="font-medium">{user?.full_name}</p>
            <p className="text-xs text-primary-300 capitalize">{user?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 w-full px-4 py-2 bg-primary-700 rounded-lg hover:bg-primary-600 transition"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top bar */}
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="flex items-center justify-between px-4 py-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h2 className="text-xl font-semibold text-gray-800">
              {import.meta.env.VITE_CHURCH_NAME || 'Sabbath School Tracker'}
            </h2>
            <div className="w-10" /> {/* Spacer for mobile */}
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;