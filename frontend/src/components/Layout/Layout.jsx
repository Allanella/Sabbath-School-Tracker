import React, { useState, useEffect } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import InstallPWA from "../Common/InstallPWA";

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
  Crown,
  Receipt,
  Download,
  History
} from "lucide-react";

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setShowInstallButton(false);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      alert("Installation not available. Please use your browser menu to install.");
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setShowInstallButton(false);
    }

    setDeferredPrompt(null);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navigation = {
    admin: [
      { name: "Dashboard", href: "/admin", icon: Home },
      { name: "Users", href: "/admin/users", icon: Users },

      { name: "Enter Data", href: "/secretary/entry", icon: FileText },
      { name: "Payment Management", href: "/secretary/payments", icon: DollarSign },

      { name: "Member Search", href: "/reports/member-search", icon: Search },
      { name: "Class Search", href: "/reports/class-search", icon: BookOpen },
      { name: "Performance Comparison", href: "/reports/performance", icon: TrendingUp },
      { name: "Class Rankings", href: "/reports/rankings", icon: Trophy },
      { name: "Overall Champion", href: "/reports/champion", icon: Crown },

      { name: "Payment Report", href: "/reports/payments", icon: Receipt },
      { name: "Payment History", href: "/reports/payment-history", icon: History },

      { name: "Weekly Reports", href: "/reports/weekly", icon: FileText },
      { name: "Quarterly Reports", href: "/reports/quarterly", icon: BarChart3 },
      { name: "Financial Reports", href: "/reports/financial", icon: DollarSign },
    ],

    ss_secretary: [
      { name: "Dashboard", href: "/secretary", icon: Home },
      { name: "Enter Data", href: "/secretary/entry", icon: FileText },
      { name: "Payment Management", href: "/secretary/payments", icon: DollarSign },

      { name: "Member Search", href: "/reports/member-search", icon: Search },
      { name: "Class Search", href: "/reports/class-search", icon: BookOpen },
      { name: "Performance Comparison", href: "/reports/performance", icon: TrendingUp },
      { name: "Class Rankings", href: "/reports/rankings", icon: Trophy },
      { name: "Overall Champion", href: "/reports/champion", icon: Crown },

      { name: "Payment Report", href: "/reports/payments", icon: Receipt },
      { name: "Payment History", href: "/reports/payment-history", icon: History },

      { name: "Weekly Reports", href: "/reports/weekly", icon: FileText },
      { name: "Quarterly Reports", href: "/reports/quarterly", icon: BarChart3 },
    ],

    viewer: [
      { name: "Member Search", href: "/reports/member-search", icon: Search },
      { name: "Class Search", href: "/reports/class-search", icon: BookOpen },
      { name: "Performance Comparison", href: "/reports/performance", icon: TrendingUp },
      { name: "Class Rankings", href: "/reports/rankings", icon: Trophy },
      { name: "Overall Champion", href: "/reports/champion", icon: Crown },

      { name: "Payment Report", href: "/reports/payments", icon: Receipt },
      { name: "Payment History", href: "/reports/payment-history", icon: History },

      { name: "Weekly Reports", href: "/reports/weekly", icon: FileText },
      { name: "Quarterly Reports", href: "/reports/quarterly", icon: BarChart3 },
      { name: "Financial Reports", href: "/reports/financial", icon: DollarSign },
    ],
  };

  const currentNav = navigation[user?.role] || navigation.viewer;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-30 h-screen w-64 bg-indigo-800 text-white
        transform transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        flex flex-col`}
      >
        <div className="flex items-center justify-between p-4 border-b border-indigo-700">
          <h1 className="text-xl font-bold">SS Tracker</h1>

          <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">

          {/* ADMIN SETUP LINKS */}
          {user?.role === "admin" && (
            <>
              <Link
                to="/admin/quarters"
                className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition ${
                  location.pathname === "/admin/quarters"
                    ? "bg-indigo-700"
                    : "text-gray-200 hover:bg-indigo-700"
                }`}
              >
                <Calendar className="h-5 w-5" />
                <span>Quarter Setup</span>
              </Link>

              <Link
                to="/admin/classes"
                className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition ${
                  location.pathname === "/admin/classes"
                    ? "bg-indigo-700"
                    : "text-gray-200 hover:bg-indigo-700"
                }`}
              >
                <Users className="h-5 w-5" />
                <span>Class Setup</span>
              </Link>
            </>
          )}

          {/* OTHER NAVIGATION */}
          {currentNav.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                location.pathname === item.href
                  ? "bg-indigo-700"
                  : "hover:bg-indigo-700"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          ))}

          {/* INSTALL APP BUTTON */}
          {showInstallButton && (
            <button
              onClick={handleInstall}
              className="flex items-center space-x-3 px-4 py-3 rounded-lg bg-green-600 hover:bg-green-700 w-full mt-4"
            >
              <Download className="h-5 w-5" />
              <span>Install App</span>
            </button>
          )}
        </nav>

        {/* USER INFO */}
        <div className="p-4 border-t border-indigo-700 bg-indigo-900">
          <p className="text-xs text-indigo-300">Logged in as</p>
          <p className="font-semibold text-sm">{user?.full_name}</p>

          <button
            onClick={handleLogout}
            className="flex items-center justify-center space-x-2 w-full mt-3 px-4 py-2 bg-indigo-700 rounded-lg hover:bg-indigo-600"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="lg:ml-64 flex flex-col min-h-screen">

        {/* HEADER */}
        <header className="bg-white shadow sticky top-0 z-10">
          <div className="flex items-center justify-between px-4 py-4">

            <button onClick={() => setSidebarOpen(true)} className="lg:hidden">
              <Menu className="h-6 w-6 text-gray-700" />
            </button>

            <h2 className="text-xl font-semibold text-gray-800">
              Kanyanya SDA Church - Sabbath School Tracker
            </h2>

            {showInstallButton && (
              <button
                onClick={handleInstall}
                className="hidden md:flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg"
              >
                <Download className="h-4 w-4" />
                <span>Install</span>
              </button>
            )}
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>

        {/* FOOTER */}
        <footer className="bg-white border-t py-4">
          <div className="flex items-center justify-between text-sm text-gray-600 px-6">
            <p>© {new Date().getFullYear()} Kanyanya SDA Church</p>

            <div className="flex items-center space-x-1">
              <span>Developed with</span>
              <Heart className="h-4 w-4 text-red-500 fill-current animate-pulse" />
              <span>by</span>
              <span className="font-semibold text-indigo-600">
                Baliddawa Allan
              </span>
            </div>
          </div>
        </footer>
      </div>

      <InstallPWA />
    </div>
  );
};

export default Layout;