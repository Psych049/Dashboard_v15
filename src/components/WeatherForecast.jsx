import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import { useTheme } from "../contexts/ThemeContext";

const WeatherForecast = ({ city = "Mumbai", days = 7, showCurrent = true }) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const apiKey = import.meta.env.VITE_WEATHER_API_KEY || "031c15b46712429b8cf162631251707";
  const baseUrl = "https://api.weatherapi.com/v1";

  const [weatherData, setWeatherData] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchWeather = useCallback(async (query) => {
    try {
      setLoading(true);
      setError(null);

      const res = await axios.get(
        `${baseUrl}/forecast.json?key=${apiKey}&q=${encodeURIComponent(query)}&days=${days}&aqi=yes`
      );

      if (res.data.error) {
        setError(`Location "${query}" not found.`);
        setWeatherData(null);
        setForecast([]);
        setLocation(null);
      } else {
        setWeatherData(res.data.current);
        setForecast(res.data.forecast.forecastday);
        setLocation(res.data.location);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error("Error fetching weather:", err);
      setError("Unable to fetch weather data. Please try again later.");
      setWeatherData(null);
      setForecast([]);
      setLocation(null);
    } finally {
      setLoading(false);
    }
  }, [apiKey, baseUrl, days]);

  useEffect(() => {
    if (city) {
      fetchWeather(city);
    }
  }, [city, fetchWeather]);

  // Auto-refresh weather data every 30 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (city && !loading) {
        fetchWeather(city);
      }
    }, 30 * 60 * 1000); // 30 minutes

    return () => clearInterval(interval);
  }, [city, loading, fetchWeather]);

  // Enhanced forecast data processing
  const processedForecast = useMemo(() => {
    if (!forecast || !Array.isArray(forecast)) return [];
    
    return forecast.map((day, index) => ({
      ...day,
      date: new Date(day.date),
      dayName: new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' }),
      fullDate: new Date(day.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      maxTemp: Math.round(day.day?.maxtemp_c),
      minTemp: Math.round(day.day?.mintemp_c),
      avgTemp: Math.round(day.day?.avgtemp_c),
      condition: day.day?.condition?.text || 'Unknown',
      icon: getWeatherIcon(day.day?.condition?.text),
      humidity: day.day?.avghumidity,
      chanceOfRain: day.day?.daily_chance_of_rain,
      uv: day.day?.uv,
      sunrise: day.astro?.sunrise,
      sunset: day.astro?.sunset,
      maxWind: day.day?.maxwind_kph,
      totalPrecip: day.day?.totalprecip_mm
    }));
  }, [forecast]);

  // Format last updated time
  const formattedLastUpdated = useMemo(() => {
    if (!lastUpdated) return null;
    try {
      return lastUpdated.toLocaleTimeString();
    } catch (err) {
      console.error('Error formatting time:', err);
      return null;
    }
  }, [lastUpdated]);

  const getWeatherIcon = useCallback((condition) => {
    if (!condition) return "🌤️";
    
    const conditionText = condition.toLowerCase();
    if (conditionText.includes("sunny") || conditionText.includes("clear")) return "☀️";
    if (conditionText.includes("cloudy") || conditionText.includes("overcast")) return "☁️";
    if (conditionText.includes("rain") || conditionText.includes("drizzle")) return "🌧️";
    if (conditionText.includes("snow")) return "❄️";
    if (conditionText.includes("thunder")) return "⛈️";
    if (conditionText.includes("fog") || conditionText.includes("mist")) return "🌫️";
    if (conditionText.includes("wind")) return "💨";
    if (conditionText.includes("partly")) return "⛅";
    return "🌤️";
  }, []);

  const getTemperatureColor = useCallback((temp) => {
    if (temp >= 30) return "text-red-500";
    if (temp >= 20) return "text-orange-500";
    if (temp >= 10) return "text-yellow-500";
    if (temp >= 0) return "text-blue-500";
    return "text-purple-500";
  }, []);

  const getUVLevel = useCallback((uv) => {
    if (uv <= 2) return { level: "Low", color: "text-green-500", bg: "bg-green-100" };
    if (uv <= 5) return { level: "Moderate", color: "text-yellow-500", bg: "bg-yellow-100" };
    if (uv <= 7) return { level: "High", color: "text-orange-500", bg: "bg-orange-100" };
    if (uv <= 10) return { level: "Very High", color: "text-red-500", bg: "bg-red-100" };
    return { level: "Extreme", color: "text-purple-500", bg: "bg-purple-100" };
  }, []);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading weather forecast...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        <div className="text-4xl mb-2">⚠️</div>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div
      className={`p-6 rounded-2xl shadow-lg ${
        isDark
          ? "bg-gradient-to-br from-blue-800 to-blue-900 text-white"
          : "bg-gradient-to-br from-blue-50 to-white text-gray-900"
      }`}
    >
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">
          Weather Forecast ({processedForecast.length} Days)
        </h2>
        {location && (
          <div className="text-sm opacity-80">
            {location.name}, {location.country}
          </div>
        )}
        {formattedLastUpdated && (
          <div className="text-xs opacity-60 mt-1">
            Last updated: {formattedLastUpdated}
          </div>
        )}
      </div>

      {/* Current Weather (if enabled) */}
      {showCurrent && weatherData && (
        <div className="mb-6 p-4 rounded-xl bg-white/10 backdrop-blur-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-3 text-center">Current Weather</h3>
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <div className="text-5xl mb-2">{getWeatherIcon(weatherData.condition?.text)}</div>
              <div className="text-4xl font-bold mb-1">{Math.round(weatherData.temp_c)}°C</div>
              <div className="text-lg capitalize opacity-90">{weatherData.condition?.text}</div>
              <div className="text-sm opacity-80">
                Feels like {Math.round(weatherData.feelslike_c)}°C
              </div>
            </div>
            
            <div className="mt-4 md:mt-0 grid grid-cols-2 gap-3 text-center">
              <div className="p-2 rounded-lg bg-white/20">
                <div className="text-sm opacity-80">Humidity</div>
                <div className="font-semibold">{weatherData.humidity}%</div>
              </div>
              <div className="p-2 rounded-lg bg-white/20">
                <div className="text-sm opacity-80">Wind</div>
                <div className="font-semibold">{weatherData.wind_kph} km/h</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Forecast Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
        {processedForecast.map((day, idx) => (
          <div
            key={idx}
            className={`flex flex-col items-center p-4 rounded-xl bg-white/10 backdrop-blur-lg shadow-lg hover:bg-white/20 transition-all duration-200 ${
              idx === 0 ? 'ring-2 ring-blue-400' : ''
            }`}
          >
            {/* Date Header */}
            <div className="text-center mb-3">
              <div className="text-sm font-semibold mb-1">
                {idx === 0 ? 'Today' : day.dayName}
              </div>
              <div className="text-xs opacity-70">
                {day.fullDate}
              </div>
            </div>

            {/* Weather Icon */}
            <div className="text-4xl mb-3">{day.icon}</div>

            {/* Temperature */}
            <div className="text-center mb-3">
              <div className="text-lg font-bold">
                <span className={getTemperatureColor(day.maxTemp)}>{day.maxTemp}°</span>
                <span className="text-gray-400"> / </span>
                <span className={getTemperatureColor(day.minTemp)}>{day.minTemp}°</span>
              </div>
              <div className="text-xs opacity-80">
                Avg: {day.avgTemp}°C
              </div>
            </div>

            {/* Condition */}
            <div className="text-xs opacity-80 text-center mb-3">
              {day.condition}
            </div>

            {/* Additional Details */}
            <div className="text-xs opacity-70 text-center space-y-1">
              <div className="flex items-center justify-center">
                <span className="mr-1">💧</span>
                <span>{day.chanceOfRain}%</span>
              </div>
              <div className="flex items-center justify-center">
                <span className="mr-1">💨</span>
                <span>{day.maxWind} km/h</span>
              </div>
              {day.totalPrecip > 0 && (
                <div className="flex items-center justify-center">
                  <span className="mr-1">🌧️</span>
                  <span>{day.totalPrecip}mm</span>
                </div>
              )}
            </div>

            {/* Sunrise/Sunset */}
            <div className="mt-3 text-xs opacity-70 text-center">
              <div className="flex items-center justify-center mb-1">
                <span className="mr-1">🌅</span>
                <span>{day.sunrise}</span>
              </div>
              <div className="flex items-center justify-center">
                <span className="mr-1">🌇</span>
                <span>{day.sunset}</span>
              </div>
            </div>

            {/* UV Index */}
            {day.uv && (
              <div className="mt-3 text-center">
                <div className="text-xs opacity-70 mb-1">UV Index</div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  isDark ? 'bg-white/20' : getUVLevel(day.uv).bg
                } ${getUVLevel(day.uv).color}`}>
                  {day.uv} - {getUVLevel(day.uv).level}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Forecast Summary */}
      {processedForecast.length > 0 && (
        <div className="mt-6 p-4 rounded-xl bg-white/10 backdrop-blur-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-3 text-center">Forecast Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-3 rounded-lg bg-white/20">
              <div className="text-2xl mb-1">🌡️</div>
              <div className="text-sm opacity-80">High Temp</div>
              <div className="font-semibold">
                {Math.max(...processedForecast.map(d => d.maxTemp))}°C
              </div>
            </div>
            <div className="p-3 rounded-lg bg-white/20">
              <div className="text-2xl mb-1">❄️</div>
              <div className="text-sm opacity-80">Low Temp</div>
              <div className="font-semibold">
                {Math.min(...processedForecast.map(d => d.minTemp))}°C
              </div>
            </div>
            <div className="p-3 rounded-lg bg-white/20">
              <div className="text-2xl mb-1">🌧️</div>
              <div className="text-sm opacity-80">Rain Chance</div>
              <div className="font-semibold">
                {Math.max(...processedForecast.map(d => d.chanceOfRain))}%
              </div>
            </div>
            <div className="p-3 rounded-lg bg-white/20">
              <div className="text-2xl mb-1">💨</div>
              <div className="text-sm opacity-80">Max Wind</div>
              <div className="font-semibold">
                {Math.max(...processedForecast.map(d => d.maxWind))} km/h
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeatherForecast;
