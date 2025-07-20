import React, { useState, useEffect } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { subDays, eachHourOfInterval } from 'date-fns';
import { fetchWithCache } from '../utils/dataUtils';
import { calculateAQI, getAQIStatus, extractPollutantData } from '../utils/aqiUtils';
import { Activity, AlertTriangle, CheckCircle } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler
);

const AirReport = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentAQI, setCurrentAQI] = useState(0);
  const [aqiStatus, setAqiStatus] = useState('Good');
  const [dominantPollutant, setDominantPollutant] = useState('None');
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [pollutantValues, setPollutantValues] = useState({ nox: 0, voc: 0, co2: 0, benzene: 0 });
  const [dataWarning, setDataWarning] = useState('');

  // Toggle to switch between API and mock data (set to false to try API)
  const USE_MOCK_DATA = true;

  const mockData = {
    data: [
      { measurement: "NOx", value: 0.05, _time: "2025-06-26T18:04:32.07Z", id: "ardhi-bme-280" },
      { measurement: "VOC", value: 50, _time: "2025-06-26T18:04:16.758Z", id: "bme680-ph-dox-full-sensor-test" },
      { measurement: "CO2", value: 212.1, _time: "2025-06-26T18:04:32.069Z", id: "ardhi-bme-280" },
      { measurement: "Benzene", value: 0.01, _time: "2025-06-26T18:04:32.073Z", id: "ardhi-bme-280" }
    ]
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      let result;
      if (USE_MOCK_DATA) {
        result = mockData;
        console.log('AirReport - Using mock data:', result.data);
      } else {
        result = await fetchWithCache('http://localhost:3000/influx', 'air_report', { bypassCache: true });
        console.log('AirReport - Fetched data from API:', result.data);
      }

      if (!result.data || !Array.isArray(result.data)) {
        throw new Error('Invalid data format: data is not an array');
      }
      setData(result.data);

      if (result.data.length > 0) {
        const pollutantData = extractPollutantData(result.data);
        setPollutantValues(pollutantData);
        console.log('AirReport - Extracted pollutants:', pollutantData);
        const { aqi, pollutant } = calculateAQI(
          pollutantData.nox,
          pollutantData.voc,
          pollutantData.co2,
          pollutantData.benzene
        );
        console.log('AirReport - Calculated AQI:', { aqi, pollutant });
        setCurrentAQI(aqi);
        setDominantPollutant(pollutant);
        setAqiStatus(getAQIStatus(aqi).status);
        setDataWarning(pollutantData.nox === 0 && pollutantData.voc === 0 && 
                       pollutantData.co2 === 0 && pollutantData.benzene === 0 
          ? 'No pollutant data found' : '');
      } else {
        setDataWarning('No data received from API');
      }
    } catch (error) {
      console.error('AirReport - Error fetching data:', error.message, error);
      // Fallback to mock data if API fails
      if (!USE_MOCK_DATA) {
        console.log('AirReport - Falling back to mock data');
        result = mockData;
        setData(result.data);
        const pollutantData = extractPollutantData(result.data);
        setPollutantValues(pollutantData);
        console.log('AirReport - Extracted pollutants (mock):', pollutantData);
        const { aqi, pollutant } = calculateAQI(
          pollutantData.nox,
          pollutantData.voc,
          pollutantData.co2,
          pollutantData.benzene
        );
        console.log('AirReport - Calculated AQI (mock):', { aqi, pollutant });
        setCurrentAQI(aqi);
        setDominantPollutant(pollutant);
        setAqiStatus(getAQIStatus(aqi).status);
        setDataWarning('');
      } else {
        setDataWarning(`Error fetching data: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const createHistoricalData = () => {
    const endDate = new Date();
    const startDate = selectedTimeRange === '24h' ? subDays(endDate, 1) : subDays(endDate, 7);
    const hours = eachHourOfInterval({ start: startDate, end: endDate });

    return hours.map(hour => {
      const hourData = data.filter(item => {
        const itemDate = new Date(item._time);
        return itemDate.getHours() === hour.getHours() && itemDate.getDate() === hour.getDate();
      });
      if (hourData.length === 0) return { x: hour, y: 0 };
      try {
        const pollutantData = extractPollutantData(hourData);
        const { aqi } = calculateAQI(
          pollutantData.nox,
          pollutantData.voc,
          pollutantData.co2,
          pollutantData.benzene
        );
        return { x: hour, y: aqi };
      } catch (error) {
        console.error('AirReport - Error in createHistoricalData:', error.message);
        return { x: hour, y: 0 };
      }
    });
  };

  const createPollutantData = () => {
    const pollutants = ['CO2 (ppm)', 'NOx (ppb)', 'VOC (ppb)', 'Benzene (ppb)'];
    const values = ['co2', 'nox', 'voc', 'benzene'].map(pollutant => {
      const relevantData = data.filter(item => 
        item.measurement && typeof item.measurement === 'string' && item.measurement.toLowerCase().includes(pollutant)
      );
      if (relevantData.length > 0) {
        const latest = relevantData.reduce((a, b) => 
          new Date(a._time) > new Date(b._time) ? a : b
        );
        return pollutant === 'nox' || pollutant === 'benzene' ? latest.value * 1000 : latest.value;
      }
      return 0;
    });

    return {
      labels: pollutants,
      datasets: [{
        label: 'Latest Levels',
        data: values,
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',  // CO2
          'rgba(59, 130, 246, 0.8)',  // NOx
          'rgba(245, 158, 11, 0.8)',  // VOC
          'rgba(239, 68, 68, 0.8)',   // Benzene
        ],
        borderColor: [
          'rgba(16, 185, 129, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 2
      }]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: 'white' } },
      title: { display: true, color: 'white' },
    },
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.1)' }, ticks: { color: 'white' } },
      x: {
        type: 'time',
        time: { unit: selectedTimeRange === '24h' ? 'hour' : 'day', displayFormats: { hour: 'HH:mm', day: 'MMM dd' } },
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        ticks: { color: 'white' }
      }
    }
  };

  const aqiStatusInfo = getAQIStatus(currentAQI);

  if (loading) {
    return (
      <div className="min-h-screen text-white">
        <div className="glass-card rounded-xl p-6">
          <div className="flex flex-col items-center py-12">
            <span className="mb-4 text-emerald-400 font-semibold text-lg">Loading air quality data...</span>
            <div className="w-1/2 h-3 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full w-2/5 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full animate-pulse"
                style={{ animation: 'loadingBarMove 1.5s linear infinite' }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white">
      <div className="glass-card rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Air Quality Report</h1>
            <p className="text-white/70">Real-time air quality monitoring</p>
          </div>
          <button
            onClick={fetchData}
            className="glass-button px-6 py-3 rounded-xl text-white font-medium"
          >
            Refresh Data
          </button>
        </div>
      </div>

      {dataWarning && (
        <div className="glass-card rounded-xl p-6 mb-6 bg-red-500/20">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <span className="text-red-400">{dataWarning}</span>
          </div>
        </div>
      )}

      <div className="glass-card rounded-xl p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4 text-white">Debug: Pollutant Values</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>NOx (ppb):</span>
            <span>{pollutantValues.nox.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>VOC (ppb):</span>
            <span>{pollutantValues.voc.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>CO2 (ppm):</span>
            <span>{pollutantValues.co2.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Benzene (ppb):</span>
            <span>{pollutantValues.benzene.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <div className={`glass-card rounded-xl p-6 ${aqiStatusInfo.color}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {aqiStatusInfo.icon === 'CheckCircle' && <CheckCircle className="w-6 h-6" />}
                {aqiStatusInfo.icon === 'Activity' && <Activity className="w-6 h-6" />}
                {aqiStatusInfo.icon === 'AlertTriangle' && <AlertTriangle className="w-6 h-6" />}
                <h2 className="text-2xl font-bold">Current Air Quality Index</h2>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold">{currentAQI}</div>
                <div className="text-lg opacity-90">{aqiStatusInfo.status}</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Dominant Pollutant:</span>
                <span className="font-semibold">{dominantPollutant || 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span>Last Updated:</span>
                <span>{new Date().toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-4 text-white">AQI Scale</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-emerald-400">0-50</span>
                <span className="text-white">Good</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-yellow-400">51-100</span>
                <span className="text-white">Moderate</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-orange-400">101-150</span>
                <span className="text-white">Unhealthy for Sensitive Groups</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-red-400">151-200</span>
                <span className="text-white">Unhealthy</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-purple-400">201-300</span>
                <span className="text-white">Very Unhealthy</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-red-800">301+</span>
                <span className="text-white">Hazardous</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">Historical AQI Trends</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setSelectedTimeRange('24h')}
              className={`px-4 py-2 rounded-lg transition-all ${
                selectedTimeRange === '24h' ? 'glass-button text-white' : 'glass-card text-white hover:bg-emerald-500/20'
              }`}
            >
              24 Hours
            </button>
            <button
              onClick={() => setSelectedTimeRange('7d')}
              className={`px-4 py-2 rounded-lg transition-all ${
                selectedTimeRange === '7d' ? 'glass-button text-white' : 'glass-card text-white hover:bg-emerald-500/20'
              }`}
            >
              7 Days
            </button>
          </div>
        </div>
        <div className="h-80">
          <Line 
            data={{
              datasets: [{
                label: 'AQI',
                data: createHistoricalData(),
                borderColor: 'rgba(16, 185, 129, 1)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4,
                fill: true
              }]
            }}
            options={chartOptions}
          />
        </div>
      </div>

      <div className="glass-card rounded-xl p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Current Pollutant Levels</h2>
        <div className="h-80">
          <Bar 
            data={createPollutantData()}
            options={{
              ...chartOptions,
              scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.1)' }, ticks: { color: 'white' } },
                x: { grid: { color: 'rgba(255, 255, 255, 0.1)' }, ticks: { color: 'white' } }
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default AirReport;