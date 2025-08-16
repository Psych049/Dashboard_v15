import { supabase, createFreshClient } from '../lib/supabase';

// Device Service for managing ESP32 devices
export class DeviceService {
  
  // Get a fresh client instance
  static getFreshClient() {
    return createFreshClient();
  }

  // Fetch all devices for the current user
  static async fetchDevices() {
    try {
      const client = this.getFreshClient();
      const { data: { user }, error: userError } = await client.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await client
        .from('devices')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching devices:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in fetchDevices:', error);
      return [];
    }
  }

  // Create a new device
  static async createDevice(deviceData) {
    try {
      const client = this.getFreshClient();
      const { data: { user }, error: userError } = await client.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Check if device with same name already exists
      const existingDevice = await this.getDeviceByName(deviceData.name);
      if (existingDevice) {
        throw new Error('Device with this name already exists');
      }

      const { data, error } = await client
        .from('devices')
        .insert([{
          device_name: deviceData.name,
          device_type: deviceData.device_type || 'ESP32_DevKitV1',
          mac_address: deviceData.mac_address,
          firmware_version: deviceData.firmware_version,
          location: deviceData.location,
          description: deviceData.description,
          user_id: user.id
        }])
        .select();

      if (error) {
        console.error('Error creating device:', error);
        throw error;
      }
      
      const createdDevice = data?.[0] || null;
      
      // Automatically generate API key for the device
      if (createdDevice) {
        try {
          const apiKeyName = `${deviceData.name} API Key`;
          await this.generateApiKey(createdDevice.id, apiKeyName);
          console.log('API key generated for device:', createdDevice.id);
        } catch (apiKeyError) {
          console.error('Error generating API key:', apiKeyError);
          // Don't throw here, as the device was created successfully
        }
      }
      
      return createdDevice;
    } catch (error) {
      console.error('Error in createDevice:', error);
      throw error;
    }
  }

  // Update device status (heartbeat)
  static async updateDeviceStatus(deviceId, status) {
    try {
      const client = this.getFreshClient();
      const updateData = {
        connection_status: status === 'online' ? 'connected' : 'disconnected',
        is_online: status === 'online',
        last_seen: new Date().toISOString(),
        last_heartbeat: new Date().toISOString()
      };

      const { data, error } = await client
        .from('devices')
        .update(updateData)
        .eq('id', deviceId)
        .select();

      if (error) {
        console.error('Error updating device status:', error);
        throw error;
      }
      
      return data?.[0] || null;
    } catch (error) {
      console.error('Error in updateDeviceStatus:', error);
      throw error;
    }
  }

  // Delete a device
  static async deleteDevice(deviceId) {
    try {
      const client = this.getFreshClient();
      const { data: { user }, error: userError } = await client.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Get device info first (support schemas with either `device_name` or `name`)
      const device = await client
        .from('devices')
        .select('*')
        .eq('id', deviceId)
        .eq('user_id', user.id)
        .single();

      if (!device.data) {
        throw new Error('Device not found or access denied');
      }

      const deviceName = device.data.device_name || device.data.name || '';

      // Delete associated API keys first
      const { error: apiKeyError } = await client
        .from('api_keys')
        .delete()
        .eq('user_id', user.id)
        .ilike('name', `%${deviceName}%`);

      if (apiKeyError) {
        console.error('Error deleting associated API keys:', apiKeyError);
        // Continue with device deletion even if API key deletion fails
      }

      // Delete the device
      const { error } = await client
        .from('devices')
        .delete()
        .eq('id', deviceId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting device:', error);
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error('Error in deleteDevice:', error);
      throw error;
    }
  }

  // Get device by name
  static async getDeviceByName(deviceName) {
    try {
      const client = this.getFreshClient();
      const { data, error } = await client
        .from('devices')
        .select('*')
        .eq('device_name', deviceName)
        .single();

      if (error) {
        console.error('Error fetching device by name:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error in getDeviceByName:', error);
      return null;
    }
  }

  // Get latest sensor data for a device
  static async getLatestSensorData(deviceId) {
    try {
      const client = this.getFreshClient();
      const { data, error } = await client
        .from('sensor_data')
        .select(`
          *,
          zones!inner(
            id,
            name
          )
        `)
        .eq('device_id', deviceId)
        .order('reading_timestamp', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching latest sensor data:', error);
        throw error;
      }
      
      return data?.[0] || null;
    } catch (error) {
      console.error('Error in getLatestSensorData:', error);
      return null;
    }
  }

  // Send command to device
  static async sendCommand(deviceId, commandType, parameters = {}) {
    try {
      const client = this.getFreshClient();
      const { data: { user }, error: userError } = await client.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await client
        .from('device_commands')
        .insert([{
          device_id: deviceId,
          command_type: commandType,
          parameters,
          status: 'pending'
        }])
        .select();

      if (error) {
        console.error('Error sending command:', error);
        throw error;
      }
      
      return data?.[0] || null;
    } catch (error) {
      console.error('Error in sendCommand:', error);
      throw error;
    }
  }

  // Get pending commands for a device
  static async getPendingCommands(deviceId) {
    try {
      const client = this.getFreshClient();
      const { data, error } = await client
        .from('device_commands')
        .select('*')
        .eq('device_id', deviceId)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching pending commands:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getPendingCommands:', error);
      return [];
    }
  }

  // Update command status
  static async updateCommandStatus(commandId, status, executedAt = null) {
    try {
      const client = this.getFreshClient();
      const updateData = {
        status,
        executed_at: executedAt || new Date().toISOString()
      };

      const { data, error } = await client
        .from('device_commands')
        .update(updateData)
        .eq('id', commandId)
        .select();

      if (error) {
        console.error('Error updating command status:', error);
        throw error;
      }
      
      return data?.[0] || null;
    } catch (error) {
      console.error('Error in updateCommandStatus:', error);
      throw error;
    }
  }

  // Get device statistics
  static async getDeviceStats(deviceId) {
    try {
      // Get device info
      const device = await client
        .from('devices')
        .select('*')
        .eq('id', deviceId)
        .single();
      if (!device?.data) return null;
      if (!device) return null;

      // Get latest sensor data
      const latestData = await this.getLatestSensorData(deviceId);

      // Get pending commands count
      const pendingCommands = await this.getPendingCommands(deviceId);

      return {
        device: device.data,
        latestData,
        pendingCommandsCount: pendingCommands.length,
        isOnline: device.status === 'online',
        lastSeen: device.last_seen
      };
    } catch (error) {
      console.error('Error in getDeviceStats:', error);
      return null;
    }
  }

  // Simulate device data (for testing)
  static async simulateDeviceData(deviceId) {
    try {
      const device = await this.getDeviceByDeviceId(deviceId);
      if (!device) throw new Error('Device not found');

      // Simulate sensor readings
      const temperature = 20 + Math.random() * 15; // 20-35°C
      const humidity = 40 + Math.random() * 40; // 40-80%
      const soilMoisture = 20 + Math.random() * 60; // 20-80%

      // Update device status to online
      await this.updateDeviceStatus(device.id, 'online');

      return {
        temperature: temperature.toFixed(1),
        humidity: humidity.toFixed(1),
        soilMoisture: soilMoisture.toFixed(1),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error in simulateDeviceData:', error);
      throw error;
    }
  }

  // Get zones for dropdown
  static async fetchZones() {
    try {
      const client = this.getFreshClient();
      const { data, error } = await client
        .from('zones')
        .select('id, name, description, soil_type')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching zones:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in fetchZones:', error);
      return [];
    }
  }

  // Create a new zone
  static async createZone(zoneData) {
    try {
      const client = this.getFreshClient();
      const { data: { user }, error: userError } = await client.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await client
        .from('zones')
        .insert([{
          ...zoneData,
          user_id: user.id,
          pump_on: false
        }])
        .select();

      if (error) {
        console.error('Error creating zone:', error);
        throw error;
      }
      
      return data?.[0] || null;
    } catch (error) {
      console.error('Error in createZone:', error);
      throw error;
    }
  }

  // Fetch API keys for the current user
  static async fetchApiKeys() {
    try {
      const client = this.getFreshClient();
      const { data: { user }, error: userError } = await client.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await client
        .from('api_keys')
        .select(`
          id,
          name,
          key,
          created_at
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching API keys:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in fetchApiKeys:', error);
      return [];
    }
  }

  // Generate API key for a device (with fallback for schema issues)
  static async generateApiKey(deviceId, keyName) {
    try {
      const client = this.getFreshClient();
      const { data: { user }, error: userError } = await client.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Generate a secure API key (used for schema that accepts plaintext)
      const keyValue = 'sk_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

      // Try modern schema: create_api_key(key_name TEXT, key_value TEXT) RETURNS JSONB
      try {
        const { data } = await client.rpc('create_api_key', {
          key_name: keyName,
          key_value: keyValue
        });

        // If it returns an object with a key field, prefer that; otherwise fall back to the key we generated
        const returnedKey = (data && typeof data === 'object' && data.key) ? data.key : keyValue;
        return { key: returnedKey, name: keyName };
      } catch (rpcErrFirst) {
        console.warn('create_api_key(key_name, key_value) failed, trying legacy signature...', rpcErrFirst?.message || rpcErrFirst);

        // Try legacy schema: create_api_key(p_device_id UUID, p_name TEXT [, p_user_email TEXT]) RETURNS TEXT
        const { data: legacyData, error: legacyError } = await client.rpc('create_api_key', {
          p_device_id: deviceId,
          p_name: keyName
        });

        if (legacyError) {
          console.error('Error with RPC API key generation (both signatures failed):', legacyError);
          throw new Error('Failed to generate API key. Please check your database schema.');
        }

        // Legacy returns the plaintext key as TEXT
        return { key: legacyData, name: keyName };
      }
    } catch (error) {
      console.error('Error in generateApiKey:', error);
      throw error;
    }
  }

  // Generate API key for existing device
  static async generateApiKeyForDevice(deviceId) {
    try {
      const client = this.getFreshClient();
      const { data: { user }, error: userError } = await client.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Get device info by UUID (not device_id string)
      const { data: device, error: deviceError } = await client
        .from('devices')
        .select('id, device_name')
        .eq('id', deviceId)
        .eq('user_id', user.id)
        .single();

      if (deviceError || !device) {
        throw new Error('Device not found or access denied');
      }

      // Check if device already has an API key
      const { data: existingKeys, error: checkError } = await client
        .from('api_keys')
        .select('id')
        .eq('user_id', user.id)
        .ilike('name', `%${device.device_name}%`);

      if (checkError) {
        console.error('Error checking existing API keys:', checkError);
      }

      if (existingKeys && existingKeys.length > 0) {
        throw new Error('Device already has an API key');
      }

      // Generate a secure API key
      const keyValue = 'sk_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      const { data: rpcData, error } = await client
        .rpc('create_api_key', { key_name: `${device.device_name} API Key`, key_value: keyValue });

      if (error) {
        console.error('Error generating API key via RPC:', error);
        throw error;
      }
      return { key: rpcData, name: `${device.device_name} API Key` };
    } catch (error) {
      console.error('Error in generateApiKeyForDevice:', error);
      throw error;
    }
  }

  // Delete API key
  static async deleteApiKey(apiKeyId) {
    try {
      const client = this.getFreshClient();
      const { error } = await client
        .from('api_keys')
        .delete()
        .eq('id', apiKeyId);

      if (error) {
        console.error('Error deleting API key:', error);
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error('Error in deleteApiKey:', error);
      throw error;
    }
  }

  // Regenerate API key for device (delete old and create new)
  static async regenerateApiKeyForDevice(deviceId) {
    try {
      const client = this.getFreshClient();
      const { data: { user }, error: userError } = await client.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Get device info by UUID (not device_id string)
      const { data: device, error: deviceError } = await client
        .from('devices')
        .select('id, name, device_id')
        .eq('id', deviceId)
        .eq('user_id', user.id)
        .single();

      if (deviceError || !device) {
        throw new Error('Device not found or access denied');
      }

      // Delete existing API keys for this device
      const { error: deleteError } = await client
        .from('api_keys')
        .delete()
        .eq('user_id', user.id)
        .ilike('name', `%${device.name}%`);

      if (deleteError) {
        console.error('Error deleting existing API keys:', deleteError);
      }

      // Generate a new API key
      const apiKey = 'sk_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

      const { data, error } = await client
        .from('api_keys')
        .insert([{
          name: `${device.device_name} API Key`,
          key: apiKey,
          user_id: user.id
        }])
        .select();

      if (error) {
        console.error('Error generating new API key:', error);
        throw error;
      }
      
      return data?.[0] || null;
    } catch (error) {
      console.error('Error in regenerateApiKeyForDevice:', error);
      throw error;
    }
  }

  // Test API key validity
  static async testApiKey(apiKey) {
    try {
      const client = this.getFreshClient();
      const { data, error } = await client
        .from('devices')
        .select('id, name')
        .limit(1)
        .headers({
          'apikey': apiKey
        });

      if (error) {
        return { valid: false, error: error.message };
      }
      
      return { valid: true, data };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }
} 