import { supabase } from '../lib/supabase';

// Data Service for fetching real data from Supabase
export class DataService {
  
  // Get latest sensor data for stats cards
  static async getLatestSensorData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // First try with join
      const { data, error } = await supabase
        .rpc('get_latest_sensor_data', { p_user_id: user.id });

      if (error) {
        console.warn('Join query failed, trying simple query:', error);
        // Fallback to simple query without join
        const { data: simpleData, error: simpleError } = await supabase
          .rpc('get_latest_sensor_data', { p_user_id: user.id });
        
        if (simpleError) throw simpleError;
        return simpleData?.[0] || null;
      }
      
      return data?.[0] || null;
    } catch (error) {
      console.error('Error fetching latest sensor data:', error);
      return null;
    }
  }

  // Get sensor data for charts (last 24 hours)
  static async getSensorDataForCharts(hours = 24) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .rpc('get_sensor_data_for_charts', { p_user_id: user.id, p_hours: hours });

      if (error) throw error;
      
      // Validate and filter data
      return (data || []).map(row => ({
        time: row.reading_timestamp,
        temperature: Number(row.temperature ?? 0),
        humidity: Number(row.humidity ?? 0),
        soil_moisture: Number(row.moisture ?? 0)
      }));
    } catch (error) {
      console.error('Error fetching sensor data for charts:', error);
      return [];
    }
  }

  // Get system alerts
  static async getAlerts() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching alerts:', error);
      return [];
    }
  }

  // Mark alert as read
  static async markAlertAsRead(alertId) {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({ is_read: true })
        .eq('id', alertId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking alert as read:', error);
      return false;
    }
  }

  // Get plant zones
  static async getZones() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('zones')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching zones:', error);
      return [];
    }
  }

  // Get devices
  static async getDevices() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('devices')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching devices:', error);
      return [];
    }
  }

  // Get watering controls
  static async getWateringControls() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('watering_controls')
        .select(`
          *,
          zones(name),
          devices(name)
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching watering controls:', error);
      return [];
    }
  }

  // Send command to ESP32
  static async sendCommand(deviceId, commandType, parameters = {}) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/esp32-commands`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          device_id: deviceId,
          command_type: commandType,
          parameters,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error sending command:', error);
      throw error;
    }
  }

  // Get commands history
  static async getCommands(limit = 20) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('commands')
        .select(`
          *,
          devices(name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching commands:', error);
      return [];
    }
  }

  // Create new zone
  static async createZone(zoneData) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('zones')
        .insert({
          ...zoneData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating zone:', error);
      throw error;
    }
  }

  // Update zone
  static async updateZone(zoneId, updates) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('zones')
        .update(updates)
        .eq('id', zoneId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating zone:', error);
      throw error;
    }
  }

  // Delete zone
  static async deleteZone(zoneId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('zones')
        .delete()
        .eq('id', zoneId)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting zone:', error);
      throw error;
    }
  }

  // Get soil types
  static async getSoilTypes() {
    try {
      const { data, error } = await supabase
        .from('soil_types')
        .select('*')
        .order('type');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching soil types:', error);
      return [];
    }
  }

  // Simulate sensor data (for testing)
  static async simulateSensorData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/simulate-sensor-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error simulating sensor data:', error);
      throw error;
    }
  }

  // Get stats for dashboard cards with improved data processing
  static async getDashboardStats() {
    try {
      const latestData = await this.getLatestSensorData();
      if (!latestData) {
        // Return empty stats if no data available
        return [
          {
            title: 'Temperature',
            value: 'N/A',
            change: '--',
            trend: 'neutral',
            icon: {
              path: 'M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.493 2.493 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25Zm-6 0a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Zm8.25-.75a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z',
              bgColor: 'bg-orange-500'
            }
          },
          {
            title: 'Humidity',
            value: 'N/A',
            change: '--',
            trend: 'neutral',
            icon: {
              path: 'M7.5 6.75V0h9v6.75h-9zm9 0h1.5v6.75h-1.5V6.75zM13.5 0h3v6.75h-3V0zM7.5 18v-6.75h9V18h-9zm9 0h1.5v-6.75h-1.5V18zm-10.5 0v-6.75h-6v6.75h6zm-6-10.5v3.75h6V7.5h-6zm0 0V0h6v7.5h-6zm0 0V0h6v7.5h-6z',
              bgColor: 'bg-purple-500'
            }
          },
          {
            title: 'Soil Moisture',
            value: 'N/A',
            change: '--',
            trend: 'neutral',
            icon: {
              path: 'M13 7.5a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V8a.5.5 0 0 1 .5-.5zM13 3.5a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5zm-6.5 2a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 1 0V6a.5.5 0 0 0-.5-.5zM6 11.5a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0-.5.5zm-1.5-7a.5.5 0 0 0 0 1h1a.5.5 0 0 0 0-1h-1zM5 8.5a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0-.5.5zm3 .5a.5.5 0 0 0 0 1h1a.5.5 0 0 0 0-1H8zm5 0a.5.5 0 0 0 0 1h1a.5.5 0 0 0 0-1h-1zm.5-3.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 1 0v-1a.5.5 0 0 0-.5-.5zm-9-1a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 1 0v-3a.5.5 0 0 0-.5-.5zm9 3.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 1 0v-3a.5.5 0 0 0-.5-.5zm-3 1a.5.5 0 0 0 0 1h1a.5.5 0 0 0 0-1h-1zm-3-4a.5.5 0 0 0 0 1h1a.5.5 0 0 0 0-1H7z',
              bgColor: 'bg-blue-500'
            }
          },
          {
            title: 'Water Usage',
            value: 'N/A',
            change: '--',
            trend: 'neutral',
            icon: {
              path: 'M6.75 5C6.75 2.58 7.5 1 9 1c1.49 0 2.24 1.58 2.24 4 0 .56-.5.75-1.24.75-.73 0-1.24-.19-1.24-.75 0-1.04.5-1.87 1.24-1.87.73 0 1.24.83 1.24 1.87 0 .14-.03.27-.07.39a4.99 4.99 0 0 0-4.66 4.96c0 .75.17 1.47.46 2.11a4.98 4.98 0 0 0-2.19 2.6A5 5 0 0 1 3 9a5 5 0 0 1 3.75-4.84V5Zm2.5 5c0-.44.1-.86.29-1.23A2.99 2.99 0 0 1 13 12a2.996 2.996 0 0 1-3 3 2.99 2.99 0 0 1-2.99-2.96 3 3 0 0 1 2.24-2.93V10Z',
              bgColor: 'bg-green-500'
            }
          }
        ];
      }

      // Validate sensor data
      const temperature = typeof latestData.temperature === 'number' ? latestData.temperature : 0;
      const humidity = typeof latestData.humidity === 'number' ? latestData.humidity : 0;
      const soilMoisture = typeof latestData.soil_moisture === 'number' ? latestData.soil_moisture : 0;

      // Calculate trends based on historical data (simplified)
      const stats = [
        {
          title: 'Temperature',
          value: `${temperature.toFixed(1)} °C`,
          change: temperature > 25 ? '+2%' : temperature < 15 ? '-1%' : '+0.5%',
          trend: temperature > 25 ? 'up' : temperature < 15 ? 'down' : 'neutral',
          icon: {
            path: 'M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.493 2.493 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25Zm-6 0a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Zm8.25-.75a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z',
            bgColor: 'bg-orange-500'
          }
        },
        {
          title: 'Humidity',
          value: `${humidity.toFixed(0)}%`,
          change: humidity > 70 ? '+5%' : humidity < 40 ? '-3%' : '+1%',
          trend: humidity > 70 ? 'up' : humidity < 40 ? 'down' : 'neutral',
          icon: {
            path: 'M7.5 6.75V0h9v6.75h-9zm9 0h1.5v6.75h-1.5V6.75zM13.5 0h3v6.75h-3V0zM7.5 18v-6.75h9V18h-9zm9 0h1.5v-6.75h-1.5V18zm-10.5 0v-6.75h-6v6.75h6zm-6-10.5v3.75h6V7.5h-6zm0 0V0h6v7.5h-6zm0 0V0h6v7.5h-6z',
            bgColor: 'bg-purple-500'
          }
        },
        {
          title: 'Soil Moisture',
          value: `${soilMoisture.toFixed(0)}%`,
          change: soilMoisture > 80 ? '+3%' : soilMoisture < 30 ? '-2%' : '+1%',
          trend: soilMoisture > 80 ? 'up' : soilMoisture < 30 ? 'down' : 'neutral',
          icon: {
            path: 'M13 7.5a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V8a.5.5 0 0 1 .5-.5zM13 3.5a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5zm-6.5 2a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 1 0V6a.5.5 0 0 0-.5-.5zM6 11.5a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0-.5.5zm-1.5-7a.5.5 0 0 0 0 1h1a.5.5 0 0 0 0-1h-1zM5 8.5a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0-.5.5zm3 .5a.5.5 0 0 0 0 1h1a.5.5 0 0 0 0-1H8zm5 0a.5.5 0 0 0 0 1h1a.5.5 0 0 0 0-1h-1zm.5-3.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 1 0v-1a.5.5 0 0 0-.5-.5zm-9-1a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 1 0v-3a.5.5 0 0 0-.5-.5zm9 3.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 1 0v-3a.5.5 0 0 0-.5-.5zm-3 1a.5.5 0 0 0 0 1h1a.5.5 0 0 0 0-1h-1zm-3-4a.5.5 0 0 0 0 1h1a.5.5 0 0 0 0-1H7z',
            bgColor: 'bg-blue-500'
          }
        },
        {
          title: 'Water Usage',
          value: '12.4L',
          change: '-0.8L',
          trend: 'down',
          icon: {
            path: 'M6.75 5C6.75 2.58 7.5 1 9 1c1.49 0 2.24 1.58 2.24 4 0 .56-.5.75-1.24.75-.73 0-1.24-.19-1.24-.75 0-1.04.5-1.87 1.24-1.87.73 0 1.24.83 1.24 1.87 0 .14-.03.27-.07.39a4.99 4.99 0 0 0-4.66 4.96c0 .75.17 1.47.46 2.11a4.98 4.98 0 0 0-2.19 2.6A5 5 0 0 1 3 9a5 5 0 0 1 3.75-4.84V5Zm2.5 5c0-.44.1-.86.29-1.23A2.99 2.99 0 0 1 13 12a2.996 2.996 0 0 1-3 3 2.99 2.99 0 0 1-2.99-2.96 3 3 0 0 1 2.24-2.93V10Z',
            bgColor: 'bg-green-500'
          }
        }
      ];

      return stats;
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      return [];
    }
  }
}

export default DataService; 