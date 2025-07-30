import React, { useEffect, useState } from "react";
import { fetchWithCache } from "../utils/dataUtils";
import { Download, FileText, BarChart3, Activity, ChevronLeft, ChevronRight } from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";

const PAGE_LIMIT = 100; // items per page from API
const DISPLAY_LIMIT = 11; // items to display at once

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
  
  // Pagination state for display
  const [currentPage, setCurrentPage] = useState(1);
  const [displayData, setDisplayData] = useState([]);

  // Fetch a page of data from backend
  const fetchDataPage = async (pageNum) => {
    setLoading(true);
    try {
      const cacheKey = `dashboard_page_${pageNum}`;
      const result = await fetchWithCache(
        `/api/sensordata/?format=json`,
        cacheKey
      );

      // The API returns an array directly, not an object with a 'data' property.
      const processedData = (result || []).flatMap((item) =>
        (item.measurements || []).map((measurement) => ({
          id: item.device_id,
          measurement: measurement.name,
          value:
            typeof measurement.value === "number"
              ? Number(measurement.value.toFixed(6))
              : measurement.value,
          _time: item.received_at,
        }))
      );

      // Deduplicate based on _time and measurement
      const uniqueData = processedData.filter((item) => {
        const key = `${item._time}-${item.measurement}`;
        return !allData.some(
          (prevItem) => `${prevItem._time}-${prevItem.measurement}` === key
        );
      });

      setAllData((prev) => [...prev, ...uniqueData]);

      // Update device IDs after new data loaded
      const uniqueDevices = [
        ...new Set([...allData, ...uniqueData].map((item) => item.id)),
      ];
      setDeviceIds(uniqueDevices);

      // Since the API doesn't provide pagination info, we'll assume there's more data if we received a full page.
      setHasMore(processedData.length === PAGE_LIMIT);
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

  // Update display data based on current page
  useEffect(() => {
    const startIndex = (currentPage - 1) * DISPLAY_LIMIT;
    const endIndex = startIndex + DISPLAY_LIMIT;
    setDisplayData(filteredData.slice(startIndex, endIndex));
  }, [filteredData, currentPage]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDevice, selectedMeasurement]);

  // Pagination handlers
  const totalPages = Math.ceil(filteredData.length / DISPLAY_LIMIT);
  
  const goToPage = (pageNum) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

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

  // Export data to CSV
  const exportToCSV = () => {
    const dataToExport = filteredData.length > 0 ? filteredData : allData;
    
    if (dataToExport.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = ['Device ID', 'Measurement', 'Value', 'Timestamp'];
    const csvContent = [
      headers.join(','),
      ...dataToExport.map(item => [
        item.id,
        item.measurement,
        item.value,
        new Date(item._time).toLocaleString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `air_quality_data_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export data to PDF (simplified version)
  const exportToPDF = () => {
    const dataToExport = filteredData.length > 0 ? filteredData : allData;

    if (dataToExport.length === 0) {
      alert('No data to export');
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Air Quality Monitoring System - Data Report", 14, 16);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 24);
    doc.text(`${selectedDevice ?`Device: ${selectedDevice}`  : 'All Devices'}`, 14, 30);
    doc.text(`${selectedMeasurement ? `Measurement: ${selectedMeasurement}` : 'All Measurements'}`, 14, 36);
    doc.text(`Total Records: ${dataToExport.length}`, 14, 42);

    // Prepare table data
    const tableColumn = ["Device ID", "Measurement", "Value", "Timestamp"];
    const tableRows = dataToExport.slice(0, 100).map(item => [
      item.id,
      item.measurement,
      item.value,
      new Date(item._time).toLocaleString()
    ]);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 48,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [22, 160, 133] }
    });

    if (dataToExport.length > 100) {
      doc.text(`... and ${dataToExport.length - 100} more records`, 14, doc.lastAutoTable.finalY + 10);
    }

    doc.save(`air_quality_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Get data summary statistics
  const getDataSummary = () => {
    const dataToAnalyze = filteredData.length > 0 ? filteredData : allData;
    
    if (dataToAnalyze.length === 0) return null;

    const measurements = [...new Set(dataToAnalyze.map(item => item.measurement))];
    const devices = [...new Set(dataToAnalyze.map(item => item.id))];
    
    const latestTimestamp = new Date(Math.max(...dataToAnalyze.map(item => new Date(item._time))));
    const oldestTimestamp = new Date(Math.min(...dataToAnalyze.map(item => new Date(item._time))));

    return {
      totalRecords: dataToAnalyze.length,
      uniqueMeasurements: measurements.length,
      uniqueDevices: devices.length,
      latestReading: latestTimestamp,
      oldestReading: oldestTimestamp,
      timeSpan: Math.round((latestTimestamp - oldestTimestamp) / (1000 * 60 * 60 * 24)) // days
    };
  };

  const summary = getDataSummary();

  return (
    <div className="min-h-screen text-black">
      {/* Header with Export Options */}
      <div className="bg-white shadow-2xl rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4 ">
          <div>
            <h1 className="text-3xl font-bold text-black mb-2">Data Dashboard</h1>
            <p className="text-black/70">Real-time air quality data monitoring and analysis</p>
          </div>
        </div>

        {/* Data Summary */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white shadow rounded-xl p-4 flex flex-col items-center">
              <div className="text-2xl font-semibold text-black">{summary.uniqueDevices}</div>
              <div className="text-sm font-bold text-black/60">Devices</div>
            </div>
            <div className="bg-white shadow rounded-xl p-4 flex flex-col items-center">
              <div className="text-2xl font-bold text-black">{summary.uniqueMeasurements}</div>
              <div className="text-sm font-semibold text-black/60">Measurements</div>
            </div>
            <div className="bg-white shadow rounded-xl p-4 flex flex-col items-center">
              <div className="text-2xl font-bold text-black">{summary.timeSpan}</div>
              <div className="text-sm font-semibold text-black/60">Days Span</div>
            </div>
            <div className="bg-white shadow rounded-xl p-4 flex flex-col items-center">
              <div className="text-2xl font-bold text-black">{summary.latestReading.toLocaleDateString()}</div>
              <div className="text-sm font-semibold text-black/60">Latest Reading</div>
            </div>
            <div className="flex flex-col justify-center items-center">
              <button
                onClick={exportToCSV}
                className="glass-button px-4 py-2 rounded-lg text-white text-sm flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
              {/* <button
                onClick={exportToPDF}
                className="glass-button px-4 py-2 rounded-lg text-white text-sm flex items-center space-x-2"
              >
                <FileText className="w-4 h-4" />
                <span>Export Report</span>
              </button> */}
            </div>
          </div>
        )}
      </div>

      {/* Device Selection */}
      <div className="bg-white shadow-2xl rounded-xl p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4 text-black">Select Device</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {deviceIds.map((deviceId) => (
            <button
              key={deviceId}
              className={`p-4 rounded-xl transition-all duration-300 ${
                selectedDevice === deviceId 
                  ? "glass-button text-black" 
                  : "glass-card text-black hover:bg-black-500/20"
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
        <div className="bg-white shadow-2xl rounded-xl p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4 text-black">Select Measurement</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {measurements.map((measurement) => (
              <button
                key={measurement}
                className={`p-4 rounded-xl transition-all duration-300 ${
                  selectedMeasurement === measurement 
                    ? "glass-button text-black" 
                    : "glass-card text-black hover:bg-emerald"
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
      <div className="bg-white shadow-2xl rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-black">
            {selectedDevice ? `Device: ${selectedDevice}` : "All Devices"}
            {selectedMeasurement ? ` | Measurement: ${selectedMeasurement}` : ""}
          </h2>
          <div className="flex items-center space-x-2 text-black/60">
            <Activity className="w-4 h-4" />
            <span>Showing {displayData.length} of {filteredData.length} records</span>
          </div>
        </div>

        {displayData.length === 0 && !loading && (
          <div className="text-center text-black/60 py-8 text-lg">No data available.</div>
        )}

        <div className="overflow-x-auto max-h-[60vh] rounded-xl">
          <table className="min-w-full border-collapse glass-table rounded-xl">
            <thead className="sticky top-0">
              <tr>
                <th className="border p-3 text-left text-black font-semibold">Device ID</th>
                <th className="border p-3 text-left text-black font-semibold">Measurement</th>
                <th className="border p-3 text-left text-black font-semibold">Timestamp</th>
                <th className="border p-3 text-left text-black font-semibold">Value</th>
              </tr>
            </thead>
            <tbody>
              {displayData.map((item, idx) => (
                <tr key={idx} className="border hover:bg-emerald-700/10 transition-colors">
                  <td className="border p-3 text-black">{item.id}</td>
                  <td className="border p-3 text-black">{item.measurement}</td>
                  <td className="border p-3 text-black">{new Date(item._time).toLocaleString()}</td>
                  <td className="border p-3 text-black">{item.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {filteredData.length > DISPLAY_LIMIT && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-black/60">
              Page {currentPage} of {totalPages} ({filteredData.length} total records)
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={goToPrevPage}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg transition-all duration-300 ${
                  currentPage === 1 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'glass-button text-black hover:bg-emerald-500/20'
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              {/* Page numbers */}
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      className={`px-3 py-2 rounded-lg transition-all duration-300 ${
                        currentPage === pageNum
                          ? 'glass-button text-black'
                          : 'glass-card text-black hover:bg-emerald-500/20'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-lg transition-all duration-300 ${
                  currentPage === totalPages 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'glass-button text-black hover:bg-emerald-500/20'
                }`}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center mt-6">
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
        
        {!hasMore && (
          <div className="text-center mt-6 text-black/60 text-lg">
            No more data to load.
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;