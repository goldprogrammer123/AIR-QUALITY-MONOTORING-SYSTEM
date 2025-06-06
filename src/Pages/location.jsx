import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { fetchWithCache } from '../utils/dataUtils';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconRetinaUrl: iconRetina,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const Location = () => {
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [devices, setDevices] = useState([]);

  // Updated coordinates for Ardhi University (6°46'00.8"S 39°12'49.0"E)
  const ardhiCoordinates = [-6.767444, 39.213611];
  const kistCoordinates = [-6.217494, 39.211440];

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const result = await fetchWithCache('http://localhost:5000/influx');
        const uniqueDevices = [...new Set(result.data.map(item => item.id))];
        
        const deviceData = uniqueDevices.reduce((acc, deviceId) => {
          const isKIST = deviceId.includes('KISTBME');
          const baseLocation = isKIST ? kistCoordinates : ardhiCoordinates;
          
          // Add small random offset for non-KIST devices to make them visible
          const location = isKIST ? baseLocation : [
            baseLocation[0] + (Math.random() - 0.5) * 0.0004,
            baseLocation[1] + (Math.random() - 0.5) * 0.0004
          ];

          acc[deviceId] = {
            name: deviceId,
            location: location,
            description: isKIST ? 'Located in KIST BME Department' : 'Located in Ardhi University'
          };
          return acc;
        }, {});

        setDevices(deviceData);
      } catch (error) {
        console.error('Error fetching devices:', error);
      }
    };

    fetchDevices();
  }, []);

  const handleDeviceSelect = (deviceId) => {
    setSelectedDevice(deviceId);
  };

  return (
    <div className="min-h-screen bg-gray-700 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Device Locations</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {Object.keys(devices).map(deviceId => (
            <button
              key={deviceId}
              onClick={() => handleDeviceSelect(deviceId)}
              className={`p-4 rounded-lg ${
                selectedDevice === deviceId ? 'bg-blue-600' : 'bg-gray-800'
              } hover:bg-blue-500`}
            >
              <h3 className="text-lg font-semibold">{devices[deviceId].name}</h3>
            </button>
          ))}
        </div>

        {selectedDevice && devices[selectedDevice] && (
          <div className="bg-gray-800 rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">
              {devices[selectedDevice].name}
            </h2>
            <p className="mb-4">{devices[selectedDevice].description}</p>
            <div className="h-[500px] rounded-lg overflow-hidden">
              <MapContainer
                center={devices[selectedDevice].location}
                zoom={17}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <Marker position={devices[selectedDevice].location}>
                  <Popup>
                    <div className="text-black">
                      <h3 className="font-bold">{devices[selectedDevice].name}</h3>
                      <p>{devices[selectedDevice].description}</p>
                    </div>
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Location;