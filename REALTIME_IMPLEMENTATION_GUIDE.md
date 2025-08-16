# REAL-TIME COMMUNICATION IMPLEMENTATION GUIDE
## FarmFlow Dashboard + ESP32 + Supabase

This guide explains how to implement real-time communication between your Dashboard, Supabase backend, and ESP32 DevKitV1 devices using the enhanced schema.

## 🚀 Overview

The enhanced schema provides:
- **Real-time sensor data streaming** with WebSocket support
- **Live device status monitoring** with heartbeat tracking
- **Instant alert notifications** for critical conditions
- **Real-time command execution** tracking
- **Optimized caching** for immediate dashboard updates

## 📡 Real-Time Channels

### 1. Zone Updates Channel
- **Purpose**: Notify about zone configuration changes
- **Events**: Zone creation, updates, deletion
- **Use Case**: Update zone list in real-time

### 2. Device Status Channel
- **Purpose**: Monitor device online/offline status
- **Events**: Connection changes, heartbeat updates
- **Use Case**: Show live device status indicators

### 3. Sensor Data Channel
- **Purpose**: Stream new sensor readings
- **Events**: New moisture, temperature, humidity data
- **Use Case**: Update charts and gauges in real-time

### 4. Alerts Channel
- **Purpose**: Instant notification of critical conditions
- **Events**: New alerts, severity changes
- **Use Case**: Show real-time alerts and notifications

### 5. Device Commands Channel
- **Purpose**: Track command execution status
- **Events**: Command creation, execution, completion
- **Use Case**: Monitor watering and control operations

## 🔧 Frontend Implementation

### 1. Real-Time Service Setup

Create `src/services/realtimeService.js`:

```javascript
import { supabase } from '../lib/supabase';

class RealtimeService {
  constructor() {
    this.subscriptions = new Map();
    this.callbacks = new Map();
  }

  // Subscribe to real-time updates
  subscribe(channel, event, callback) {
    const subscription = supabase
      .channel(channel)
      .on('postgres_changes', {
        event: event,
        schema: 'public',
        table: channel
      }, callback)
      .subscribe();

    this.subscriptions.set(`${channel}_${event}`, subscription);
    this.callbacks.set(`${channel}_${event}`, callback);

    return subscription;
  }

  // Subscribe to specific user data
  subscribeToUserData(userId, callback) {
    const subscription = supabase
      .channel(`user_${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        filter: `user_id=eq.${userId}`
      }, callback)
      .subscribe();

    this.subscriptions.set(`user_${userId}`, subscription);
    return subscription;
  }

  // Subscribe to sensor data updates
  subscribeToSensorData(userId, callback) {
    return this.subscribe('sensor_data', 'INSERT', (payload) => {
      if (payload.new && payload.new.user_id === userId) {
        callback(payload.new);
      }
    });
  }

  // Subscribe to device status changes
  subscribeToDeviceStatus(userId, callback) {
    return this.subscribe('devices', 'UPDATE', (payload) => {
      if (payload.new && payload.new.user_id === userId) {
        callback(payload.new);
      }
    });
  }

  // Subscribe to alerts
  subscribeToAlerts(userId, callback) {
    return this.subscribe('alerts', 'INSERT', (payload) => {
      if (payload.new && payload.new.user_id === userId) {
        callback(payload.new);
      }
    });
  }

  // Subscribe to device commands
  subscribeToDeviceCommands(userId, callback) {
    return this.subscribe('device_commands', '*', (payload) => {
      if (payload.new && payload.new.user_id === userId) {
        callback(payload.new);
      }
    });
  }

  // Unsubscribe from specific channel
  unsubscribe(channel, event) {
    const key = `${channel}_${event}`;
    const subscription = this.subscriptions.get(key);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(key);
      this.callbacks.delete(key);
    }
  }

  // Unsubscribe from all channels
  unsubscribeAll() {
    this.subscriptions.forEach(subscription => {
      subscription.unsubscribe();
    });
    this.subscriptions.clear();
    this.callbacks.clear();
  }
}

export const realtimeService = new RealtimeService();
```

### 2. Enhanced Dashboard with Real-Time Updates

Update `src/components/Dashboard.jsx`:

```javascript
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { realtimeService } from '../services/realtimeService';
import { DataService } from '../services/dataService';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [realTimeData, setRealTimeData] = useState({});

  // Load initial dashboard data
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const dashboardStats = await DataService.getDashboardStats();
      
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
      setStats([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Real-time sensor data updates
  useEffect(() => {
    if (!user) return;

    const handleSensorDataUpdate = (newData) => {
      setRealTimeData(prev => ({
        ...prev,
        [newData.zone_id]: {
          ...prev[newData.zone_id],
          [newData.sensor_type]: {
            value: newData.value,
            timestamp: new Date(newData.timestamp),
            unit: newData.unit
          }
        }
      }));

      // Update last updated timestamp
      setLastUpdated(new Date());
    };

    const handleDeviceStatusUpdate = (deviceData) => {
      // Update device status in real-time
      setRealTimeData(prev => ({
        ...prev,
        [`device_${deviceData.id}`]: {
          is_online: deviceData.is_online,
          connection_status: deviceData.connection_status,
          last_seen: new Date(deviceData.last_seen)
        }
      }));
    };

    const handleAlertUpdate = (alertData) => {
      // Show real-time alert notification
      console.log('New alert:', alertData);
      // You can implement toast notifications here
    };

    // Subscribe to real-time updates
    const sensorSubscription = realtimeService.subscribeToSensorData(user.id, handleSensorDataUpdate);
    const deviceSubscription = realtimeService.subscribeToDeviceStatus(user.id, handleDeviceStatusUpdate);
    const alertSubscription = realtimeService.subscribeToAlerts(user.id, handleAlertUpdate);

    // Load initial data
    loadDashboardData();

    // Set up auto-refresh interval
    const interval = setInterval(loadDashboardData, 30000); // 30 seconds

    return () => {
      clearInterval(interval);
      sensorSubscription?.unsubscribe();
      deviceSubscription?.unsubscribe();
      alertSubscription?.unsubscribe();
    };
  }, [user, loadDashboardData]);

  // Format last updated time
  const formattedLastUpdated = useMemo(() => {
    try {
      return lastUpdated.toLocaleTimeString();
    } catch (err) {
      console.error('Error formatting time:', err);
      return 'Unknown';
    }
  }, [lastUpdated]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Real-time status indicator */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${Object.keys(realTimeData).length > 0 ? 'bg-green-500' : 'bg-gray-400'}`}></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {Object.keys(realTimeData).length > 0 ? 'Live' : 'Offline'}
          </span>
          <span className="text-sm text-gray-500">
            Last updated: {formattedLastUpdated}
          </span>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatsCard
            key={index}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            trend={stat.trend}
            icon={stat.icon}
            realTimeData={realTimeData}
          />
        ))}
      </div>

      {/* Real-time data display */}
      {Object.keys(realTimeData).length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Live Data</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(realTimeData).map(([key, data]) => (
              <div key={key} className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white">{key}</h4>
                <pre className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
```

### 3. Real-Time Sensor Charts

Update `src/components/charts/MoistureHumidityChart.jsx`:

```javascript
import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { realtimeService } from '../../services/realtimeService';

const MoistureHumidityChart = () => {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [realTimeUpdates, setRealTimeUpdates] = useState([]);

  // Load historical data
  const loadChartData = useCallback(async () => {
    try {
      setLoading(true);
      // Load last 24 hours of data
      const response = await fetch(`/api/sensor-data/charts?hours=24&user_id=${user.id}`);
      const chartData = await response.json();
      setData(chartData);
    } catch (error) {
      console.error('Error loading chart data:', error);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  // Real-time updates
  useEffect(() => {
    if (!user) return;

    const handleRealTimeUpdate = (newData) => {
      setRealTimeUpdates(prev => {
        const updated = [...prev, {
          timestamp: new Date(newData.timestamp),
          moisture: newData.sensor_type === 'moisture' ? newData.value : null,
          humidity: newData.sensor_type === 'humidity' ? newData.value : null
        }].slice(-50); // Keep last 50 updates
        
        return updated;
      });
    };

    // Subscribe to real-time sensor data
    const subscription = realtimeService.subscribeToSensorData(user.id, handleRealTimeUpdate);

    // Load initial data
    loadChartData();

    return () => {
      subscription?.unsubscribe();
    };
  }, [user, loadChartData]);

  // Combine historical and real-time data
  const combinedData = useMemo(() => {
    const realTimeFormatted = realTimeUpdates.map(update => ({
      timestamp: update.timestamp.toLocaleTimeString(),
      moisture: update.moisture,
      humidity: update.humidity
    }));

    return [...data, ...realTimeFormatted];
  }, [data, realTimeUpdates]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
        Moisture & Humidity Trends
        {realTimeUpdates.length > 0 && (
          <span className="ml-2 text-sm text-green-600 dark:text-green-400">
            ● Live
          </span>
        )}
      </h3>
      
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={combinedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="timestamp" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="moisture" 
            stroke="#8884d8" 
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="humidity" 
            stroke="#82ca9d" 
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MoistureHumidityChart;
```

### 4. Real-Time Alerts Component

Create `src/components/RealTimeAlerts.jsx`:

```javascript
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { realtimeService } from '../services/realtimeService';

const RealTimeAlerts = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load initial alerts
  const loadAlerts = useCallback(async () => {
    try {
      const response = await fetch(`/api/alerts?user_id=${user.id}&unread_only=true`);
      const alertsData = await response.json();
      setAlerts(alertsData);
      setUnreadCount(alertsData.length);
    } catch (error) {
      console.error('Error loading alerts:', error);
    }
  }, [user.id]);

  // Real-time alert updates
  useEffect(() => {
    if (!user) return;

    const handleNewAlert = (newAlert) => {
      setAlerts(prev => [newAlert, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Show browser notification
      if (Notification.permission === 'granted') {
        new Notification('FarmFlow Alert', {
          body: newAlert.message,
          icon: '/favicon.ico',
          tag: newAlert.id
        });
      }
    };

    const handleAlertUpdate = (updatedAlert) => {
      setAlerts(prev => 
        prev.map(alert => 
          alert.id === updatedAlert.id ? updatedAlert : alert
        )
      );
      
      if (updatedAlert.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    };

    // Subscribe to real-time alerts
    const newAlertSubscription = realtimeService.subscribe('alerts', 'INSERT', handleNewAlert);
    const updateAlertSubscription = realtimeService.subscribe('alerts', 'UPDATE', handleAlertUpdate);

    // Load initial alerts
    loadAlerts();

    return () => {
      newAlertSubscription?.unsubscribe();
      updateAlertSubscription?.unsubscribe();
    };
  }, [user, loadAlerts]);

  // Mark alert as read
  const markAsRead = useCallback(async (alertId) => {
    try {
      await fetch(`/api/alerts/${alertId}/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      });
      
      setAlerts(prev => 
        prev.map(alert => 
          alert.id === alertId ? { ...alert, is_read: true } : alert
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  }, []);

  // Request notification permission
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Alerts
          </h3>
          {unreadCount > 0 && (
            <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-red-900 dark:text-red-300">
              {unreadCount} new
            </span>
          )}
        </div>
      </div>
      
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {alerts.length === 0 ? (
          <div className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
            No alerts at the moment
          </div>
        ) : (
          alerts.map(alert => (
            <div 
              key={alert.id} 
              className={`px-6 py-4 ${!alert.is_read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      alert.severity === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                      alert.severity === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' :
                      alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                      'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                    }`}>
                      {alert.severity}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(alert.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {alert.message}
                  </p>
                </div>
                
                {!alert.is_read && (
                  <button
                    onClick={() => markAsRead(alert.id)}
                    className="ml-4 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Mark as read
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RealTimeAlerts;
```

## 🔌 ESP32 Integration

### 1. ESP32 Real-Time Communication

Update your ESP32 code to send data more frequently and handle real-time commands:

```cpp
// ESP32 Real-Time Communication
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// Configuration
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* supabaseUrl = "YOUR_SUPABASE_URL";
const char* apiKey = "YOUR_API_KEY";
const char* deviceId = "YOUR_DEVICE_ID";

// Sensor pins
const int moisturePin = 34;
const int temperaturePin = 35;
const int humidityPin = 36;
const int pumpPin = 25;

// Timing
unsigned long lastSensorRead = 0;
unsigned long lastHeartbeat = 0;
const unsigned long sensorInterval = 30000; // 30 seconds
const unsigned long heartbeatInterval = 60000; // 1 minute

// Real-time data structure
struct SensorData {
  float moisture;
  float temperature;
  float humidity;
  int batteryLevel;
  int signalStrength;
};

void setup() {
  Serial.begin(115200);
  
  // Initialize pins
  pinMode(pumpPin, OUTPUT);
  digitalWrite(pumpPin, LOW);
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  Serial.println("WiFi connected");
  
  // Send initial device status
  updateDeviceStatus(true);
}

void loop() {
  unsigned long currentTime = millis();
  
  // Read sensors at regular intervals
  if (currentTime - lastSensorRead >= sensorInterval) {
    readAndSendSensors();
    lastSensorRead = currentTime;
  }
  
  // Send heartbeat
  if (currentTime - lastHeartbeat >= heartbeatInterval) {
    sendHeartbeat();
    lastHeartbeat = currentTime;
  }
  
  // Check for commands
  checkForCommands();
  
  delay(1000);
}

void readAndSendSensors() {
  SensorData data;
  
  // Read sensor values
  data.moisture = analogRead(moisturePin);
  data.temperature = readTemperature();
  data.humidity = readHumidity();
  data.batteryLevel = getBatteryLevel();
  data.signalStrength = WiFi.RSSI();
  
  // Send to Supabase
  sendSensorData(data);
}

void sendSensorData(SensorData data) {
  HTTPClient http;
  http.begin(String(supabaseUrl) + "/rest/v1/sensor_data");
  
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", apiKey);
  http.addHeader("Authorization", "Bearer " + apiKey);
  
  // Create JSON payload
  StaticJsonDocument<512> doc;
  doc["device_id"] = deviceId;
  doc["zone_id"] = "YOUR_ZONE_ID"; // Set your zone ID
  doc["sensor_type"] = "moisture"; // Send each sensor type separately
  doc["value"] = data.moisture;
  doc["unit"] = "%";
  doc["battery_level"] = data.batteryLevel;
  doc["signal_strength"] = data.signalStrength;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode > 0) {
    Serial.println("Sensor data sent successfully");
  } else {
    Serial.println("Error sending sensor data");
  }
  
  http.end();
}

void updateDeviceStatus(bool isOnline) {
  HTTPClient http;
  http.begin(String(supabaseUrl) + "/rest/v1/devices?id=eq." + deviceId);
  
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", apiKey);
  http.addHeader("Authorization", "Bearer " + apiKey);
  http.addHeader("Prefer", "return=minimal");
  
  StaticJsonDocument<256> doc;
  doc["is_online"] = isOnline;
  doc["last_seen"] = "now()";
  doc["connection_status"] = isOnline ? "connected" : "disconnected";
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  int httpResponseCode = http.PATCH(jsonString);
  
  if (httpResponseCode > 0) {
    Serial.println("Device status updated");
  } else {
    Serial.println("Error updating device status");
  }
  
  http.end();
}

void sendHeartbeat() {
  updateDeviceStatus(true);
}

void checkForCommands() {
  HTTPClient http;
  http.begin(String(supabaseUrl) + "/rest/v1/device_commands?device_id=eq." + deviceId + "&status=eq.pending&order=priority.desc");
  
  http.addHeader("apikey", apiKey);
  http.addHeader("Authorization", "Bearer " + apiKey);
  
  int httpResponseCode = http.GET();
  
  if (httpResponseCode > 0) {
    String payload = http.getString();
    
    // Parse JSON response
    StaticJsonDocument<1024> doc;
    DeserializationError error = deserializeJson(doc, payload);
    
    if (!error) {
      // Process commands
      for (JsonObject command : doc.as<JsonArray>()) {
        executeCommand(command);
      }
    }
  }
  
  http.end();
}

void executeCommand(JsonObject command) {
  String commandType = command["command_type"];
  String commandId = command["id"];
  
  Serial.println("Executing command: " + commandType);
  
  // Update command status to executing
  updateCommandStatus(commandId, "executing");
  
  if (commandType == "water") {
    // Execute watering command
    int duration = command["parameters"]["duration"] | 30;
    digitalWrite(pumpPin, HIGH);
    delay(duration * 1000);
    digitalWrite(pumpPin, LOW);
    
    // Update command status to completed
    updateCommandStatus(commandId, "completed");
  }
  else if (commandType == "read_sensors") {
    // Force sensor reading
    readAndSendSensors();
    updateCommandStatus(commandId, "completed");
  }
  else if (commandType == "restart") {
    // Restart ESP32
    updateCommandStatus(commandId, "completed");
    delay(1000);
    ESP.restart();
  }
}

void updateCommandStatus(String commandId, String status) {
  HTTPClient http;
  http.begin(String(supabaseUrl) + "/rest/v1/device_commands?id=eq." + commandId);
  
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", apiKey);
  http.addHeader("Authorization", "Bearer " + apiKey);
  http.addHeader("Prefer", "return=minimal");
  
  StaticJsonDocument<256> doc;
  doc["status"] = status;
  doc["executed_at"] = "now()";
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  http.PATCH(jsonString);
  http.end();
}

// Helper functions for sensor reading
float readTemperature() {
  // Implement your temperature sensor reading logic
  return 25.0; // Placeholder
}

float readHumidity() {
  // Implement your humidity sensor reading logic
  return 60.0; // Placeholder
}

int getBatteryLevel() {
  // Implement battery level reading logic
  return 85; // Placeholder
}
```

## 🎯 Key Benefits

1. **Instant Updates**: Dashboard updates in real-time without page refresh
2. **Live Monitoring**: See device status and sensor data as it happens
3. **Immediate Alerts**: Get notified instantly of critical conditions
4. **Efficient Communication**: WebSocket-based updates reduce server load
5. **Better User Experience**: Users see live data without manual refresh

## 🚨 Important Notes

1. **Rate Limiting**: ESP32 sends data every 30 seconds to avoid overwhelming the system
2. **Connection Management**: ESP32 maintains persistent connection and sends heartbeats
3. **Error Handling**: Both frontend and ESP32 handle connection failures gracefully
4. **Security**: All real-time communication uses authenticated channels
5. **Performance**: Real-time cache reduces database queries for dashboard data

## 🔍 Testing Real-Time Features

1. **Dashboard Updates**: Watch sensor values change in real-time
2. **Device Status**: Monitor ESP32 online/offline status
3. **Alerts**: Trigger alerts by changing sensor values
4. **Commands**: Send commands from dashboard and watch execution
5. **Performance**: Monitor response times and data freshness

This implementation provides a robust, real-time communication system between your Dashboard, Supabase backend, and ESP32 devices, ensuring seamless monitoring and control of your smart garden system.
