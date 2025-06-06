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
      const result = await fetchWithCache('http://localhost:5000/influx', 'stats_influx');
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
    <div className="min-h-screen bg-gray-700 text-white p-6">
      <div className="flex justify-between mb-4">
        <div className="flex items-center space-x-4">
          <button
            className="bg-blue-500 px-4 py-2 rounded hover:bg-blue-600"
            onClick={() => setSelectedDate(subDays(selectedDate, 7))}
          >
            Previous Week
          </button>
          <span className="font-medium">
            Week of {format(selectedDate, 'MMM dd, yyyy')}
          </span>
          <button
            className="bg-blue-500 px-4 py-2 rounded hover:bg-blue-600"
            onClick={() => setSelectedDate(new Date())}
          >
            Current Week
          </button>
        </div>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          onClick={fetchData}
        >
          Refresh Data
        </button>
      </div>

      <div className="bg-gray-800 shadow-md rounded-lg p-4 mb-4">
        <h2 className="text-lg font-bold mb-2">Select Device</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {deviceIds.map((deviceId) => (
            <button
              key={deviceId}
              className={`p-4 rounded-lg ${
                selectedDevice === deviceId ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"
              }`}
              onClick={() => handleDeviceClick(deviceId)}
            >
              <span className="font-medium">Device:</span> {deviceId}
            </button>
          ))}
        </div>
      </div>

      {measurements.length > 0 && (
        <div className="bg-gray-800 shadow-md rounded-lg p-4 mb-4">
          <h2 className="text-lg font-bold mb-2">Select Measurement</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {measurements.map((measurement) => (
              <button
                key={measurement}
                className={`p-4 rounded-lg ${
                  selectedMeasurement === measurement ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"
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
        <div className="bg-gray-800 shadow-md rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">
            {selectedMeasurement}
            {selectedDevice && ` - Device: ${selectedDevice}`}
          </h2>
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 16 }}>
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
          <div className="bg-gray-900 p-4 rounded-lg" style={{ height: '400px' }}>
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