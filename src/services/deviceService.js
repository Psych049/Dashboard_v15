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

      // First, get the user profile ID since the schema references user_profiles
      const { data: userProfile, error: profileError } = await client
        .from('user_profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (profileError || !userProfile) {
        console.error('User profile not found:', profileError);
        throw new Error('User profile not found. Please contact support.');
      }

      const { data, error } = await client
        .from('api_keys')
        .select(`
          id,
          name,
          key_hash,
          device_id,
          created_at,
          is_active,
          permissions
        `)
        .eq('user_id', userProfile.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching API keys:', error);
        throw error;
      }
      
      // Group API keys by device to prevent duplicates
      const deviceApiKeys = new Map();
      
      data.forEach(apiKey => {
        if (apiKey.device_id) {
          // If device already has an API key, keep the most recent one
          if (!deviceApiKeys.has(apiKey.device_id) || 
              new Date(apiKey.created_at) > new Date(deviceApiKeys.get(apiKey.device_id).created_at)) {
            deviceApiKeys.set(apiKey.device_id, apiKey);
          }
        } else {
          // For API keys without device_id, keep them as is
          deviceApiKeys.set(apiKey.id, apiKey);
        }
      });
      
      // Convert back to array and add display information
      const uniqueApiKeys = Array.from(deviceApiKeys.values()).map(apiKey => ({
        ...apiKey,
        // Show a readable display key since we can't decrypt the hash
        display_key: `API_KEY_${apiKey.id.substring(0, 8).toUpperCase()}`,
        // For ESP32 code, we need to show that they should use the actual key from creation
        actual_key_note: 'Use the key provided when creating this API key'
      }));
      
      return uniqueApiKeys || [];
    } catch (error) {
      console.error('Error in fetchApiKeys:', error);
      return [];
    }
  }

  // Clean up duplicate API keys for a device
  static async cleanupDuplicateApiKeys(deviceId) {
    try {
      const client = this.getFreshClient();
      const { data: { user }, error: userError } = await client.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Get the user profile ID
      const { data: userProfile, error: profileError } = await client
        .from('user_profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (profileError || !userProfile) {
        throw new Error('User profile not found. Please contact support.');
      }

      // Get all API keys for the device
      const { data: apiKeys, error: fetchError } = await client
        .from('api_keys')
        .select('id, created_at')
        .eq('device_id', deviceId)
        .eq('user_id', userProfile.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      if (apiKeys.length <= 1) {
        return { message: 'No duplicate API keys found' };
      }

      // Keep the most recent API key, delete the rest
      const keysToDelete = apiKeys.slice(1);
      const deletePromises = keysToDelete.map(key => 
        client.from('api_keys').delete().eq('id', key.id)
      );

      await Promise.all(deletePromises);

      return { 
        message: `Cleaned up ${keysToDelete.length} duplicate API keys`,
        deletedCount: keysToDelete.length
      };
    } catch (error) {
      console.error('Error cleaning up duplicate API keys:', error);
      throw error;
    }
  }

  // Generate API key for a device (updated for actual schema)
  static async generateApiKey(deviceId, keyName) {
    try {
      const client = this.getFreshClient();
      const { data: { user }, error: userError } = await client.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Get the user profile ID
      const { data: userProfile, error: profileError } = await client
        .from('user_profiles')
        .select('id, email')
        .eq('id', user.id)
        .single();

      if (profileError || !userProfile) {
        throw new Error('User profile not found. Please contact support.');
      }

      // Check if device already has an API key to prevent duplicates
      const { data: existingKeys, error: checkError } = await client
        .from('api_keys')
        .select('id, name')
        .eq('device_id', deviceId)
        .eq('user_id', userProfile.id)
        .eq('is_active', true);

      if (checkError) {
        console.error('Error checking existing API keys:', checkError);
      }

      if (existingKeys && existingKeys.length > 0) {
        console.warn('Device already has API keys:', existingKeys);
        // Return existing key info instead of creating duplicate
        return { 
          key: null, 
          name: keyName,
          message: 'Device already has an API key. Use the existing one.',
          existingKeys: existingKeys
        };
      }

      // Use the correct function signature from the schema
      const { data: apiKey, error: rpcError } = await client.rpc('create_api_key', {
        p_device_id: deviceId,
        p_name: keyName,
        p_user_email: userProfile.email
      });

      if (rpcError) {
        console.error('Error creating API key:', rpcError);
        throw new Error('Failed to generate API key: ' + rpcError.message);
      }

      // The function returns the plaintext key
      return { key: apiKey, name: keyName };
    } catch (error) {
      console.error('Error in generateApiKey:', error);
      throw error;
    }
  }

  // Generate API key for existing device (consolidated method)
  static async generateApiKeyForDevice(deviceId) {
    try {
      const client = this.getFreshClient();
      const { data: { user }, error: userError } = await client.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Get device info by UUID
      const { data: device, error: deviceError } = await client
        .from('devices')
        .select('id, device_name')
        .eq('id', deviceId)
        .eq('user_id', user.id)
        .single();

      if (deviceError || !device) {
        throw new Error('Device not found or access denied');
      }

      // Use the same method as generateApiKey to prevent duplicates
      return await this.generateApiKey(deviceId, `${device.device_name} API Key`);
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

      // Get device info by UUID
      const { data: device, error: deviceError } = await client
        .from('devices')
        .select('id, device_name')
        .eq('id', deviceId)
        .eq('user_id', user.id)
        .single();

      if (deviceError || !device) {
        throw new Error('Device not found or access denied');
      }

      // Get the user profile ID
      const { data: userProfile, error: profileError } = await client
        .from('user_profiles')
        .select('id, email')
        .eq('id', user.id)
        .single();

      if (profileError || !userProfile) {
        throw new Error('User profile not found. Please contact support.');
      }

      // Delete existing API keys for this device
      const { error: deleteError } = await client
        .from('api_keys')
        .delete()
        .eq('device_id', deviceId)
        .eq('user_id', userProfile.id);

      if (deleteError) {
        console.error('Error deleting existing API keys:', deleteError);
      }

      // Generate a new API key using the RPC function
      const { data: newApiKey, error: createError } = await client.rpc('create_api_key', {
        p_device_id: deviceId,
        p_name: `${device.device_name} API Key (Regenerated)`,
        p_user_email: userProfile.email
      });

      if (createError) {
        throw new Error('Failed to create new API key: ' + createError.message);
      }
      
      return { key: newApiKey, name: `${device.device_name} API Key (Regenerated)` };
    } catch (error) {
      console.error('Error in regenerateApiKeyForDevice:', error);
      throw error;
    }
  }

  // Test API key validity
  static async testApiKey(apiKey) {
    try {
      // Since we can't decrypt the stored hash, we'll test the API key
      // by making a request to the edge function
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const edgeFunctionUrl = `${supabaseUrl}/functions/v1/esp32-data`;
      
      // Create a test payload
      const testPayload = {
        device_id: '00000000-0000-0000-0000-000000000000', // Dummy device ID
        zone_id: '00000000-0000-0000-0000-000000000000',   // Dummy zone ID
        sensor_type: 'test',
        value: 0,
        unit: 'test',
        apiKey: apiKey
      };

      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey
        },
        body: JSON.stringify(testPayload)
      });

      if (response.ok) {
        return { valid: true, message: 'API key is valid and working' };
      } else {
        const errorData = await response.json();
        return { valid: false, error: errorData.error || `HTTP ${response.status}` };
      }
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }
} 