import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import DataService from '../services/dataService';

const PlantZonesPanel = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadZones();
  }, []);

  const loadZones = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const zonesData = await DataService.getZones();
      setZones(zonesData);
    } catch (err) {
      console.error('Error loading zones:', err);
      setError('Failed to load zones');
    } finally {
      setLoading(false);
    }
  };

  const getMoistureColor = (level) => {
    if (level < 30) return 'text-red-500';
    if (level < 40) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getMoistureLabel = (level) => {
    if (level < 30) return 'Low';
    if (level < 40) return 'Medium';
    return 'Good';
  };

  if (loading) {
    return (
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-sm border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <h2 className={`text-lg font-medium mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>Plant Zones</h2>
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
          <h2 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>Plant Zones</h2>
          <button 
            onClick={loadZones}
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
        <h2 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>Plant Zones</h2>
        <button 
          onClick={loadZones}
          className={`p-2 rounded-lg transition-colors ${
            isDark 
              ? 'bg-gray-700 hover:bg-gray-600 text-white' 
              : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
          }`}
          title="Refresh zones"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
      
      {zones.length === 0 ? (
        <div className="text-center py-6">
          <svg className={`h-12 w-12 mx-auto ${isDark ? 'text-gray-600' : 'text-gray-300'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
          </svg>
          <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No zones configured</p>
          <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Create zones to start monitoring your plants</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className={`px-3 py-2 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Zone</th>
                <th className={`px-3 py-2 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Soil Type</th>
                <th className={`px-3 py-2 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Moisture Level</th>
                <th className={`px-3 py-2 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Sensor ID</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {zones.map((zone) => (
                <tr key={zone.id}>
                  <td className={`px-3 py-3 text-sm font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>{zone.name}</td>
                  <td className={`px-3 py-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{zone.soil_type}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center">
                      <div className={`w-24 h-2 rounded mr-2 ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                        <div 
                          className={`h-full rounded ${zone.moisture_level < 30 ? 'bg-red-500' : zone.moisture_level < 40 ? 'bg-yellow-500' : 'bg-green-500'}`}
                          style={{ width: `${zone.moisture_level}%` }}
                        ></div>
                      </div>
                      <span className={`text-sm font-medium ${getMoistureColor(zone.moisture_level)}`}>
                        {zone.moisture_level}% ({getMoistureLabel(zone.moisture_level)})
                      </span>
                    </div>
                  </td>
                  <td className={`px-3 py-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    <code className={`px-2 py-1 rounded text-xs ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                      {zone.sensor_id}
                    </code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PlantZonesPanel;