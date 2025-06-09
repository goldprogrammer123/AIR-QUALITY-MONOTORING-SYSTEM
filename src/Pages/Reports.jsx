import React, { useState, useEffect } from 'react';
import { fetchWithCache } from '../utils/dataUtils';
import { format, subMinutes } from 'date-fns';

const Reports = () => {
  const [data, setData] = useState([]);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qualityScores, setQualityScores] = useState({});
  const [overallScore, setOverallScore] = useState(0);
  const [deviceStatus, setDeviceStatus] = useState({});

  const measurementRanges = {
    temperature: { min: 15, max: 30, reverse: false },
    humidity: { min: 30, max: 70, reverse: false },
    co2: { min: 400, max: 1500, reverse: true },
    tvoc: { min: 0, max: 1000, reverse: true },
    pm25: { min: 0, max: 50, reverse: true },
    pm10: { min: 0, max: 100, reverse: true }
  };

  const calculateScore = (value, range) => {
    const normalized = (value - range.min) / (range.max - range.min);
    const score = range.reverse ? 10 - (normalized * 10) : normalized * 10;
    return Math.max(0, Math.min(10, score));
  };

  const checkDeviceActivity = (deviceData) => {
    const now = new Date();
    const timeThreshold = subMinutes(now, 16);
    const measurements = {};
    
    deviceData.forEach(item => {
      const itemTime = new Date(item._time);
      if (!measurements[item.measurement]) {
        measurements[item.measurement] = { lastUpdate: itemTime };
      }
      if (itemTime > measurements[item.measurement].lastUpdate) {
        measurements[item.measurement].lastUpdate = itemTime;
      }
    });

    return Object.entries(measurements).reduce((acc, [measurement, data]) => {
      acc[measurement] = data.lastUpdate > timeThreshold;
      return acc;
    }, {});
  };

  const fetchData = async () => {
    setLoading(true);
    try {
<<<<<<< HEAD
      const result = await fetchWithCache('http://localhost:5000/influx', 'reports_influx');
      setData(result.data);

=======

      const result = await fetchWithCache('http://localhost:5000/influx', 'reports_influx');
      setData(result.data);


>>>>>>> d95776d (feat: Refactor backend API connections and enhance InfluxDB data fetching with pagination)
      // Get unique devices
      const uniqueDevices = [...new Set(result.data.map(item => item.id))];
      setDevices(uniqueDevices);

      // Calculate device status
      const status = {};
      uniqueDevices.forEach(deviceId => {
        const deviceData = result.data.filter(item => item.id === deviceId);
        status[deviceId] = checkDeviceActivity(deviceData);
      });
      setDeviceStatus(status);

      if (selectedDevice) {
        calculateDeviceScores(result.data.filter(item => item.id === selectedDevice));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDeviceScores = (deviceData) => {
    const measurements = {};
    const scores = {};
    
    deviceData.forEach(item => {
      if (!measurements[item.measurement]) {
        measurements[item.measurement] = [];
      }
      measurements[item.measurement].push(item.value);
    });

    Object.entries(measurements).forEach(([measurement, values]) => {
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const range = measurementRanges[measurement.toLowerCase()];
      if (range) {
        scores[measurement] = calculateScore(mean, range);
      }
    });

    setQualityScores(scores);
    const overallMean = Object.values(scores).reduce((sum, score) => sum + score, 0) / 
                       Object.values(scores).length;
    setOverallScore(Number(overallMean.toFixed(1)));
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [selectedDevice]);

  const getScoreColor = (score) => {
    if (score >= 7.5) return 'text-green-500';
    if (score >= 5) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="min-h-screen bg-gray-700 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Air Quality Report</h1>
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
            <span style={{ marginBottom: 8, color: '#60a5fa', fontWeight: 600 }}>Loading...</span>
            <div style={{
              width: '50%',
              height: 8,
              background: '#374151',
              borderRadius: 9999,
              overflow: 'hidden',
              position: 'relative'
            }}>
              <div
                style={{
                  height: '100%',
                  width: '40%',
                  background: 'linear-gradient(90deg, #60a5fa, #2563eb, #60a5fa)',
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  borderRadius: 9999,
                  animation: 'loadingBarMove 1.5s linear infinite'
                }}
              />
            </div>
            <style>
              {`
                @keyframes loadingBarMove {
                  0% { left: -40%; }
                  100% { left: 100%; }
                }
              `}
            </style>
          </div>
        )}

        <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 ${loading ? 'opacity-40 pointer-events-none select-none' : ''}`}>
          {devices.map(deviceId => (
            <button
              key={deviceId}
              onClick={() => setSelectedDevice(deviceId)}
              className={`p-4 rounded-lg ${
                selectedDevice === deviceId ? 'bg-blue-600' : 'bg-gray-800'
              } hover:bg-blue-500`}
            >
              <h3 className="text-xl font-semibold mb-2">Device: {deviceId}</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {deviceStatus[deviceId] && Object.entries(deviceStatus[deviceId]).map(([measurement, active]) => (
                  <div key={measurement} className={`${active ? 'text-green-400' : 'text-red-400'}`}>
                    {measurement}: {active ? 'Active' : 'Inactive'}
                  </div>
                ))}
              </div>
            </button>
          ))}
        </div>

        {selectedDevice && (
          <>
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <h2 className="text-2xl font-semibold mb-4">Overall Quality Score</h2>
              <div className={`text-6xl font-bold ${getScoreColor(overallScore)}`}>
                {overallScore}/10
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(qualityScores).map(([measurement, score]) => (
                <div key={measurement} className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-xl font-semibold mb-2">{measurement}</h3>
                  <div className={`text-4xl font-bold ${getScoreColor(score)}`}>
                    {score.toFixed(1)}/10
                  </div>
                  <div className="h-2 bg-gray-600 rounded mt-2">
                    <div 
                      className={`h-full rounded ${getScoreColor(score)}`}
                      style={{ width: `${score * 10}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <button
          className="mt-6 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          onClick={fetchData}
        >
          Refresh Data
        </button>
      </div>
    </div>
  );
};

export default Reports;