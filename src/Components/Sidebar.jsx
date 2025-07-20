import React from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  BarChart,
  MapPin,
  Activity,
  FileText,
  Cloud,
  Lightbulb,
  TrendingUp,
} from "lucide-react";

const Sidebar = () => {
  return (
    <div className="w-64 glass h-screen p-5 flex flex-col">
      {/* Logo Section */}
      <div className="flex items-center justify-center mb-8">
        <div className="relative">
          <img
            src="https://www.aru.ac.tz/site/images/logo.jpg"
            alt="Logo"
            className="w-24 h-24 rounded-full border-4 border-emerald-400/30 shadow-2xl hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400/20 to-transparent"></div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1">
        <ul className="space-y-3">
          <li>
            <Link
              to="/overview"
              className="flex items-center space-x-3 p-4 glass-card rounded-xl hover:bg-emerald-500/20 transition-all duration-300 group"
            >
              <Activity
                size={20}
                className="text-emerald-400 group-hover:text-white transition-colors"
              />
              <span className="text-white font-medium">System Overview</span>
            </Link>
          </li>
          <li>
            <Link
              to="/dashboard"
              className="flex items-center space-x-3 p-4 glass-card rounded-xl hover:bg-emerald-500/20 transition-all duration-300 group"
            >
              <LayoutDashboard
                size={20}
                className="text-emerald-400 group-hover:text-white transition-colors"
              />
              <span className="text-white font-medium">Dashboard</span>
            </Link>
          </li>
          <li>
            <Link
              to="/air-report"
              className="flex items-center space-x-3 p-4 glass-card rounded-xl hover:bg-emerald-500/20 transition-all duration-300 group"
            >
              <TrendingUp
                size={20}
                className="text-emerald-400 group-hover:text-white transition-colors"
              />
              <span className="text-white font-medium">Air Report</span>
            </Link>
          </li>
          <li>
            <Link
              to="/recommendations"
              className="flex items-center space-x-3 p-4 glass-card rounded-xl hover:bg-emerald-500/20 transition-all duration-300 group"
            >
              <Lightbulb
                size={20}
                className="text-emerald-400 group-hover:text-white transition-colors"
              />
              <span className="text-white font-medium">Recommendations</span>
            </Link>
          </li>
          <li>
            <Link
              to="/weather"
              className="flex items-center space-x-3 p-4 glass-card rounded-xl hover:bg-emerald-500/20 transition-all duration-300 group"
            >
              <Cloud
                size={20}
                className="text-emerald-400 group-hover:text-white transition-colors"
              />
              <span className="text-white font-medium">Weather Status</span>
            </Link>
          </li>
          <li>
            <Link
              to="/location"
              className="flex items-center space-x-3 p-4 glass-card rounded-xl hover:bg-emerald-500/20 transition-all duration-300 group"
            >
              <MapPin
                size={20}
                className="text-emerald-400 group-hover:text-white transition-colors"
              />
              <span className="text-white font-medium">Sensor Locations</span>
            </Link>
          </li>
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="mt-auto">
        <Link
          to="/"
          className="flex items-center space-x-3 p-4 glass-button rounded-xl text-white font-medium transition-all duration-300"
        >
          <FileText size={20} />
          <span>Back Home</span>
        </Link>
      </div>
    </div>
  );
};

export default Sidebar;
