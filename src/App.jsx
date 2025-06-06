import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import MainLayout from "./Components/MainLayout";
import Dashboard from "./Pages/Dashboard";
import Reports from "./Pages/Reports";
import Stats from "./Pages/Stats";
import Settings from "./Pages/Settings";
import Location from "./Pages/location";
import DeviceManagement from "./Pages/DeviceManagement";

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Public Route */}
       

        {/* Protected Routes with Sidebar */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="reports" element={<Reports />} />
          <Route path="stats" element={<Stats />} />
          <Route path="settings" element={<Settings />} />
          <Route path="location" element={<Location />} />
          <Route path="DeviceManagment" element={<DeviceManagement />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
