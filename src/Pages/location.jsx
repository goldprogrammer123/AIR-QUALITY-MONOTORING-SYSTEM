import React, { useState, useEffect } from "react";
import { MapPin, Signal, Wifi, AlertCircle, CheckCircle } from "lucide-react";
import { fetchWithCache } from "../utils/dataUtils";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix default marker icon issue in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const Location = () => {
  const [sensors, setSensors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSensor, setSelectedSensor] = useState(null);
  const [error, setError] = useState(null);

  // Fetch sensor locations and device data from backend
  const fetchSensorData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch device data from your backend (new API structure)
      const result = await fetchWithCache("/api/sensordata/?format=json", "sensor_locations");
      
      // Hardcoded coordinates for Ardhi University
      const hardcodedCoordinates = { lat: -6.7650985, lng: 39.2132128 };
      
      // Process the data to extract devices (all with the same hardcoded coordinates)
      const sensorArray = (result || []).map((item) => {
        let battery = null;
        let airQuality = "Unknown";
        if (item.measurements && Array.isArray(item.measurements)) {
          for (const m of item.measurements) {
            if (m.name && m.name.toLowerCase() === "batterypercentage") battery = m.value;
            if (m.name && m.name.toLowerCase().includes("airquality")) airQuality = m.value;
          }
        }
        return {
          id: item.device_id,
          name: `Air Quality Sensor ${item.device_id}`,
          location: `Device ${item.device_id}`,
          coordinates: hardcodedCoordinates,
          status: "online", // You can improve this logic
          lastReading: item.received_at ? new Date(item.received_at).toLocaleString() : "N/A",
          airQuality: airQuality,
          battery: battery !== null ? Math.round(battery) : 100,
          measurements: item.measurements || []
        };
      });
      setSensors(sensorArray);
    } catch (error) {
      console.error("Error fetching sensor data:", error);
      setError("Failed to load sensor data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get default coordinates based on device ID or name
  const getDefaultCoordinates = (deviceId) => {
    // Ardhi University, Dar es Salaam main campus coordinates (as provided)
    const ardhiUniversity = { lat: -6.7650985, lng: 39.2132128 };

    // Replace with your actual current location for Ardhi BME
    // Example: update these values to your real current location if needed
    const ardhiBME = { lat: -6.8185, lng: 39.2806 };

    // Hardcode based on deviceId or device name
    if (deviceId === "ardhi_bme" || deviceId.toLowerCase().includes("bme")) {
      return ardhiBME;
    }
    // All other sensors at Ardhi University
    return ardhiUniversity;
  };

  // Helper function to get air quality based on measurement value and type
  const getAirQualityFromValue = (value, measurement) => {
    if (typeof value !== 'number') return "Unknown";
    
    // This logic should be customized based on your air quality standards
    if (measurement.toLowerCase().includes('pm2.5') || measurement.toLowerCase().includes('pm10')) {
      if (value <= 12) return "Good";
      if (value <= 35.4) return "Moderate";
      if (value <= 55.4) return "Unhealthy for Sensitive Groups";
      if (value <= 150.4) return "Unhealthy";
      if (value <= 250.4) return "Very Unhealthy";
      return "Hazardous";
    }
    
    if (measurement.toLowerCase().includes('co2')) {
      if (value <= 400) return "Good";
      if (value <= 1000) return "Moderate";
      if (value <= 2000) return "Poor";
      return "Very Poor";
    }
    
    // Default logic for other measurements
    if (value <= 50) return "Good";
    if (value <= 100) return "Moderate";
    return "Poor";
  };

  // Helper function to get battery level (mock for now)
  const getBatteryLevel = (deviceId) => {
    // This should come from your device metadata or battery sensor readings
    const baseBattery = 85;
    const offset = parseInt(deviceId.replace(/\D/g, '')) || 0;
    return Math.max(20, Math.min(100, baseBattery - (offset * 5)));
  };

  // Helper function to format time ago
  const formatTimeAgo = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  useEffect(() => {
    fetchSensorData();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "online":
        return "text-emerald-400";
      case "offline":
        return "text-red-400";
      case "maintenance":
        return "text-yellow-400";
      default:
        return "text-gray-400";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "online":
        return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case "offline":
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      case "maintenance":
        return <Wifi className="w-5 h-5 text-yellow-400" />;
      default:
        return <Signal className="w-5 h-5 text-gray-400" />;
    }
  };

  const getAirQualityColor = (quality) => {
    switch (quality) {
      case "Good":
        return "text-emerald-400";
      case "Moderate":
        return "text-yellow-400";
      case "Poor":
      case "Unhealthy":
      case "Very Unhealthy":
      case "Hazardous":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen text-black">
        <div className="glass-card rounded-xl p-6">
          <div className="flex flex-col items-center py-12">
            <span className="mb-4 text-emerald-400 font-semibold text-lg">Loading sensor locations...</span>
            <div className="w-1/2 h-3 bg-black/10 rounded-full overflow-hidden">
              <div
                className="h-full w-2/5 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full animate-pulse"
                style={{
                  animation: 'loadingBarMove 1.5s linear infinite'
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen text-black">
        <div className="glass-card rounded-xl p-6">
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-black mb-2">Error Loading Data</h2>
            <p className="text-black/70 mb-6">{error}</p>
            <button
              onClick={fetchSensorData}
              className="glass-button px-6 py-3 rounded-xl text-black font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-black">
      <div className="glass-card rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-black">Sensor Locations</h1>
            <p className="text-black/70">Monitor the physical locations and status of all air quality sensors across the campus.</p>
          </div>
          <button
            onClick={fetchSensorData}
            className="glass-button px-4 py-2 rounded-lg text-black text-sm"
          >
            Refresh
          </button>
        </div>
      </div>

      {sensors.length === 0 ? (
        <div className="glass-card rounded-xl p-6">
          <div className="text-center py-12">
            <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-black mb-2">No Sensors Found</h2>
            <p className="text-black/70">No sensor data is currently available.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map Section */}
            <div className="lg:col-span-2">
              <div className="glass-card rounded-xl p-6 h-96">
                <h2 className="text-xl font-semibold mb-4 text-black">Campus Map</h2>
                <MapContainer
                  center={[-6.8235, 39.2695]}
                  zoom={15}
                  scrollWheelZoom={true}
                  style={{ height: "320px", width: "100%", borderRadius: "0.75rem" }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {sensors.map((sensor) => (
                    <Marker
                      key={sensor.id}
                      position={[sensor.coordinates.lat, sensor.coordinates.lng]}
                      eventHandlers={{
                        click: () => setSelectedSensor(sensor),
                      }}
                    >
                      <Popup>
                        <div>
                          <strong>{sensor.name}</strong>
                          <br />
                          Location: {sensor.location}
                          <br />
                          Air Quality: <span className={getAirQualityColor(sensor.airQuality)}>{sensor.airQuality}</span>
                          <br />
                          Status: <span className={getStatusColor(sensor.status)}>{sensor.status}</span>
                          <br />
                          Last Reading: {sensor.lastReading}
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            </div>

            {/* Sensor List */}
            <div className="lg:col-span-1">
              <div className="glass-card rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-4 text-black">Sensor Status ({sensors.length})</h2>
                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {sensors.map((sensor) => (
                    <div
                      key={sensor.id}
                      className={`glass-card rounded-xl p-4 cursor-pointer transition-all duration-300 hover:bg-emerald-500/20 ${
                        selectedSensor?.id === sensor.id ? 'ring-2 ring-emerald-400' : ''
                      }`}
                      onClick={() => setSelectedSensor(sensor)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-black">{sensor.name}</h3>
                        {getStatusIcon(sensor.status)}
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-emerald-400" />
                          <span className="text-black/80">{sensor.location}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-black/60">Status:</span>
                          <span className={`font-medium ${getStatusColor(sensor.status)}`}>
                            {sensor.status.charAt(0).toUpperCase() + sensor.status.slice(1)}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-black/60">Air Quality:</span>
                          <span className={`font-medium ${getAirQualityColor(sensor.airQuality)}`}>
                            {sensor.airQuality}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-black/60">Battery:</span>
                          <span className="text-black/80">{sensor.battery}%</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-black/60">Last Reading:</span>
                          <span className="text-black/80">{sensor.lastReading}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Selected Sensor Details */}
          {selectedSensor && (
            <div className="mt-6">
              <div className="glass-card rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-black">Sensor Details</h2>
                  <button
                    onClick={() => setSelectedSensor(null)}
                    className="glass-button px-4 py-2 rounded-lg text-black text-sm"
                  >
                    Close
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-black mb-3">Basic Information</h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-black/60">Sensor ID:</span>
                        <span className="text-black ml-2 font-medium">{selectedSensor.id}</span>
                      </div>
                      <div>
                        <span className="text-black/60">Name:</span>
                        <span className="text-black ml-2 font-medium">{selectedSensor.name}</span>
                      </div>
                      <div>
                        <span className="text-black/60">Location:</span>
                        <span className="text-black ml-2 font-medium">{selectedSensor.location}</span>
                      </div>
                      <div>
                        <span className="text-black/60">Coordinates:</span>
                        <span className="text-black ml-2 font-medium">
                          {selectedSensor.coordinates.lat.toFixed(4)}, {selectedSensor.coordinates.lng.toFixed(4)}
                        </span>
                      </div>
                      <div>
                        <span className="text-black/60">Measurements:</span>
                        <span className="text-black ml-2 font-medium">
                          {selectedSensor.measurements.length} types
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-black mb-3">Current Status</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-black/60">Status:</span>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(selectedSensor.status)}
                          <span className={`font-medium ${getStatusColor(selectedSensor.status)}`}>
                            {selectedSensor.status.charAt(0).toUpperCase() + selectedSensor.status.slice(1)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-black/60">Air Quality:</span>
                        <span className={`font-medium ${getAirQualityColor(selectedSensor.airQuality)}`}>
                          {selectedSensor.airQuality}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-black/60">Battery Level:</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 h-2 bg-black/20 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                selectedSensor.battery > 50 ? 'bg-emerald-400' : 
                                selectedSensor.battery > 20 ? 'bg-yellow-400' : 'bg-red-400'
                              }`}
                              style={{ width: `${selectedSensor.battery}%` }}
                            ></div>
                          </div>
                          <span className="text-black/80 text-sm">{selectedSensor.battery}%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-black/60">Last Reading:</span>
                        <span className="text-black/80">{selectedSensor.lastReading}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Measurements */}
                {selectedSensor.measurements.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-black mb-3">Recent Measurements</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full border-collapse glass-table rounded-xl">
                        <thead className="sticky top-0">
                          <tr>
                            <th className="border p-3 text-left text-black font-semibold">Type</th>
                            <th className="border p-3 text-left text-black font-semibold">Value</th>
                            <th className="border p-3 text-left text-black font-semibold">Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedSensor.measurements.slice(0, 5).map((measurement, idx) => (
                            <tr key={idx} className="border hover:bg-emerald-500/10 transition-colors">
                              <td className="border p-3 text-black">{measurement.type}</td>
                              <td className="border p-3 text-black">{measurement.value}</td>
                              <td className="border p-3 text-black">
                                {new Date(measurement.time).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Location;