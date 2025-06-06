import React, { useEffect, useState } from "react";
import { fetchWithCache } from "../utils/dataUtils";

const PAGE_LIMIT = 50; // items per page

const Dashboard = () => {
  const [allData, setAllData] = useState([]); // all loaded data so far
  const [page, setPage] = useState(1); // current page
  const [hasMore, setHasMore] = useState(true); // if more pages exist
  const [loading, setLoading] = useState(false);

  const [deviceIds, setDeviceIds] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [measurements, setMeasurements] = useState([]);
  const [selectedMeasurement, setSelectedMeasurement] = useState(null);

  const [filteredData, setFilteredData] = useState([]);

  // Fetch a page of data from backend
  const fetchDataPage = async (pageNum) => {
    setLoading(true);
    try {
      const cacheKey = `dashboard_page_${pageNum}`;
      const result = await fetchWithCache(
        `http://localhost:5000/influx?page=${pageNum}&limit=${PAGE_LIMIT}`,
        cacheKey
      );

      // Process data values for consistency (round value)
      const processedData = result.data.map((item) => ({
        id: item.id,
        measurement: item.measurement,
        value: typeof item.value === "number" ? Number(item.value.toFixed(6)) : item.value,
        _time: item._time,
      }));

      setAllData((prev) => [...prev, ...processedData]);

      // Update device IDs after new data loaded
      const uniqueDevices = [...new Set([...allData, ...processedData].map((item) => item.id))];
      setDeviceIds(uniqueDevices);

      // Determine if more pages exist
      if (allData.length + processedData.length >= result.total) {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load & load on page change
  useEffect(() => {
    if (hasMore) {
      fetchDataPage(page);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Scroll handler to load next page when near bottom
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
          document.documentElement.scrollHeight - 200 &&
        !loading &&
        hasMore
      ) {
        setPage((prev) => prev + 1);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loading, hasMore]);

  // Update measurements list and filtered data when selections or data change
  useEffect(() => {
    if (selectedDevice) {
      const deviceData = allData.filter((item) => item.id === selectedDevice);
      const uniqueMeasurements = [...new Set(deviceData.map((item) => item.measurement))];
      setMeasurements(uniqueMeasurements);

      if (selectedMeasurement) {
        setFilteredData(deviceData.filter((item) => item.measurement === selectedMeasurement));
      } else {
        setFilteredData(deviceData);
      }
    } else {
      setFilteredData(allData);
      setMeasurements([]);
    }
  }, [selectedDevice, selectedMeasurement, allData]);

  // Handlers for device and measurement selection toggle
  const handleDeviceClick = (deviceId) => {
    if (selectedDevice === deviceId) {
      setSelectedDevice(null);
      setSelectedMeasurement(null);
    } else {
      setSelectedDevice(deviceId);
      setSelectedMeasurement(null);
    }
  };

  const handleMeasurementClick = (measurement) => {
    if (selectedMeasurement === measurement) {
      setSelectedMeasurement(null);
    } else {
      setSelectedMeasurement(measurement);
    }
  };

  return (
    <div className="dashboard-container min-h-screen p-6 bg-gray-700 text-white">
      {/* Device Selection */}
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

      {/* Measurement Selection */}
      {selectedDevice && measurements.length > 0 && (
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

      {/* Data Table */}
      <div className="bg-gray-800 shadow-md rounded-lg p-4">
        <h2 className="text-lg font-bold mb-2">
          {selectedDevice ? `Device: ${selectedDevice}` : "All Devices"}
          {selectedMeasurement ? ` | Measurement: ${selectedMeasurement}` : ""}
        </h2>

        {filteredData.length === 0 && !loading && (
          <div className="text-center text-gray-400 py-4">No data available.</div>
        )}

        <div className="overflow-x-auto max-h-[60vh]">
          <table className="min-w-full border-collapse border text-sm">
            <thead className="sticky top-0 bg-gray-900">
              <tr>
                <th className="border p-2">Device ID</th>
                <th className="border p-2">Measurement</th>
                <th className="border p-2">Timestamp</th>
                <th className="border p-2">Value</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, idx) => (
                <tr key={idx} className="border hover:bg-gray-700">
                  <td className="border p-2">{item.id}</td>
                  <td className="border p-2">{item.measurement}</td>
                  <td className="border p-2">{new Date(item._time).toLocaleString()}</td>
                  <td className="border p-2">{item.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 16 }}>
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
            {/* Inline keyframes for animation */}
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
        {!hasMore && <div className="text-center mt-4">No more data to load.</div>}
      </div>
    </div>
  );
};

export default Dashboard;
