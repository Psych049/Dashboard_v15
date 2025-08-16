import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import DataService from '../../services/dataService';
import { useTheme } from '../../contexts/ThemeContext';

const TemperatureChart = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadTemperatureData();
  }, []);

  const loadTemperatureData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const sensorData = await DataService.getSensorDataForCharts(24);
      
      // Transform data for chart
      const chartData = sensorData.map(item => ({
        time: new Date(item.timestamp).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        }),
        temperature: parseFloat(item.temperature) || 0
      }));
      
      setData(chartData);
    } catch (err) {
      console.error('Error loading temperature data:', err);
      setError('Failed to load temperature data');
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={`p-3 rounded-lg shadow-soft border ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Time: {label}
          </p>
          <p className={`text-orange-500 font-semibold`}>
            Temperature: {payload[0].value}°C
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="h-72 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Loading temperature data...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-72 flex items-center justify-center">
        <div className="text-center">
          <svg className={`h-12 w-12 mx-auto ${isDark ? 'text-gray-600' : 'text-gray-400'} mb-4`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-sm mb-2`}>{error}</p>
          <button 
            onClick={loadTemperatureData}
            className={`px-3 py-1 rounded-lg text-xs transition-colors ${
              isDark 
                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center">
        <div className="text-center">
          <svg className={`h-12 w-12 mx-auto ${isDark ? 'text-gray-600' : 'text-gray-400'} mb-4`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-sm mb-1`}>No temperature data available</p>
          <p className={`${isDark ? 'text-gray-500' : 'text-gray-400'} text-xs`}>Connect your sensors to see real-time data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke={isDark ? '#374151' : '#e5e7eb'} 
          />
          <XAxis 
            dataKey="time" 
            tick={{ 
              fontSize: 12,
              fill: isDark ? '#9ca3af' : '#6b7280'
            }}
            interval="preserveStartEnd"
            stroke={isDark ? '#374151' : '#e5e7eb'}
          />
          <YAxis 
            tick={{ 
              fontSize: 12,
              fill: isDark ? '#9ca3af' : '#6b7280'
            }}
            domain={['dataMin - 2', 'dataMax + 2']}
            stroke={isDark ? '#374151' : '#e5e7eb'}
          />
          <Tooltip 
            content={<CustomTooltip />}
            cursor={{
              stroke: isDark ? '#6b7280' : '#d1d5db',
              strokeWidth: 1,
              strokeDasharray: '3 3'
            }}
          />
          <Legend 
            wrapperStyle={{
              color: isDark ? '#e5e7eb' : '#374151'
            }}
          />
          <Line 
            type="monotone" 
            dataKey="temperature" 
            stroke="#f97316" 
            strokeWidth={3}
            activeDot={{ 
              r: 8,
              stroke: '#f97316',
              strokeWidth: 2,
              fill: isDark ? '#1f2937' : '#ffffff'
            }} 
            name="Temperature (°C)"
            dot={{ 
              r: 4,
              fill: '#f97316',
              stroke: isDark ? '#1f2937' : '#ffffff',
              strokeWidth: 2
            }}
            connectNulls={true}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TemperatureChart;