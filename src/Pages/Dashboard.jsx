import React, { useState, useEffect } from "react";
import { Line, Bar } from "react-chartjs-2";
import "chartjs-adapter-date-fns";
import { subDays, eachHourOfInterval, addHours } from "date-fns";
import { fetchWithCache } from "../utils/dataUtils";
import {
  calculateAQI,
  getAQIStatus,
  extractPollutantData,
} from "../utils/aqiUtils";
import { Activity, AlertTriangle, CheckCircle } from "lucide-react";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  TimeScale,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  TimeScale,
  Filler
);

export default function Dashboard({}) {
  const [selectedSensor, setSelectedSensor] = useState(null);
  const [data, setData] = useState([]);
  const [sensors, setSensors] = useState([]);
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentAQI, setCurrentAQI] = useState(0);
  const [dominantPollutant, setDominantPollutant] = useState("None");
  const [selectedTimeRange, setSelectedTimeRange] = useState("24h");
  const [dataWarning, setDataWarning] = useState("");
  const [pollutantValues, setPollutantValues] = useState({
    nox: 0,
    voc: 0,
    co2: 0,
    benzene: 0,
  });

  /*  get latest pollutants for a sensor */
 // FIXED: getLatestPollutants
const getLatestPollutants = (sensorId, dataSubset = data) => {
  const sensorData = dataSubset.filter(d => d.id === sensorId);
  if (sensorData.length === 0) {
    return { nox: 0, voc: 0, co2: 0, benzene: 0 };
  }

  // Find the most recent timestamp
  const latestTime = Math.max(...sensorData.map(d => new Date(d._time).getTime()));
  const latestEntries = sensorData.filter(d => new Date(d._time).getTime() === latestTime);

  // Initialize pollutants object
  const pollutants = { nox: 0, voc: 0, co2: 0, benzene: 0 };
  
  latestEntries.forEach(entry => {
    if (entry.parameter in pollutants) {
      pollutants[entry.parameter] = entry.value;
    }
  });

  return pollutants;
};

  /*AIR QUALITY API */
// FIXED: Inside fetchAirData — the part that was crashing
const fetchAirData = async () => {
  const result = await fetchWithCache(
    "/api/sensordata/?format=json",
    "dashboard_data"
  );

  console.log("Raw API response:", result);

  if (!result || result.length === 0) {
    setDataWarning("No sensor data received from API");
    setLoading(false);
    return;
  }

  // ... [your existing normalization code] ...

  const processed = (result || []).flatMap((item) => {
    const measurements = item.measurements || [];
    const timestamp = item.received_at || item.timestamp || new Date().toISOString();
    const deviceId = item.device_id || item.sensor_id || item.id || "unknown";

    return measurements.map((m) => {
      const param =
        m.parameter?.toLowerCase() ||
        m.pollutant?.toLowerCase() ||
        m.type?.toLowerCase() ||
        m.name?.toLowerCase() ||
        m.channel?.toLowerCase() ||
        String(m.key || "").toLowerCase();

      const normalizedParam = {
        nox: "nox", no2: "nox", "no2 (ppb)": "nox",
        voc: "voc", tvoc: "voc", "voc (ppb)": "voc",
        co2: "co2", "co2 (ppm)": "co2",
        benzene: "benzene", c6h6: "benzene", "benzene (ppb)": "benzene",
      }[param] || param;

      return {
        id: deviceId,
        parameter: normalizedParam,
        value: parseFloat(m.value) || 0,
        _time: timestamp,
      };
    });
  });

  const validData = processed.filter(d => 
    ["nox", "voc", "co2", "benzene"].includes(d.parameter)
  );

  console.log("Processed data:", validData);

  if (validData.length === 0) {
    setDataWarning("No valid pollutant data found. Check parameter names.");
  } else {
    setDataWarning("");
  }

  setData(validData);

  const uniqueSensors = [...new Set(validData.map(d => d.id))].sort();
  setSensors(uniqueSensors);

  // FIXED: This part was causing the crash
  let total = { nox: 0, voc: 0, co2: 0, benzene: 0 };
  let count = 0;

  uniqueSensors.forEach(sensorId => {
    const latest = getLatestPollutants(sensorId, validData);  // ← now works!
    if (Object.values(latest).some(v => v > 0)) {
      Object.keys(total).forEach(k => {
        total[k] += latest[k];
      });
      count++;
    }
  });

  if (count > 0) {
    Object.keys(total).forEach(k => total[k] /= count);
  }

  setPollutantValues(total);

  const { aqi, pollutant } = calculateAQI(
    total.nox,
    total.voc,
    total.co2,
    total.benzene
  );

  setCurrentAQI(Math.round(aqi));
  setDominantPollutant(pollutant || "None");
};

  /*  WEATHER API*/
  const fetchWeatherData = async () => {
    try {
      const apiKey = "09d92c7839a7f3b96baeddbb21bd26dc";
      const city = "Dar es Salaam";
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

      const response = await fetch(url);
      const result = await response.json();
      setWeatherData({
        temperature: `${Math.round(result.main.temp)} °C`,
        humidity: `${Math.round(result.main.humidity)} %`,
        pressure: `${Math.round(result.main.pressure)} hPa`,
        windSpeed: `${result.wind.speed.toFixed(1)} m/s`,
        visibility: `${((result.visibility || 10000) / 1000).toFixed(1)} km`,
      });
    } catch (error) {
      console.error("Weather error:", error);
    }
  };

  useEffect(() => {
    Promise.all([fetchAirData(), fetchWeatherData()]).finally(() =>
      setLoading(false)
    );
  }, []);

  /*AQI general */
  const createHistoricalData = (sensorId = null) => {
    const endDate = new Date();
    const startDate =
      selectedTimeRange === "24h" ? subDays(endDate, 1) : subDays(endDate, 7);

    const filteredData = sensorId ? data.filter((d) => d.id === sensorId) : data;

    return eachHourOfInterval({ start: startDate, end: endDate }).map(
      (hour) => {
        const hourStart = hour;
        const hourEnd = addHours(hour, 1);
        const hourData = filteredData.filter(
          (item) => {
            const t = new Date(item._time);
            return t >= hourStart && t < hourEnd;
          }
        );
        const pollutantData = extractPollutantData(hourData);
        const { aqi } = calculateAQI(
          pollutantData.nox,
          pollutantData.voc,
          pollutantData.co2,
          pollutantData.benzene
        );
        return { x: hour, y: aqi || 0 };
      }
    );
  };

  // sensor status badge
  const getSensorStatus = (aqi) => {
    if (aqi <= 50) return { label: "Good", color: "bg-green-500" };
    if (aqi <= 100) return { label: "Moderate", color: "bg-yellow-500" };
    return { label: "Poor", color: "bg-red-500" };
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  // Get current pollutants for display (selected or average)
  const displayPollutants = selectedSensor
    ? getLatestPollutants(selectedSensor, data)
    : pollutantValues;

  return (
    <div className="space-y-10 p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800">
            Air Quality Dashboard
          </h1>
          <p className="text-slate-500 mt-1">
            Live environmental and weather monitoring
          </p>
        </div>

        <div className="px-6 py-2 text-sm rounded-full border border-blue-400 shadow-lg w-fit">
          Dominant Pollutant: {dominantPollutant}
        </div>
      </div>

      {/* ================= AQI + POLLUTANTS ================= */}
      <h1>Summary of data from sensors</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <div className="rounded-2xl p-5 bg-white border border-blue-400 shadow-xl">
          <p className="text-sm opacity-80 text-green-400">AQI</p>
          <p className="text-4xl font-bold mt-2">{currentAQI}</p>
        </div>

        {[
          ["NOx", displayPollutants.nox],
          ["VOC", displayPollutants.voc],
          ["CO2", displayPollutants.co2],
          ["Benzene", displayPollutants.benzene],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl p-5 bg-white shadow-xl border border-blue-400 hover:scale-105 transition"
          >
            <p className="text-sm text-slate-500">{label}</p>
            <p className="text-3xl font-bold text-slate-800 mt-2">
              {Number(value).toFixed(2)}
            </p>
          </div>
        ))}

        <div className="rounded-2xl bg-white border border-blue-400 p-6 shadow-xl text-center">
          <p className="text-sm opacity-80">Total Sensors</p>
          <p className="text-4xl font-bold mt-2">{sensors.length}</p>
        </div>
      </div>

      {/* ================= WEATHER ================= */}
      {weatherData && (
        <div className="p-6 bg-blue-200 rounded-xl py-8">
          <h2 className="text-xl font-bold text-slate-800 mb-4">
            Current Weather – Dar es Salaam
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {Object.entries(weatherData).map(([key, value]) => (
              <div
                key={key}
                className="rounded-xl p-4 bg-slate-50 border border-blue-400 text-center"
              >
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  {key}
                </p>
                <p className="text-2xl font-bold text-slate-800 mt-1">
                  {value}
                </p>
              </div>
            ))}
          </div>
          <div className="p-3 text-gray-500">
            <p>
              Weather Impact: Moderate wind conditions are helping disperse
              pollutants. Air quality expected to improve throughout the day
            </p>
          </div>
        </div>
      )}

      {/* ================= SENSORS ================= */}
      <div className="bg-white rounded-3xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-800">Available Sensors</h2>
          {selectedSensor && (
            <button
              onClick={() => setSelectedSensor(null)}
              className="px-4 py-1.5 rounded-full text-sm font-semibold bg-slate-200 text-slate-700 hover:bg-slate-300 transition"
            >
              View All Sensors
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sensors.map((sensor) => {
            const pollutants = getLatestPollutants(sensor, data);
            const { aqi, pollutant } = calculateAQI(
              pollutants.nox,
              pollutants.voc,
              pollutants.co2,
              pollutants.benzene
            );
            const status = getSensorStatus(aqi);
            return (
              <div
                key={sensor}
                className={`p-4 border rounded-lg border-blue-400 cursor-pointer hover:shadow-md transition ${
                  selectedSensor === sensor ? "bg-blue-50 border border-blue-400" : ""
                }`}
                onClick={() => setSelectedSensor(sensor)}
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-800">Sensor {sensor}</span>
                  <span
                    className={`px-3 py-1 rounded-full text-white text-sm ${status.color}`}
                  >
                    {status.label}
                  </span>
                </div>
                <div className="mt-2">
                  <span className="text-lg font-bold">{aqi}</span> AQI
                </div>
                <div className="text-sm text-slate-500">
                  Dominant: {pollutant}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* ================= AQI TREND CARD ================= */}
        <div className="bg-white rounded-3xl shadow border border-blue-400 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-slate-800">
                AQI Trend {selectedSensor ? `for Sensor ${selectedSensor}` : "(All Sensors)"}
              </h3>
              <p className="text-sm text-slate-500">
                Air Quality Index over time
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedTimeRange("24h")}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${
                  selectedTimeRange === "24h"
                    ? "bg-emerald-500 text-white shadow"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                24H
              </button>

              <button
                onClick={() => setSelectedTimeRange("7d")}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${
                  selectedTimeRange === "7d"
                    ? "bg-emerald-500 text-white shadow"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                7D
              </button>
            </div>
          </div>

          <div className="flex-1 h-80 bg-slate-50 rounded-2xl p-4">
            <Line
              data={{
                datasets: [
                  {
                    label: "AQI",
                    data: createHistoricalData(selectedSensor),
                    borderColor: "#10b981",
                    backgroundColor: "rgba(16,185,129,0.25)",
                    fill: true,
                    tension: 0.4,
                    pointRadius: 2,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: { mode: "index", intersect: false },
                },
                scales: {
                  x: {
                    type: "time",
                    time: {
                      unit: selectedTimeRange === "24h" ? "hour" : "day",
                      displayFormats: {
                        hour: "HH:mm",
                        day: "MMM d",
                      },
                    },
                    title: { display: true, text: "Time" },
                  },
                  y: {
                    min: 0,
                    max: 300,
                    title: { display: true, text: "AQI Value" },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* ================= POLLUTANT TREND CARD ================= */}
        <div className="bg-white rounded-3xl shadow border border-blue-400 p-6 flex flex-col">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-slate-800">
              Pollutant Levels {selectedSensor ? `for Sensor ${selectedSensor}` : "(All Sensors)"}
            </h3>
            <p className="text-sm text-slate-500">
              Current concentration by type
            </p>
          </div>

          <div className="flex-1 h-80 bg-slate-50 rounded-2xl p-4">
            <Bar
              data={{
                labels: ["NOx", "VOC", "CO2", "Benzene"],
                datasets: [
                  {
                    label: "Pollutant Levels",
                    data: Object.values(displayPollutants),
                    backgroundColor: [
                      "#0ea5e9",
                      "#22c55e",
                      "#f59e0b",
                      "#ef4444",
                    ],
                    borderRadius: 10,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: { mode: "index", intersect: false },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    title: { display: true, text: "Concentration" },
                  },
                },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}