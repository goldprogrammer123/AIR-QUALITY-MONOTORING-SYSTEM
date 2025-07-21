import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

const MainLayout = () => {
  return (
    <div className="flex min-h-screen bg-[#f4f4f4]">
      {/* Sidebar */}
      <div className="w-64 h-screen sticky top-0">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="bg-blue rounded-xl p-6 min-h-full">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
