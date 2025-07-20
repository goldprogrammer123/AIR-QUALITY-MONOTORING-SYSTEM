import React, { useState, useEffect } from 'react';
import { Cloud, Sun, Wind, Droplets, Thermometer, Gauge, TrendingUp, TrendingDown, CheckCircle, Eye } from 'lucide-react';

const WeatherStatus = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weatherData, setWeatherData] = useState({
    temperature: 0,
    humidity: 0,
    pressure: 0,
    windSpeed: 0,
    visibility: 0
  });
  const [impact, setImpact] = useState({
    pm25Impact: 'neutral',
    pm10Impact: 'neutral',
    dispersion: 'neutral'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const apiKey = '09d92c7839a7f3b96baeddbb21bd26dc'; // Replace with your key
      const city = 'Dar es Salaam';
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

      const response = await fetch(url);
      const result = await response.json();

      setWeatherData({
        temperature: Math.round(result.main.temp),
        humidity: Math.round(result.main.humidity),
        pressure: Math.round(result.main.pressure),
        windSpeed: Math.round(result.wind.speed * 10) / 10,
        visibility: Math.round((result.visibility || 10000) / 1000 * 10) / 10 // in km
      });

      // You may need to adjust or remove air quality impact logic if not available
      setImpact({
        pm25Impact: 'neutral',
        pm10Impact: 'neutral',
        dispersion: 'neutral'
      });

    } catch (error) {
      console.error('Error fetching weather data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateVisibility = (temp, humidity, pressure) => {
    // Simplified visibility calculation based on weather conditions
    let visibility = 10; // Base visibility in km
    
    if (humidity > 80) visibility *= 0.7;
    if (humidity > 90) visibility *= 0.5;
    if (temp > 30) visibility *= 0.8;
    if (pressure < 1000) visibility *= 0.9;
    
    return Math.round(visibility * 10) / 10;
  };

  const calculateWeatherImpact = (temp, humidity, wind, pm25, pm10) => {
    let pm25Impact = 'neutral';
    let pm10Impact = 'neutral';
    let dispersion = 'neutral';

    // Temperature impact
    if (temp > 30) {
      pm25Impact = 'negative';
      pm10Impact = 'negative';
    } else if (temp < 10) {
      pm25Impact = 'positive';
      pm10Impact = 'positive';
    }

    // Humidity impact
    if (humidity > 70) {
      pm25Impact = 'negative';
      pm10Impact = 'negative';
    } else if (humidity < 40) {
      pm25Impact = 'positive';
      pm10Impact = 'positive';
    }

    // Wind impact on dispersion
    if (wind > 10) {
      dispersion = 'positive';
    } else if (wind < 2) {
      dispersion = 'negative';
    }

    return { pm25Impact, pm10Impact, dispersion };
  };

  const getWeatherIcon = (condition) => {
    if (condition === 'sunny') return <Sun className="w-8 h-8 text-yellow-400" />;
    if (condition === 'cloudy') return <Cloud className="w-8 h-8 text-gray-400" />;
    if (condition === 'rainy') return <Droplets className="w-8 h-8 text-blue-400" />;
    return <Sun className="w-8 h-8 text-yellow-400" />;
  };

  const getWeatherCondition = (temp, humidity) => {
    if (humidity > 80) return 'rainy';
    if (temp > 30) return 'sunny';
    if (temp < 15) return 'cloudy';
    return 'sunny';
  };

  const getImpactIcon = (impact) => {
    if (impact === 'positive') return <TrendingDown className="w-5 h-5 text-emerald-400" />;
    if (impact === 'negative') return <TrendingUp className="w-5 h-5 text-red-400" />;
    return <TrendingUp className="w-5 h-5 text-gray-400" />;
  };

  const getImpactText = (impact) => {
    if (impact === 'positive') return 'Favorable';
    if (impact === 'negative') return 'Unfavorable';
    return 'Neutral';
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen text-white">
        <div className="glass-card rounded-xl p-6">
          <div className="flex flex-col items-center py-12">
            <span className="mb-4 text-emerald-400 font-semibold text-lg">Loading weather data...</span>
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

  const weatherCondition = getWeatherCondition(weatherData.temperature, weatherData.humidity);

  return (
    <div className="min-h-screen text-white">
      {/* Header */}
      <div className="glass-card rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Weather Status</h1>
            <p className="text-white/70">Current weather conditions and their impact on air quality</p>
          </div>
          <button
            onClick={fetchData}
            className="glass-button px-6 py-3 rounded-xl text-white font-medium"
          >
            Refresh Data
          </button>
        </div>
      </div>

      {/* Current Weather */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <div className="weather-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                {getWeatherIcon(weatherCondition)}
                <div>
                  <h2 className="text-3xl font-bold text-white">{weatherData.temperature}°C</h2>
                  <p className="text-white/70 capitalize">{weatherCondition} conditions</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-white/60">Last Updated</p>
                <p className="text-white">{new Date().toLocaleString()}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Droplets className="w-6 h-6 text-blue-400" />
                </div>
                <p className="text-2xl font-bold text-white">{weatherData.humidity}%</p>
                <p className="text-sm text-white/60">Humidity</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Gauge className="w-6 h-6 text-purple-400" />
                </div>
                <p className="text-2xl font-bold text-white">{weatherData.pressure} hPa</p>
                <p className="text-sm text-white/60">Pressure</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Wind className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-2xl font-bold text-white">{weatherData.windSpeed} m/s</p>
                <p className="text-sm text-white/60">Wind Speed</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Eye className="w-6 h-6 text-cyan-400" />
                </div>
                <p className="text-2xl font-bold text-white">{weatherData.visibility} km</p>
                <p className="text-sm text-white/60">Visibility</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-4 text-white">Weather Summary</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-white/70">Temperature:</span>
                <span className="text-white font-medium">{weatherData.temperature}°C</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/70">Humidity:</span>
                <span className="text-white font-medium">{weatherData.humidity}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/70">Pressure:</span>
                <span className="text-white font-medium">{weatherData.pressure} hPa</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/70">Wind Speed:</span>
                <span className="text-white font-medium">{weatherData.windSpeed} m/s</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/70">Visibility:</span>
                <span className="text-white font-medium">{weatherData.visibility} km</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Weather Impact on Air Quality */}
      <div className="glass-card rounded-xl p-6 mb-6">
        <h2 className="text-2xl font-bold text-white mb-6">Weather Impact on Air Quality</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* PM2.5 Impact */}
          <div className="recommendation-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">PM2.5 Impact</h3>
              {getImpactIcon(impact.pm25Impact)}
            </div>
            <div className={`text-center p-4 rounded-lg ${
              impact.pm25Impact === 'positive' ? 'bg-emerald-500/20' :
              impact.pm25Impact === 'negative' ? 'bg-red-500/20' : 'bg-gray-500/20'
            }`}>
              <p className={`text-lg font-bold ${
                impact.pm25Impact === 'positive' ? 'text-emerald-400' :
                impact.pm25Impact === 'negative' ? 'text-red-400' : 'text-gray-400'
              }`}>
                {getImpactText(impact.pm25Impact)}
              </p>
            </div>
            <div className="mt-4 space-y-2 text-sm text-white/80">
              {impact.pm25Impact === 'positive' && (
                <>
                  <p>• Lower temperatures reduce PM2.5 formation</p>
                  <p>• Moderate humidity helps particle settling</p>
                </>
              )}
              {impact.pm25Impact === 'negative' && (
                <>
                  <p>• High temperatures increase PM2.5 levels</p>
                  <p>• High humidity traps particles</p>
                </>
              )}
              {impact.pm25Impact === 'neutral' && (
                <p>• Weather conditions have minimal impact</p>
              )}
            </div>
          </div>

          {/* PM10 Impact */}
          <div className="recommendation-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">PM10 Impact</h3>
              {getImpactIcon(impact.pm10Impact)}
            </div>
            <div className={`text-center p-4 rounded-lg ${
              impact.pm10Impact === 'positive' ? 'bg-emerald-500/20' :
              impact.pm10Impact === 'negative' ? 'bg-red-500/20' : 'bg-gray-500/20'
            }`}>
              <p className={`text-lg font-bold ${
                impact.pm10Impact === 'positive' ? 'text-emerald-400' :
                impact.pm10Impact === 'negative' ? 'text-red-400' : 'text-gray-400'
              }`}>
                {getImpactText(impact.pm10Impact)}
              </p>
            </div>
            <div className="mt-4 space-y-2 text-sm text-white/80">
              {impact.pm10Impact === 'positive' && (
                <>
                  <p>• Cooler temperatures reduce dust</p>
                  <p>• Moderate humidity settles particles</p>
                </>
              )}
              {impact.pm10Impact === 'negative' && (
                <>
                  <p>• High temperatures increase dust</p>
                  <p>• Dry conditions lift particles</p>
                </>
              )}
              {impact.pm10Impact === 'neutral' && (
                <p>• Weather conditions have minimal impact</p>
              )}
            </div>
          </div>

          {/* Dispersion */}
          <div className="recommendation-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Dispersion</h3>
              {getImpactIcon(impact.dispersion)}
            </div>
            <div className={`text-center p-4 rounded-lg ${
              impact.dispersion === 'positive' ? 'bg-emerald-500/20' :
              impact.dispersion === 'negative' ? 'bg-red-500/20' : 'bg-gray-500/20'
            }`}>
              <p className={`text-lg font-bold ${
                impact.dispersion === 'positive' ? 'text-emerald-400' :
                impact.dispersion === 'negative' ? 'text-red-400' : 'text-gray-400'
              }`}>
                {getImpactText(impact.dispersion)}
              </p>
            </div>
            <div className="mt-4 space-y-2 text-sm text-white/80">
              {impact.dispersion === 'positive' && (
                <>
                  <p>• Strong winds disperse pollutants</p>
                  <p>• Good air mixing conditions</p>
                </>
              )}
              {impact.dispersion === 'negative' && (
                <>
                  <p>• Low winds trap pollutants</p>
                  <p>• Poor air mixing conditions</p>
                </>
              )}
              {impact.dispersion === 'neutral' && (
                <p>• Moderate dispersion conditions</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Weather Recommendations */}
      <div className="glass-card rounded-xl p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Weather-Based Recommendations</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="recommendation-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">For High Temperature (&gt;30°C)</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5" />
                <span className="text-white/90">Stay indoors during peak hours (10 AM - 4 PM)</span>
              </li>
              <li className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5" />
                <span className="text-white/90">Use air conditioning to maintain indoor air quality</span>
              </li>
              <li className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5" />
                <span className="text-white/90">Stay hydrated to help your body cope with poor air quality</span>
              </li>
            </ul>
          </div>

          <div className="recommendation-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">For High Humidity (&gt;70%)</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5" />
                <span className="text-white/90">Use dehumidifiers to reduce indoor humidity</span>
              </li>
              <li className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5" />
                <span className="text-white/90">Avoid outdoor activities during high humidity periods</span>
              </li>
              <li className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5" />
                <span className="text-white/90">Monitor for increased respiratory symptoms</span>
              </li>
            </ul>
          </div>

          <div className="recommendation-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">For Low Wind Speed (&lt;2 m/s)</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5" />
                <span className="text-white/90">Pollutants may accumulate in the area</span>
              </li>
              <li className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5" />
                <span className="text-white/90">Use air purifiers indoors</span>
              </li>
              <li className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5" />
                <span className="text-white/90">Limit outdoor activities, especially near traffic</span>
              </li>
            </ul>
          </div>

          <div className="recommendation-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">For Good Conditions</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5" />
                <span className="text-white/90">Safe for outdoor activities</span>
              </li>
              <li className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5" />
                <span className="text-white/90">Good time for outdoor exercise</span>
              </li>
              <li className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5" />
                <span className="text-white/90">Natural ventilation is beneficial</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherStatus;
