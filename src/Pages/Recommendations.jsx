import React, { useState, useEffect } from 'react';
import { fetchWithCache } from '../utils/dataUtils';
import { calculateAQI, getAQIStatus, extractPollutantData } from '../utils/aqiUtils';
import { CheckCircle, AlertTriangle, XCircle, Heart, Activity, Shield } from 'lucide-react';

const Recommendations = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentAQI, setCurrentAQI] = useState(0);
  const [aqiStatus, setAqiStatus] = useState('Good');
  const [dominantPollutant, setDominantPollutant] = useState('None');
  const [dataWarning, setDataWarning] = useState('');

  // Toggle to switch between API and mock data (set to false to try API)
  const USE_MOCK_DATA = false;

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
        console.log('Recommendations - Using mock data:', result.data);
      } else {
        result = await fetchWithCache('http://localhost:5000/influx', 'recommendations', { bypassCache: true });
        console.log('Recommendations - Fetched data from API:', result.data);
      }

      if (!result.data || !Array.isArray(result.data)) {
        throw new Error('Invalid data format: data is not an array');
      }
      setData(result.data);

      if (result.data.length > 0) {
        const pollutantData = extractPollutantData(result.data);
        console.log('Recommendations - Extracted pollutants:', pollutantData);
        const { aqi, pollutant } = calculateAQI(
          pollutantData.nox,
          pollutantData.voc,
          pollutantData.co2,
          pollutantData.benzene
        );
        console.log('Recommendations - Calculated AQI:', { aqi, pollutant });
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
      console.error('Recommendations - Error fetching data:', error.message, error);
      // Fallback to mock data if API fails
      if (!USE_MOCK_DATA) {
        console.log('Recommendations - Falling back to mock data');
        result = mockData;
        setData(result.data);
        const pollutantData = extractPollutantData(result.data);
        console.log('Recommendations - Extracted pollutants (mock):', pollutantData);
        const { aqi, pollutant } = calculateAQI(
          pollutantData.nox,
          pollutantData.voc,
          pollutantData.co2,
          pollutantData.benzene
        );
        console.log('Recommendations - Calculated AQI (mock):', { aqi, pollutant });
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

  const getRecommendations = (aqi) => {
    if (aqi <= 50) {
      return {
        general: [
          "Air quality is satisfactory and poses little or no risk.",
          "Continue normal outdoor activities.",
          "Maintain good indoor air quality practices."
        ],
        sensitive: [
          "No special precautions needed for sensitive groups.",
          "Continue normal activities with confidence."
        ],
        outdoor: [
          "Safe for all outdoor activities",
          "Good time for outdoor exercise and recreation"
        ]
      };
    } else if (aqi <= 100) {
      return {
        general: [
          "Air quality is acceptable; however, some pollutants may be a concern for a small number of people.",
          "Consider reducing prolonged or heavy outdoor exertion if you experience symptoms."
        ],
        sensitive: [
          "People with heart or lung disease, older adults, and children should reduce prolonged or heavy outdoor exertion.",
          "Pay attention to symptoms such as coughing or shortness of breath."
        ],
        outdoor: [
          "Limit prolonged outdoor activities",
          "Consider indoor alternatives for exercise",
          "Take breaks during outdoor activities"
        ]
      };
    } else if (aqi <= 150) {
      return {
        general: [
          "Members of sensitive groups may experience health effects.",
          "The general public is not likely to be affected."
        ],
        sensitive: [
          "People with heart or lung disease, older adults, and children should avoid prolonged or heavy outdoor exertion.",
          "Consider moving activities indoors.",
          "Consult healthcare provider if symptoms worsen."
        ],
        outdoor: [
          "Sensitive groups should avoid outdoor activities",
          "General public should limit outdoor exertion",
          "Choose less strenuous activities"
        ]
      };
    } else if (aqi <= 200) {
      return {
        general: [
          "Everyone may begin to experience health effects.",
          "Members of sensitive groups may experience more serious health effects."
        ],
        sensitive: [
          "Avoid all outdoor activities.",
          "Stay indoors with windows and doors closed.",
          "Seek medical attention if symptoms develop."
        ],
        outdoor: [
          "Avoid outdoor activities",
          "Postpone outdoor events",
          "Use N95 masks if outdoor exposure is necessary"
        ]
      };
    } else {
      return {
        general: [
          "Health warnings of emergency conditions.",
          "The entire population is more likely to be affected."
        ],
        sensitive: [
          "Avoid all outdoor activities.",
          "Stay indoors with air conditioning if possible.",
          "Seek immediate medical attention for any symptoms."
        ],
        outdoor: [
          "Avoid all outdoor activities",
          "Cancel outdoor events",
          "Use N95 or better masks if outdoor exposure is unavoidable"
        ]
      };
    }
  };

  const aqiStatusInfo = getAQIStatus(currentAQI);
  const recommendations = getRecommendations(currentAQI);

  if (loading) {
    return (
      <div className="min-h-screen text-black">
        <div className="glass-card rounded-xl p-6">
          <div className="flex flex-col items-center py-12">
            <span className="mb-4 text-emerald-400 font-semibold text-lg">Loading recommendations...</span>
            <div className="w-1/2 h-3 bg-black/10 rounded-full overflow-hidden">
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
    <div className="min-h-screen text-black">
      <div className="bg-white shadow-2xl rounded-xl p-6 mb-6">
        <div className="bg-white flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-black mb-2">Health Recommendations</h1>
            <p className="text-black/70">Personalized recommendations based on current air quality conditions</p>
          </div>
          <button
            onClick={fetchData}
            className="glass-button px-6 py-3 rounded-xl text-black font-medium"
          >
            Refresh Data
          </button>
        </div>
      </div>

      {dataWarning && (
        <div className="bg-white rounded-2xl p-6 mb-6 bg-red-500/20">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <span className="text-red-400">{dataWarning}</span>
          </div>
        </div>
      )}

      <div className="bg-white shadow-2xl rounded-xl p-6 mb-6">
        <div className={`${aqiStatusInfo.color} rounded-xl p-6 mb-6`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {aqiStatusInfo.icon === 'CheckCircle' && <CheckCircle className="w-6 h-6" />}
              {aqiStatusInfo.icon === 'Activity' && <Activity className="w-6 h-6" />}
              {aqiStatusInfo.icon === 'AlertTriangle' && <AlertTriangle className="w-6 h-6" />}
              {aqiStatusInfo.icon === 'XCircle' && <XCircle className="w-6 h-6" />}
              <div>
                <h2 className="text-2xl font-bold">Current AQI: {currentAQI}</h2>
                <p className="text-lg opacity-90">{aqiStatusInfo.status}</p>
                <p className="text-sm opacity-90">Dominant Pollutant: {dominantPollutant}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-90">Last Updated</p>
              <p className="text-lg">{new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className=" p-6 shadow-2xl bg-white rounded-xl">
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="w-6 h-6 text-emerald-400" />
            <h3 className="text-xl font-semibold text-black">General Public</h3>
          </div>
          <ul className="space-y-3">
            {recommendations.general.map((rec, index) => (
              <li key={index} className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span className="text-black/90">{rec}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className=" p-6 shadow-2xl bg-white rounded-xl">
          <div className="flex items-center space-x-3 mb-4">
            <Heart className="w-6 h-6 text-red-400" />
            <h3 className="text-xl font-semibold text-black">Sensitive Groups</h3>
          </div>
          <div className="mb-4"> 
             <p className="text-black text-sm mb-2 font-semibold">Includes:</p>
           <div className="flex flex-wrap gap-2">
             <span className="bg-red-500/20 text-red-600 px-2 py-1 rounded text-xs font-bold">Heart Disease</span>
             <span className="bg-red-500/20 text-red-600 px-2 py-1 rounded text-xs font-bold">Lung Disease</span>
             <span className="bg-red-500/20 text-red-600 px-2 py-1 rounded text-xs font-bold">Older Adults</span>
             <span className="bg-red-500/20 text-red-600 px-2 py-1 rounded text-xs font-bold">Children</span>
           </div>
          </div>

          <ul className="space-y-3">
            {recommendations.sensitive.map((rec, index) => (
              <li key={index} className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                <span className="text-black/90">{rec}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className=" p-6 shadow-2xl bg-white rounded-xl">
          <div className="flex items-center space-x-3 mb-4">
            <Activity className="w-6 h-6 text-yellow-400" />
            <h3 className="text-xl font-semibold text-black">Outdoor Activities</h3>
          </div>
          <ul className="space-y-3">
            {recommendations.outdoor.map((rec, index) => (
              <li key={index} className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                <span className="text-black/90">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-2xl p-6 mt-6 ">
        <h2 className="text-2xl font-bold text-black mb-4">AQI Scale Reference</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-white">
          <div className="flex items-center justify-between p-3 bg-emerald-500/20 rounded-lg">
            <span className="text-black font-semibold">0-50</span>
            <span className="text-black font-semibold">Good</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-yellow-500/20 rounded-lg">
            <span className="text-black font-semibold">51-100</span>
            <span className="text-black font-semibold">Moderate</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-orange-500/20 rounded-lg">
            <span className="text-black font-semibold">101-150</span>
            <span className="text-black font-semibold">Unhealthy for Sensitive Groups</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-red-500/20 rounded-lg">
            <span className="text-black font-semibold">151-200</span>
            <span className="text-black font-semibold">Unhealthy</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-purple-500/20 rounded-lg">
            <span className="text-black font-semibold">201-300</span>
            <span className="text-black font-semibold">Very Unhealthy</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-red-800/20 rounded-lg">
            <span className="text-black font-semibold">301+</span>
            <span className="text-black font-semibold">Hazardous</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Recommendations;