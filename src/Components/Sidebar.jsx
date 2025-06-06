import React from "react";
import { Link } from "react-router-dom";
import { LayoutDashboard, BarChart,LocateIcon, Settings, LogOut } from "lucide-react";

const Sidebar = () => {
  return (
    <div className="w-64 bg-gray-900 text-white h-screen p-5 flex flex-col">
      {/* Logo Section */}
      <div className="flex items-center space-x-2 mb-6">
        <img
          src="https://www.aru.ac.tz/site/images/logo.jpg"
          alt="Logo"
          className="w-32 h-32 border-4 border-blue-500/30 shadow-lg hover:scale-105 transition-transform duration-300 rounded-full"
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1">
        <ul className="space-y-3">
          <li>
            <Link
              to="/dashboard"
              className="flex items-center space-x-2 p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition"
            >
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </Link>
          </li>
          <li>
            <Link
              to="/stats"
              className="flex items-center space-x-2 p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition"
            >
              <BarChart size={20} />
              <span>Statistics</span>
            </Link>
          </li>
          <li>
            <Link
              to="/reports"
              className="flex items-center space-x-2 p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition"
            >
              <BarChart size={20} />
              <span>Reports</span>
            </Link>
          </li>
          <li>
            <Link
              to="/location"
              className="flex items-center space-x-2 p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition"
            >
              <LocateIcon size={20} />
              <span>Location</span>
            </Link>
          </li>
          <li>
            <Link
              to="/DeviceManagment"
              className="flex items-center space-x-2 p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition"
            >
              <LayoutDashboard size={20} />
              <span>Device Managment</span>
            </Link>
          </li>
          <li>
            <Link
              to="/settings"
              className="flex items-center space-x-2 p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition"
            >
              <Settings size={20} />
              <span>Settings</span>
            </Link>
          </li>
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="mt-auto">
        <Link
          to="/login"
          className="flex items-center space-x-2 p-3 bg-red-600 rounded-lg hover:bg-red-500 transition"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </Link>
      </div>
    </div>
  );
};

export default Sidebar;
