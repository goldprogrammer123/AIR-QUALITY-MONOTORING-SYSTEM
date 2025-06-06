import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DeviceManagement = () => {
  const [devices, setDevices] = useState([]);
  const [newDevice, setNewDevice] = useState({
    deviceId: '',
    location: '',
    description: '',
    measurements: []
  });
  const [availableMeasurements] = useState([
    'temperature',
    'humidity',
    'pressure',
    'Ph',
    'altitude',
    'gasResistance'
  ]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const response = await axios.get('http://localhost:5000/devices');
      setDevices(response.data);
    } catch (error) {
      console.error('Error fetching devices:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewDevice(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMeasurementToggle = (measurement) => {
    setNewDevice(prev => {
      const measurements = prev.measurements.includes(measurement)
        ? prev.measurements.filter(m => m !== measurement)
        : [...prev.measurements, measurement];
      return { ...prev, measurements };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await axios.post('http://localhost:5000/devices/add', newDevice);
      setMessage('Device added successfully!');
      setNewDevice({
        deviceId: '',
        location: '',
        description: '',
        measurements: []
      });
      fetchDevices();
    } catch (error) {
      setMessage('Error adding device: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-700 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Device Management</h1>

        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Add New Device</h2>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block mb-1">Device ID</label>
                <input
                  type="text"
                  name="deviceId"
                  value={newDevice.deviceId}
                  onChange={handleInputChange}
                  className="w-full bg-gray-700 rounded p-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="block mb-1">Location</label>
                <input
                  type="text"
                  name="location"
                  value={newDevice.location}
                  onChange={handleInputChange}
                  className="w-full bg-gray-700 rounded p-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="block mb-1">Description</label>
                <textarea
                  name="description"
                  value={newDevice.description}
                  onChange={handleInputChange}
                  className="w-full bg-gray-700 rounded p-2 text-white"
                  rows="3"
                />
              </div>

              <div>
                <label className="block mb-2">Measurements</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {availableMeasurements.map(measurement => (
                    <label
                      key={measurement}
                      className="flex items-center space-x-2 bg-gray-700 p-2 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={newDevice.measurements.includes(measurement)}
                        onChange={() => handleMeasurementToggle(measurement)}
                        className="form-checkbox"
                      />
                      <span className="capitalize">{measurement}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
              >
                {loading ? 'Adding...' : 'Add Device'}
              </button>
            </div>
          </form>

          {message && (
            <div className={`mt-4 p-3 rounded ${
              message.includes('Error') ? 'bg-red-500' : 'bg-green-500'
            }`}>
              {message}
            </div>
          )}
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Existing Devices</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {devices.map(device => (
              <div key={device.deviceId} className="bg-gray-700 p-4 rounded">
                <h3 className="font-semibold">{device.deviceId}</h3>
                <p className="text-sm text-gray-300">{device.location}</p>
                <p className="text-sm text-gray-400">{device.description}</p>
                <div className="mt-2">
                  <span className="text-sm font-medium">Measurements:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {device.measurements.map(m => (
                      <span
                        key={m}
                        className="text-xs bg-blue-500 px-2 py-1 rounded"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceManagement;