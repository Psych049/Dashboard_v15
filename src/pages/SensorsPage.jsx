import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme } from '../contexts/ThemeContext';

const SensorsPage = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [sensors, setSensors] = useState([]);
  const [sensorData, setSensorData] = useState([]);
  const [selectedSensor, setSelectedSensor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('day'); // day, week, month

  // Sample data until we connect to real sensor data
  const mockSensors = [
    { id: 'sensor1', name: 'Garden Sensor 1', zone: 'Vegetable Garden', status: 'online', battery: 85 },
    { id: 'sensor2', name: 'Garden Sensor 2', zone: 'Flower Bed', status: 'online', battery: 72 },
    { id: 'sensor3', name: 'Garden Sensor 3', zone: 'Herb Garden', status: 'offline', battery: 15 },
    { id: 'sensor4', name: 'Indoor Sensor 1', zone: 'Indoor Plants', status: 'online', battery: 90 }
  ];

  // Generate mock sensor data
  const generateMockData = (sensorId, timeframe) => {
    const data = [];
    const now = new Date();
    const points = timeframe === 'day' ? 24 : timeframe === 'week' ? 7 : 30;
    const step = timeframe === 'day' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000; // hour or day in ms
    
    for (let i = points - 1; i >= 0; i--) {
      const time = new Date(now.getTime() - (i * step));
      data.push({
        time: timeframe === 'day' 
          ? time.getHours() + ':00' 
          : `${time.getMonth() + 1}/${time.getDate()}`,
        temperature: Math.round((15 + Math.random() * 15) * 10) / 10,
        humidity: Math.round((40 + Math.random() * 40) * 10) / 10,
        soil_moisture: Math.round((20 + Math.random() * 40) * 10) / 10
      });
    }
    
    return data;
  };

  useEffect(() => {
    // Load sensors
    const loadSensors = async () => {
      setLoading(true);
      try {
        // In a real app, we would fetch from Supabase here
        // const { data, error } = await supabase
        //   .from('sensors')
        //   .select('*');
        
        // if (error) throw error;
        // setSensors(data || []);

        // Using mock data for now
        setSensors(mockSensors);
        
        // Set the first sensor as selected by default
        if (mockSensors.length > 0 && !selectedSensor) {
          setSelectedSensor(mockSensors[0].id);
        }
      } catch (err) {
        console.error('Error loading sensors:', err);
        setError('Failed to load sensors. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadSensors();
  }, []);

  useEffect(() => {
    // Load sensor data when a sensor is selected
    if (selectedSensor) {
      const data = generateMockData(selectedSensor, timeframe);
      setSensorData(data);
    }
  }, [selectedSensor, timeframe]);

  // Function to simulate generating real-time data
  const handleRefresh = () => {
    // Reload sensors and data
    const loadSensors = async () => {
      setLoading(true);
      setError(null);
      try {
        // In a real app, we would fetch from Supabase here
        // const { data, error } = await supabase
        //   .from('sensors')
        //   .select('*');
        
        // if (error) throw error;
        // setSensors(data || []);

        // Using mock data for now
        setSensors(mockSensors);
        
        // Maintain selected sensor or set first one
        if (mockSensors.length > 0) {
          if (!selectedSensor || !mockSensors.find(s => s.id === selectedSensor)) {
            setSelectedSensor(mockSensors[0].id);
          }
        }
      } catch (err) {
        console.error('Error loading sensors:', err);
        setError('Failed to load sensors. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadSensors();
  };

  const simulateSensorData = async () => {
    try {
      // Call the edge function to simulate sensor data
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/simulate-sensor-data`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabase.auth.session()?.access_token}`
          }
        }
      );
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate sensor data');
      }
      
      alert('Sensor data generated successfully!');
      
    } catch (err) {
      console.error('Error generating sensor data:', err);
      setError('Failed to generate sensor data. Please try again.');
    }
  };

  const getSensorStatusClass = (status) => {
    switch (status) {
      case 'online':
        return isDark ? 'bg-green-900 bg-opacity-40 text-green-400' : 'bg-green-100 text-green-800';
      case 'offline':
        return isDark ? 'bg-red-900 bg-opacity-40 text-red-400' : 'bg-red-100 text-red-800';
      default:
        return isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800';
    }
  };

  const getBatteryColor = (level) => {
    if (level < 20) return 'text-red-500';
    if (level < 50) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>Sensors</h1>
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleRefresh}
            className="p-2 rounded-lg transition-colors bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
            title="Refresh sensors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button 
            onClick={simulateSensorData}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            Generate Sensor Data
          </button>
        </div>
      </div>

      {error && (
        <div className={`p-4 ${isDark ? 'bg-red-900 bg-opacity-20 border-red-500 text-red-400' : 'bg-red-50 border-red-500 text-red-700'} border-l-4 rounded`}>
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sensor List */}
          <div className="lg:col-span-1">
            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-4`}>
              <h2 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-800'} mb-4`}>Devices</h2>
              
              <div className="space-y-3">
                {sensors.map((sensor) => (
                  <button
                    key={sensor.id}
                    onClick={() => setSelectedSensor(sensor.id)}
                    className={`w-full text-left p-3 rounded-lg border ${
                      selectedSensor === sensor.id 
                        ? isDark 
                          ? 'border-green-500 bg-green-900 bg-opacity-20' 
                          : 'border-green-500 bg-green-50'
                        : isDark
                          ? 'border-gray-700 hover:bg-gray-700'
                          : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className={`font-medium ${isDark ? 'text-white' : ''}`}>{sensor.name}</div>
                      <span className={`text-xs px-2 py-1 rounded-full ${getSensorStatusClass(sensor.status)}`}>
                        {sensor.status}
                      </span>
                    </div>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                      {sensor.zone}
                    </div>
                    <div className="flex items-center mt-2">
                      <svg className={`h-4 w-4 ${getBatteryColor(sensor.battery)} mr-1`} viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm2-2h12v10H4V3z" />
                        <path d="M17 5a1 1 0 00-1 1v8a1 1 0 001 1h1a1 1 0 001-1V6a1 1 0 00-1-1h-1z" />
                      </svg>
                      <span className={`text-xs ${getBatteryColor(sensor.battery)}`}>
                        {sensor.battery}%
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sensor Data */}
          <div className="lg:col-span-3">
            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6`}>
              <div className="flex justify-between items-center mb-6">
                <h2 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  {selectedSensor ? sensors.find(s => s.id === selectedSensor)?.name : 'Select a sensor'}
                </h2>
                
                <div className="inline-flex rounded-md shadow-sm" role="group">
                  <button
                    type="button"
                    onClick={() => setTimeframe('day')}
                    className={`px-4 py-2 text-sm font-medium rounded-l-md ${
                      timeframe === 'day' 
                        ? 'bg-green-600 text-white' 
                        : isDark 
                          ? 'bg-gray-700 text-white border border-gray-600 hover:bg-gray-600'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Day
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeframe('week')}
                    className={`px-4 py-2 text-sm font-medium ${
                      timeframe === 'week' 
                        ? 'bg-green-600 text-white' 
                        : isDark 
                          ? 'bg-gray-700 text-white border-t border-b border-gray-600 hover:bg-gray-600'
                          : 'bg-white text-gray-700 border-t border-b border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Week
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeframe('month')}
                    className={`px-4 py-2 text-sm font-medium rounded-r-md ${
                      timeframe === 'month' 
                        ? 'bg-green-600 text-white' 
                        : isDark 
                          ? 'bg-gray-700 text-white border border-gray-600 hover:bg-gray-600'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Month
                  </button>
                </div>
              </div>

              {selectedSensor && sensorData.length > 0 ? (
                <>
                  {/* Temperature Chart */}
                  <div className="mb-8">
                    <h3 className={`text-md font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-3`}>Temperature (°C)</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={sensorData}>
                          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#555' : '#ccc'} />
                          <XAxis dataKey="time" stroke={isDark ? '#aaa' : '#666'} />
                          <YAxis stroke={isDark ? '#aaa' : '#666'} />
                          <Tooltip contentStyle={isDark ? { backgroundColor: '#333', borderColor: '#555', color: '#fff' } : {}} />
                          <Line
                            type="monotone"
                            dataKey="temperature"
                            stroke="#f97316"
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Humidity & Soil Moisture Chart */}
                  <div>
                    <h3 className={`text-md font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-3`}>Humidity & Soil Moisture (%)</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={sensorData}>
                          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#555' : '#ccc'} />
                          <XAxis dataKey="time" stroke={isDark ? '#aaa' : '#666'} />
                          <YAxis stroke={isDark ? '#aaa' : '#666'} />
                          <Tooltip contentStyle={isDark ? { backgroundColor: '#333', borderColor: '#555', color: '#fff' } : {}} />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="humidity"
                            stroke="#a855f7"
                            strokeWidth={2}
                            dot={false}
                            name="Humidity"
                          />
                          <Line
                            type="monotone"
                            dataKey="soil_moisture"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            dot={false}
                            name="Soil Moisture"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </>
              ) : (
                <div className={`flex flex-col items-center justify-center h-64 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                  <p>Select a sensor to view data</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SensorsPage;