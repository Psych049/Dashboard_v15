import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import DataService from '../services/dataService';

const AlertsPanel = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const alertsData = await DataService.getAlerts();
      setAlerts(alertsData);
    } catch (err) {
      console.error('Error loading alerts:', err);
      setError('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  const getBadgeColor = (type) => {
    if (isDark) {
      switch (type) {
        case 'warning':
          return 'bg-yellow-900 bg-opacity-20 text-yellow-300 border border-yellow-800';
        case 'error':
          return 'bg-red-900 bg-opacity-20 text-red-300 border border-red-800';
        default:
          return 'bg-blue-900 bg-opacity-20 text-blue-300 border border-blue-800';
      }
    } else {
      switch (type) {
        case 'warning':
          return 'bg-yellow-100 text-yellow-800';
        case 'error':
          return 'bg-red-100 text-red-800';
        default:
          return 'bg-blue-100 text-blue-800';
      }
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'warning':
        return (
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'error':
        return (
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const dismissAlert = async (alertId) => {
    try {
      await DataService.markAlertAsRead(alertId);
      // Remove from local state
      setAlerts(prevAlerts => prevAlerts.filter(alert => alert.id !== alertId));
    } catch (err) {
      console.error('Error dismissing alert:', err);
    }
  };

  const clearAllAlerts = async () => {
    try {
      // Mark all alerts as read
      await Promise.all(alerts.map(alert => DataService.markAlertAsRead(alert.id)));
      setAlerts([]);
    } catch (err) {
      console.error('Error clearing alerts:', err);
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - alertTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hour${Math.floor(diffInMinutes / 60) > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffInMinutes / 1440)} day${Math.floor(diffInMinutes / 1440) > 1 ? 's' : ''} ago`;
  };

  if (loading) {
    return (
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-sm border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>System Alerts</h2>
        </div>
        <div className="flex items-center justify-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-sm border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>System Alerts</h2>
          <button 
            onClick={loadAlerts}
            className={`text-sm hover:text-gray-700 transition-colors ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Retry
          </button>
        </div>
        <div className="text-center py-6">
          <svg className={`h-12 w-12 mx-auto ${isDark ? 'text-gray-600' : 'text-gray-300'} mb-4`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-sm border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>System Alerts</h2>
        {alerts.length > 0 && (
          <button 
            className={`text-sm hover:text-gray-700 transition-colors ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={clearAllAlerts}
          >
            Clear All
          </button>
        )}
      </div>
      
      {alerts.length === 0 ? (
        <div className="text-center py-6">
          <svg className={`h-12 w-12 mx-auto ${isDark ? 'text-gray-600' : 'text-gray-300'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No active alerts</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {alerts.map((alert) => (
            <li key={alert.id} className={`${getBadgeColor(alert.type)} rounded-lg p-4 flex items-start`}>
              <div className="flex-shrink-0 mr-3">
                {getIcon(alert.type)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{alert.zone}</div>
                  <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {formatTimeAgo(alert.timestamp)}
                  </div>
                </div>
                <div className="text-sm mt-1">{alert.message}</div>
                {alert.severity && (
                  <div className={`text-xs mt-2 px-2 py-1 rounded-full inline-block ${
                    alert.severity === 'high' ? 'bg-red-200 text-red-800' :
                    alert.severity === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                    'bg-blue-200 text-blue-800'
                  }`}>
                    {alert.severity} priority
                  </div>
                )}
              </div>
              <button 
                className={`ml-3 transition-colors ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
                onClick={() => dismissAlert(alert.id)}
              >
                <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AlertsPanel;