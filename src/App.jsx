import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import MainLayout from "./Components/MainLayout";
import Dashboard from "./Pages/Dashboard";
import AirReport from "./Pages/AirReport";
import Recommendations from "./Pages/Recommendations";
import WeatherStatus from "./Pages/WeatherStatus";
import Location from "./Pages/location";
import SystemOverview from "./Pages/SystemOverview";
import Home from "./Components/Home";


const App = () => {
  return (
    <Router>
      <Routes>
        {/* Public Route */}
       <Route path="/" element={<Home />} />

        {/* Protected Routes with Sidebar */}
        <Route path="" element={<MainLayout />}>
          <Route path="overview" element={<SystemOverview />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="air-report" element={<AirReport />} />
          <Route path="recommendations" element={<Recommendations />} />
          <Route path="weather" element={<WeatherStatus />} />
          <Route path="location" element={<Location />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
