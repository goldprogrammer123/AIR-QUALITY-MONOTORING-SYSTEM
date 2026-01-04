import {
  Cpu,
  Download,
  Home,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  MapPin,
  TrendingUp,
  Wind,
} from "lucide-react";
import React from "react";
import { NavLink } from "react-router-dom";

const Sidebar = ({ isOpen, setIsOpen }) => {
  const navItems = [
  { name: "System Overview", path: "/overview", icon: <LayoutDashboard size={20} /> },
  { name: "Dashboard", path: "/dashboard", icon: <Home size={20} /> },
  { name: "Sensor Devices", path: "/sensors", icon: <Cpu size={20} /> },
  { name: "Data Export", path: "/data-export", icon: <Download size={20} /> },
  { name: "Air Report", path: "/air-report", icon: <Wind size={20} /> },
  { name: "Predictions", path: "/predictions", icon: <TrendingUp size={20} /> },
  { name: "Sensor Location", path: "/location", icon: <MapPin size={20} /> },
  { name: "Recommendations", path: "/recommendations", icon: <Lightbulb size={20} /> },
  { name: "Weather Status", path: "/weather", icon: <Lightbulb size={20} /> },


];

  return (
    <>
      {/* BACKDROP (BELOW HEADER) */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          style={{ top: "72px" }}
        />
      )}

      {/*  SIDEBAR BELOW HEADER */}
      <div
        className={`fixed left-0 h-screen w-64 bg-white shadow-lg p-6 z-50
        transition-transform duration-300
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0`}
        style={{ top: "72px" }} 
      >
      

        <ul className="space-y-4">
          {navItems.map((item, index) => (
            <li key={index}>
              <NavLink
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 p-3 rounded-lg transition-all
                  ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:bg-gray-200"
                  }`
                }
              >
                {item.icon}
                <span>{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="mt-10 pt-5 border-t">
          <button className="flex items-center gap-3 text-red-600 font-semibold">
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;

