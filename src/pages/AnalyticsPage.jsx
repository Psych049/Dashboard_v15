import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { useTheme } from '../contexts/ThemeContext';
import AnalyticsService from '../services/analyticsService';

const AnalyticsPage = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [period, setPeriod] = useState('month');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAnalyticsData();
  }, [period]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await AnalyticsService.getPerformanceMetrics(period);
      setAnalyticsData(data);
    } catch (err) {
      console.error('Error loading analytics data:', err);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadAnalyticsData();
  };

  const getInsightTypeColor = (type) => {
    switch (type) {
      case 'positive':
        return 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800';
      case 'recommendation':
        return 'border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800';
      default:
        return 'border-gray-200 bg-gray-50 dark:bg-gray-900/20 dark:border-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">Analytics & Insights</h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-800 dark:text-white">Garden Performance</h2>
            <div className="inline-flex rounded-md shadow-sm" role="group">
              <button className="px-4 py-2 text-sm font-medium rounded-l-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                Week
              </button>
              <button className="px-4 py-2 text-sm font-medium rounded-r-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                Month
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 animate-pulse">
                <div className="h-4 bg-gray-300 rounded w-24 mb-2"></div>
                <div className="h-8 bg-gray-300 rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 animate-pulse">
              <div className="h-6 bg-gray-300 rounded w-32 mb-4"></div>
              <div className="h-64 bg-gray-300 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">Analytics & Insights</h1>
          <button 
            onClick={handleRefresh}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Retry
          </button>
        </div>
        
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="flex items-center">
            <svg className="h-6 w-6 text-red-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-lg font-medium text-red-800 dark:text-red-200">Error Loading Analytics</h3>
              <p className="text-red-700 dark:text-red-300 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">Analytics & Insights</h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 text-center">
          <svg className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400">No analytics data available</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm">Connect your sensors and start monitoring to see analytics</p>
        </div>
      </div>
    );
  }

  const { summary, waterUsageByZone, waterSavings, moistureDistribution, healthScores, insights } = analyticsData;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
      <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">Analytics & Insights</h1>
        <button 
          onClick={handleRefresh}
          className="p-2 rounded-lg transition-colors bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
          title="Refresh analytics"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-800 dark:text-white">Garden Performance</h2>
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              onClick={() => setPeriod('week')}
              className={`px-4 py-2 text-sm font-medium rounded-l-md ${
                period === 'week' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              Week
            </button>
            <button
              type="button"
              onClick={() => setPeriod('month')}
              className={`px-4 py-2 text-sm font-medium rounded-r-md ${
                period === 'month' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              Month
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Water Usage</div>
            <div className="mt-1 flex items-baseline">
              <div className="text-2xl font-semibold text-gray-900 dark:text-white">{summary.totalWaterUsage}L</div>
              <div className="ml-2 text-sm text-green-600 dark:text-green-400">
                {summary.totalWaterUsage > 0 ? '-15% vs avg' : 'No data'}
              </div>
            </div>
          </div>
          
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Water Savings</div>
            <div className="mt-1 flex items-baseline">
              <div className="text-2xl font-semibold text-gray-900 dark:text-white">{summary.totalWaterSaved}L</div>
              <div className="ml-2 text-sm text-green-600 dark:text-green-400">
                {summary.totalWaterSaved > 0 ? '+8% vs last month' : 'No data'}
              </div>
            </div>
          </div>
          
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg. Soil Moisture</div>
            <div className="mt-1 flex items-baseline">
              <div className="text-2xl font-semibold text-gray-900 dark:text-white">{summary.avgMoisture}%</div>
              <div className="ml-2 text-sm text-green-600 dark:text-green-400">
                {summary.avgMoisture >= 40 && summary.avgMoisture <= 60 ? 'Optimal' : 
                 summary.avgMoisture > 0 ? 'Needs attention' : 'No data'}
              </div>
            </div>
          </div>
          
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Plant Health Score</div>
            <div className="mt-1 flex items-baseline">
              <div className="text-2xl font-semibold text-gray-900 dark:text-white">{summary.avgHealthScore}/100</div>
              <div className="ml-2 text-sm text-green-600 dark:text-green-400">
                {summary.avgHealthScore > 0 ? '+5 pts' : 'No data'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Water Usage By Zone Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Water Usage By Zone</h2>
          {waterUsageByZone.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={waterUsageByZone}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#e5e7eb"} />
                  <XAxis dataKey="name" stroke={isDark ? "#9CA3AF" : "#6b7280"} />
                  <YAxis label={{ value: 'Liters', angle: -90, position: 'insideLeft' }} stroke={isDark ? "#9CA3AF" : "#6b7280"} />
                <Tooltip 
                  contentStyle={{ 
                      backgroundColor: isDark ? '#1F2937' : '#ffffff', 
                      border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                    borderRadius: '8px',
                      color: isDark ? '#F9FAFB' : '#111827'
                  }}
                />
                <Bar dataKey="usage" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
              No water usage data available
            </div>
          )}
        </div>

        {/* Water Savings Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Water Savings Trend</h2>
          {waterSavings.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={waterSavings}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#e5e7eb"} />
                  <XAxis dataKey="month" stroke={isDark ? "#9CA3AF" : "#6b7280"} />
                  <YAxis label={{ value: 'Liters', angle: -90, position: 'insideLeft' }} stroke={isDark ? "#9CA3AF" : "#6b7280"} />
                <Tooltip 
                  contentStyle={{ 
                      backgroundColor: isDark ? '#1F2937' : '#ffffff', 
                      border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                    borderRadius: '8px',
                      color: isDark ? '#F9FAFB' : '#111827'
                  }}
                />
                <Legend />
                <Bar dataKey="saved" fill="#22c55e" name="Water Saved" />
                <Bar dataKey="regular" fill="#94a3b8" name="Regular Usage" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
              No water savings data available
            </div>
          )}
        </div>

        {/* Moisture Level Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Moisture Level Distribution</h2>
          {moistureDistribution.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                    data={moistureDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                    {moistureDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                      backgroundColor: isDark ? '#1F2937' : '#ffffff', 
                      border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                    borderRadius: '8px',
                      color: isDark ? '#F9FAFB' : '#111827'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
              No moisture data available
            </div>
          )}
        </div>

        {/* Plant Health Scores */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Plant Health Scores</h2>
          {healthScores.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={healthScores}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#e5e7eb"} />
                  <XAxis dataKey="zone" stroke={isDark ? "#9CA3AF" : "#6b7280"} />
                  <YAxis label={{ value: 'Score', angle: -90, position: 'insideLeft' }} domain={[0, 100]} stroke={isDark ? "#9CA3AF" : "#6b7280"} />
                <Tooltip 
                  contentStyle={{ 
                      backgroundColor: isDark ? '#1F2937' : '#ffffff', 
                      border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                    borderRadius: '8px',
                      color: isDark ? '#F9FAFB' : '#111827'
                  }}
                />
                <Bar dataKey="score" fill="#3b82f6">
                    {healthScores.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.score >= 90 ? '#22c55e' : 
                        entry.score >= 75 ? '#3b82f6' : 
                        entry.score >= 60 ? '#eab308' : '#ef4444'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
              No health score data available
            </div>
          )}
        </div>
      </div>

      {/* ML Insights */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Smart Gardening Insights</h2>
        {insights.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {insights.map(insight => (
              <div key={insight.id} className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${getInsightTypeColor(insight.type)}`}>
              <div className="text-3xl mb-3">{insight.icon}</div>
              <h3 className="font-medium text-lg text-gray-800 dark:text-white mb-2">{insight.title}</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">{insight.description}</p>
            </div>
          ))}
        </div>
        ) : (
          <div className="text-center py-8">
            <svg className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400">No insights available yet</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm">Start monitoring your garden to receive smart insights</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage;