import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import axios from "axios";
import { useTheme } from "../contexts/ThemeContext";

export default function WeatherPanel() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const apiKey =
    import.meta.env.VITE_WEATHER_API_KEY || "031c15b46712429b8cf162631251707";
  const baseUrl = "https://api.weatherapi.com/v1";

  const [city, setCity] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [weatherData, setWeatherData] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const timeoutRef = useRef(null);
  const abortControllerRef = useRef(null);

  const fetchWeather = useCallback(
    async (query) => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      abortControllerRef.current = new AbortController();

      setLoading(true);
      setSearchLoading(true);
      setError(null);

      try {
        const res = await axios.get(
          `${baseUrl}/forecast.json?key=${apiKey}&q=${encodeURIComponent(
            query
          )}&days=3&aqi=yes`,
          { signal: abortControllerRef.current.signal }
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
        if (err.name !== "AbortError") {
          console.error("Error fetching weather:", err);
          setError("Unable to fetch weather data.");
        }
        setWeatherData(null);
        setForecast([]);
        setLocation(null);
      } finally {
        setLoading(false);
        setSearchLoading(false);
      }
    },
    [apiKey, baseUrl]
  );

  useEffect(() => {
    fetchWeather(city);
    return () => abortControllerRef.current?.abort();
  }, [fetchWeather, city]);

  // auto refresh every 30 mins
  useEffect(() => {
    const interval = setInterval(() => {
      if (city && !loading) {
        fetchWeather(city);
      }
    }, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [city, loading, fetchWeather]);

  const handleLocationClick = useCallback(async () => {
    setError(null);
    if (!navigator.geolocation) {
      setError("Geolocation not supported.");
      return;
    }
    setLocationLoading(true);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setError("Location request timed out.");
      setLocationLoading(false);
    }, 10000);

    try {
      const pos = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000,
        })
      );

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      const { latitude, longitude } = pos.coords;

      try {
        const reverseRes = await axios.get(
          `https://nominatim.openstreetmap.org/reverse`,
          {
            params: { lat: latitude, lon: longitude, format: "json" },
            headers: { "Accept-Language": "en" },
            timeout: 5000,
          }
        );

        const cityName =
          reverseRes.data.address.city ||
          reverseRes.data.address.town ||
          reverseRes.data.address.village ||
          reverseRes.data.address.state ||
          reverseRes.data.address.country;

        if (cityName) {
          setCity(cityName);
          setInputValue(cityName);
        }
      } catch {
        setError("Could not determine city name.");
      }
    } catch (posErr) {
      setError("Could not get location.");
    } finally {
      setLocationLoading(false);
    }
  }, []);

  const handleCityInputChange = (e) => {
    setInputValue(e.target.value);
    if (error) setError(null);
  };

  const handleCitySearch = () => {
    if (inputValue.trim()) {
      setCity(inputValue.trim());
      setSearchLoading(true);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleCitySearch();
    }
  };

  const getWeatherIcon = (condition) => {
    if (!condition) return "🌤️";
    const t = condition.toLowerCase();
    if (t.includes("sunny") || t.includes("clear")) return "☀️";
    if (t.includes("cloudy") || t.includes("overcast")) return "☁️";
    if (t.includes("rain") || t.includes("drizzle")) return "🌧️";
    if (t.includes("snow")) return "❄️";
    if (t.includes("thunder")) return "⛈️";
    if (t.includes("fog") || t.includes("mist")) return "🌫️";
    if (t.includes("wind")) return "💨";
    return "🌤️";
  };

  const processedForecast = useMemo(() => {
    if (!forecast || !Array.isArray(forecast)) return [];
    return forecast.map((day) => ({
      ...day,
      dayName: new Date(day.date).toLocaleDateString(undefined, {
        weekday: "short",
      }),
      maxTemp: Math.round(day.day?.maxtemp_c),
      minTemp: Math.round(day.day?.mintemp_c),
      condition: day.day?.condition?.text || "Unknown",
      icon: getWeatherIcon(day.day?.condition?.text),
      chanceOfRain: day.day?.daily_chance_of_rain,
      sunrise: day.astro?.sunrise,
      sunset: day.astro?.sunset,
    }));
  }, [forecast]);

  return (
    <div
      className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-4 sm:p-6 rounded-lg shadow-soft border ${isDark ? 'border-gray-700' : 'border-gray-200'} transition-all duration-200 hover:shadow-md`}
    >
      {/* Top Row: Header + Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className={`text-lg font-medium mb-4 ${isDark ? 'text-white' : 'text-gray-800'} flex items-center`}>
            <span className="mr-2" aria-hidden="true">🌤️</span>
            Weather
          </h2>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {location
              ? `${location.name}, ${location.country}`
              : "Loading location..."}
          </p>
          {lastUpdated && (
            <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              Updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <input
            value={inputValue}
            onChange={handleCityInputChange}
            onKeyDown={handleKeyPress}
            placeholder="Search city..."
            className={`px-3 py-2 border rounded-lg text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
          />
          <button
            onClick={handleCitySearch}
            disabled={searchLoading}
            className={`px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isDark 
                ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {searchLoading ? "Searching..." : "Search"}
          </button>
          <button
            onClick={handleLocationClick}
            className={`px-3 py-2 rounded-lg text-sm transition-colors ${
              isDark 
                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            Use My Location
          </button>
        </div>
      </div>

      {/* Current Weather */}
      {loading ? (
        <p className={`text-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading...</p>
      ) : error ? (
        <p className={`text-center text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>{error}</p>
      ) : (
        weatherData && (
          <div className="grid gap-4">
            <div className="flex items-center gap-4">
              <div className="text-5xl">{getWeatherIcon(weatherData.condition?.text)}</div>
              <div>
                <div className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{Math.round(weatherData.temp_c)}°C</div>
                <div className={`text-sm capitalize ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {weatherData.condition?.text}
                </div>
                <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Feels like {Math.round(weatherData.feelslike_c)}°C
                </div>
              </div>
              <div className="ml-auto grid grid-cols-2 gap-2 text-center text-xs">
                <div className={isDark ? 'text-gray-300' : 'text-gray-600'}>💧 {weatherData.humidity}%</div>
                <div className={isDark ? 'text-gray-300' : 'text-gray-600'}>💨 {weatherData.wind_kph} km/h</div>
                <div className={isDark ? 'text-gray-300' : 'text-gray-600'}>👁️ {weatherData.vis_km} km</div>
                <div className={isDark ? 'text-gray-300' : 'text-gray-600'}>🌡️ {weatherData.pressure_mb} mb</div>
              </div>
            </div>

            {/* Forecast */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              {processedForecast.map((day, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}
                >
                  <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>{day.dayName}</div>
                  <div className="text-lg">{day.icon}</div>
                  <div className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                    {day.maxTemp}° / {day.minTemp}°
                  </div>
                  <div className={isDark ? 'text-gray-400' : 'text-gray-500'}>{day.condition}</div>
                  <div className={isDark ? 'text-gray-300' : 'text-gray-600'}>💧 {day.chanceOfRain}%</div>
                </div>
              ))}
            </div>

            {/* Additional Info */}
            <div className="grid grid-cols-4 text-center text-xs gap-2 mt-2">
              <div className={isDark ? 'text-gray-300' : 'text-gray-600'}>🌅 {processedForecast[0]?.sunrise || "N/A"}</div>
              <div className={isDark ? 'text-gray-300' : 'text-gray-600'}>🌇 {processedForecast[0]?.sunset || "N/A"}</div>
              <div className={isDark ? 'text-gray-300' : 'text-gray-600'}>🕒 {location?.tz_id || "N/A"}</div>
              <div className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                📍{" "}
                {location?.lat
                  ? `${parseFloat(location.lat).toFixed(2)}, ${parseFloat(
                      location.lon
                    ).toFixed(2)}`
                  : "N/A"}
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}
