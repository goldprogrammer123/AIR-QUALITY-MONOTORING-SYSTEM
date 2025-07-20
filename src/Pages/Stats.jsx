import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { format, eachDayOfInterval, subDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { fetchWithCache, groupDataBy15Minutes } from '../utils/dataUtils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale  // Add TimeScale to registration
);

const Stats = () => {
  const [data, setData] = useState([]);
  const [deviceIds, setDeviceIds] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [measurements, setMeasurements] = useState([]);
  const [selectedMeasurement, setSelectedMeasurement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date()); // Add this line

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: 'white' }
      },
      title: {
        display: true,
        text: 'Hourly Average Measurements',
        color: 'white'
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        ticks: { color: 'white' }
      },
      x: {
        type: 'time',
        time: {
          unit: 'hour',
          displayFormats: {
            hour: 'MMM dd, HH:mm'
          }
        },
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        ticks: { 
          color: 'white',
          maxRotation: 45
        }
      }
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await fetchWithCache('http://localhost:3000/influx', 'stats_influx');
      setData(result.data);

      // Get unique device IDs and measurements
      const uniqueDeviceIds = [...new Set(result.data.map(item => item.id))];
      setDeviceIds(uniqueDeviceIds);

      if (selectedDevice) {
        const deviceData = result.data.filter(item => item.id === selectedDevice);
        const uniqueMeasurements = [...new Set(deviceData.map(item => item.measurement))];
        setMeasurements(uniqueMeasurements);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeviceClick = (deviceId) => {
    const newSelectedDevice = selectedDevice === deviceId ? null : deviceId;
    setSelectedDevice(newSelectedDevice);
    setSelectedMeasurement(null);
    
    if (newSelectedDevice) {
      const deviceData = data.filter(item => item.id === newSelectedDevice);
      const uniqueMeasurements = [...new Set(deviceData.map(item => item.measurement))];
      setMeasurements(uniqueMeasurements);
    } else {
      setMeasurements([]);
    }
  };

  const handleMeasurementClick = (measurement) => {
    setSelectedMeasurement(selectedMeasurement === measurement ? null : measurement);
  };

  const createChartData = (measurementType) => {
    const endDate = selectedDate;
    const startDate = subDays(endDate, 7);
    const daysInRange = eachDayOfInterval({ start: startDate, end: endDate });
    
    const allData = daysInRange.map((day, index) => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);
      
      const dayData = data
        .filter(item => {
          const itemDate = new Date(item._time);
          return (
            (!selectedDevice || item.id === selectedDevice) && 
            item.measurement === measurementType &&
            isWithinInterval(itemDate, { start: dayStart, end: dayEnd })
          );
        })
        .sort((a, b) => new Date(a._time) - new Date(b._time));

      return {
        label: `${format(day, 'MMM dd, yyyy')}`,
        data: dayData.map(item => ({
          x: new Date(item._time),
          y: item.value
        })),
        borderColor: `hsl(${(index * 360) / daysInRange.length}, 70%, 50%)`,
        backgroundColor: `hsla(${(index * 360) / daysInRange.length}, 70%, 50%, 0.5)`,
        tension: 0.4,
      };
    });

    return {
      datasets: allData
    };
  };

  // Add date selection controls to the UI
  return (
    <div className="min-h-screen text-white">
      <div className="flex flex-col lg:flex-row justify-between mb-6 gap-4">
        <div className="flex items-center space-x-4">
          <button
            className="glass-button px-6 py-3 rounded-xl text-white font-medium"
            onClick={() => setSelectedDate(subDays(selectedDate, 7))}
          >
            Previous Week
          </button>
          <span className="font-medium text-lg">
            Week of {format(selectedDate, 'MMM dd, yyyy')}
          </span>
          <button
            className="glass-button px-6 py-3 rounded-xl text-white font-medium"
            onClick={() => setSelectedDate(new Date())}
          >
            Current Week
          </button>
        </div>
        <button
          className="glass-button text-white px-6 py-3 rounded-xl font-medium"
          onClick={fetchData}
        >
          Refresh Data
        </button>
      </div>

      <div className="glass-card rounded-xl p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4 text-white">Select Device</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {deviceIds.map((deviceId) => (
            <button
              key={deviceId}
              className={`p-4 rounded-xl transition-all duration-300 ${
                selectedDevice === deviceId 
                  ? "glass-button text-white" 
                  : "glass-card text-white hover:bg-emerald-500/20"
              }`}
              onClick={() => handleDeviceClick(deviceId)}
            >
              <span className="font-medium">Device:</span> {deviceId}
            </button>
          ))}
        </div>
      </div>

      {measurements.length > 0 && (
        <div className="glass-card rounded-xl p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4 text-white">Select Measurement</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {measurements.map((measurement) => (
              <button
                key={measurement}
                className={`p-4 rounded-xl transition-all duration-300 ${
                  selectedMeasurement === measurement 
                    ? "glass-button text-white" 
                    : "glass-card text-white hover:bg-emerald-500/20"
                }`}
                onClick={() => handleMeasurementClick(measurement)}
              >
                {measurement}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedMeasurement && (
        <div className="glass-card rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-6 text-white">
            {selectedMeasurement}
            {selectedDevice && ` - Device: ${selectedDevice}`}
          </h2>
          {loading && (
            <div className="flex flex-col items-center mb-6">
              <span className="mb-4 text-emerald-400 font-semibold text-lg">Loading...</span>
              <div className="w-1/2 h-3 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full w-2/5 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full animate-pulse"
                  style={{
                    animation: 'loadingBarMove 1.5s linear infinite'
                  }}
                />
              </div>
            </div>
          )}
          <div className="chart-container" style={{ height: '400px' }}>
            <Line options={options} data={createChartData(selectedMeasurement)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Stats;

const groupDataByHour = (data) => {
  const groups = {};
  data.forEach(item => {
    const date = new Date(item._time);
date.setMinutes(0, 0, 0);
const key = date.getTime();
    
    if (!groups[key]) {
      groups[key] = {
        time: date,
        values: []
      };
    }
    groups[key].values.push(item.value);
  });

  return Object.values(groups).map(group => ({
    time: group.time,
    value: group.values.reduce((sum, val) => sum + val, 0) / group.values.length
  }));
};

