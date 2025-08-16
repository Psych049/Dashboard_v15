// src/pages/Dashboard.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import StatsCard from '../components/StatsCard';
import WeatherPanel from '../components/WeatherPanel';
import AlertsPanel from '../components/AlertsPanel';
import TemperatureChart from '../components/charts/TemperatureChart';
import MoistureHumidityChart from '../components/charts/MoistureHumidityChart';
import PlantZonesPanel from '../components/PlantZonesPanel';
import PlantRecommendationsPanel from '../components/PlantRecommendationsPanel';
import DataService from '../services/dataService';

const Dashboard = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const minimalUI = import.meta.env.VITE_MINIMAL_UI === 'true';
  
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshCount, setRefreshCount] = useState(0);

  // Memoized refresh function to prevent unnecessary re-renders
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const dashboardStats = await DataService.getDashboardStats();
      
      // Validate stats data with better error handling
      if (!dashboardStats || !Array.isArray(dashboardStats)) {
        console.warn('Invalid dashboard stats format:', dashboardStats);
        setStats([]);
        setError('Invalid data format received from server');
        return;
      }
      
      const validatedStats = dashboardStats.filter(stat => {
        if (!stat || typeof stat !== 'object') return false;
        if (!stat.title || typeof stat.title !== 'string') return false;
        if (stat.value === undefined || stat.value === null) return false;
        return true;
      });
      
      setStats(validatedStats);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      const errorMessage = err?.message || 'Failed to load dashboard data. Please check your connection and try again.';
      setError(errorMessage);
      setStats([]); // Clear stats on error
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh effect with cleanup
  useEffect(() => {
    loadDashboardData();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      setRefreshCount(prev => prev + 1);
      loadDashboardData();
    }, 30000);
    
    return () => {
      clearInterval(interval);
    };
  }, [loadDashboardData]);

  // Manual refresh handler
  const handleRefresh = useCallback(() => {
    setRefreshCount(prev => prev + 1);
    loadDashboardData();
  }, [loadDashboardData]);

  // Memoized formatted last updated time
  const formattedLastUpdated = useMemo(() => {
    if (!lastUpdated) return '';
    
    try {
      const now = new Date();
      const diff = Math.floor((now - lastUpdated) / 1000);
      
      if (diff < 60) return 'Just now';
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      return `${Math.floor(diff / 3600)}h ago`;
    } catch (err) {
      console.error('Error formatting last updated time:', err);
      return 'Recently';
    }
  }, [lastUpdated]);

  // Loading state with skeleton
  if (loading && stats.length === 0) {
    return (
      <div className="space-y-6 max-w-full animate-fade-in" role="main" aria-label="Garden Dashboard">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className={`text-2xl sm:text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            🌿 Garden Dashboard
          </h1>
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-green-500" aria-hidden="true"></div>
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Loading your garden data...
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-4 sm:p-6 rounded-lg shadow-soft border ${isDark ? 'border-gray-700' : 'border-gray-200'} animate-pulse`}>
              <div className="flex items-center justify-between">
                <div className="h-4 bg-gray-300 rounded w-24"></div>
                <div className="h-8 w-8 bg-gray-300 rounded-full"></div>
              </div>
              <div className="mt-4">
                <div className="h-8 bg-gray-300 rounded w-16"></div>
                <div className="h-4 bg-gray-300 rounded w-12 mt-2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error && stats.length === 0) {
    return (
      <div className="space-y-6 max-w-full animate-fade-in" role="main" aria-label="Garden Dashboard">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className={`text-2xl sm:text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            🌿 Garden Dashboard
          </h1>
          <button 
            onClick={handleRefresh}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
              isDark 
                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
            aria-label="Retry loading dashboard data"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Retry</span>
          </button>
        </div>
        
        <div className={`${isDark ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'} border rounded-lg p-6`} role="alert">
          <div className="flex items-center">
            <svg className="h-6 w-6 text-red-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-lg font-medium text-red-800 dark:text-red-400">Error Loading Data</h3>
              <p className="text-red-700 dark:text-red-300 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-full animate-fade-in" role="main" aria-label="Garden Dashboard">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-2xl sm:text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            🌿 Garden Dashboard
          </h1>
          {lastUpdated && (
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Last updated: {formattedLastUpdated}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={handleRefresh}
            disabled={loading}
            className={`p-2 rounded-lg transition-colors flex items-center space-x-2 ${
              loading 
                ? 'opacity-50 cursor-not-allowed' 
                : isDark 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
            title="Refresh data"
            aria-label="Refresh dashboard data"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current" aria-hidden="true"></div>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <section aria-label="Garden Statistics">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.length > 0 ? (
            stats.map((stat, index) => (
              <StatsCard
                key={`${stat.title}-${index}-${refreshCount}`}
                title={stat.title}
                value={stat.value}
                change={stat.change}
                trend={stat.trend}
                icon={stat.icon}
                loading={loading}
              />
            ))
          ) : (
            <div className={`col-span-full ${isDark ? 'bg-gray-800' : 'bg-white'} p-6 sm:p-8 rounded-lg shadow-soft border ${isDark ? 'border-gray-700' : 'border-gray-200'} text-center`}>
              <svg className={`h-16 w-16 mx-auto ${isDark ? 'text-gray-600' : 'text-gray-300'} mb-4`} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>No sensor data available</h3>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'} mb-4`}>Connect your ESP32 devices to see real-time data</p>
              <button 
                onClick={handleRefresh}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isDark 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
                aria-label="Check for new sensor data"
              >
                Check for Data
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Weather Panel (hidden in minimal UI) */}
      {!minimalUI && (
        <section aria-label="Weather Information">
          <WeatherPanel />
        </section>
      )}

      {/* Alerts */}
      <section aria-label="System Alerts">
        <AlertsPanel />
      </section>

      {/* Charts Section (hidden in minimal UI) */}
      {!minimalUI && (
        <section aria-label="Sensor Data Charts">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-4 sm:p-6 rounded-lg shadow-soft border ${isDark ? 'border-gray-700' : 'border-gray-200'} transition-all duration-200 hover:shadow-md`}>
              <h2 className={`text-lg font-medium mb-4 ${isDark ? 'text-white' : 'text-gray-800'} flex items-center`}>
                <span className="mr-2" aria-hidden="true">🌡</span>
                Temperature Trends (24h)
              </h2>
              <div className="h-64 sm:h-80">
                <TemperatureChart />
              </div>
            </div>
            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-4 sm:p-6 rounded-lg shadow-soft border ${isDark ? 'border-gray-700' : 'border-gray-200'} transition-all duration-200 hover:shadow-md`}>
              <h2 className={`text-lg font-medium mb-4 ${isDark ? 'text-white' : 'text-gray-800'} flex items-center`}>
                <span className="mr-2" aria-hidden="true">💧</span>
                Moisture & Humidity Trends (24h)
              </h2>
              <div className="h-64 sm:h-80">
                <MoistureHumidityChart />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Plant Zones & Recommendations (hide recommendations in minimal UI) */}
      <section aria-label="Plant Management">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          <PlantZonesPanel />
          {!minimalUI && <PlantRecommendationsPanel />}
        </div>
      </section>

      {/* Quick start CTA when minimal UI is on */}
      {minimalUI && (
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-4 sm:p-6 rounded-lg shadow-soft border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Get started by adding a device and generating an API key on the System page.</p>
          <a href="/system" className="inline-block mt-3 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded">Go to System</a>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
