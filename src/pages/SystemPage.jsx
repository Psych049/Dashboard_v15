import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { FiCpu, FiWifi, FiAlertCircle, FiRefreshCw, FiActivity, FiPower, FiPlus, FiTrash2, FiCheck, FiEye, FiEyeOff } from "react-icons/fi";
import { DeviceService } from '../services/deviceService';
import { useTheme } from '../contexts/ThemeContext';
import { supabase, forceSchemaRefresh } from '../lib/supabase';
import ApiKeyDebugger from '../components/ApiKeyDebugger';

export default function SystemPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const isDevelopment = import.meta.env.MODE === 'development';
  
  // State variables
  const [devices, setDevices] = useState([]);
  const [zones, setZones] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  const [newlyCreatedApiKey, setNewlyCreatedApiKey] = useState(null); // Store newly created API key
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState(null);
  const [hiddenApiKeys, setHiddenApiKeys] = useState(new Set());
  const [newDevice, setNewDevice] = useState({
    name: '',
    firmware_version: 'v1.0.0',
    mac_address: '',
    zone_id: ''
  });

  // Load data on component mount
  useEffect(() => {
    console.log('SystemPage mounted - loading data...');
    loadAllData();
  }, []);

  const showSuccessMessage = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 5000);
  };

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Loading all data...');
      await Promise.all([
        loadDevices(),
        loadZones(),
        loadApiKeys()
      ]);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadDevices = async () => {
    try {
      console.log('Loading devices...');
      const devices = await DeviceService.fetchDevices();
      console.log('Devices loaded:', devices);
      setDevices(devices);
    } catch (err) {
      console.error('Error loading devices:', err);
      throw err;
    }
  };

  const loadZones = async () => {
    try {
      console.log('Loading zones...');
      const zones = await DeviceService.fetchZones();
      console.log('Zones loaded:', zones);
      setZones(zones);
    } catch (err) {
      console.error('Error loading zones:', err);
      throw err;
    }
  };

  const loadApiKeys = async () => {
    try {
      console.log('Loading API keys...');
      const apiKeys = await DeviceService.fetchApiKeys();
      console.log('API keys loaded:', apiKeys);
      
      // Transform the API keys to include display information
      const transformedApiKeys = apiKeys.map(apiKey => ({
        ...apiKey,
        // Show a readable display key since we can't decrypt the hash
        display_key: `API_KEY_${apiKey.id.substring(0, 8).toUpperCase()}`,
        // For ESP32 code, we need to show that they should use the actual key from creation
        actual_key_note: 'Use the key provided when creating this API key'
      }));
      
      setApiKeys(transformedApiKeys);
    } catch (err) {
      console.error('Error loading API keys:', err);
      throw err;
    }
  };

  const handleAddDevice = async () => {
    try {
      if (!newDevice.name || !newDevice.zone_id) {
        setError('Please fill in all required fields including zone selection');
        return;
      }
      
      setLoading(true);
      setError(null);
      
      console.log('Adding device:', newDevice);
      
      // Create the device
      const createdDevice = await DeviceService.createDevice(newDevice);
      
      if (!createdDevice) {
        throw new Error('Failed to create device');
      }
      
      // Generate API key for the device
      const apiKeyName = `${newDevice.name} API Key`;
      const apiKeyResult = await DeviceService.generateApiKey(createdDevice.id, apiKeyName);
      
      // Handle the API key result
      if (apiKeyResult.key) {
        // New API key was created
        setNewlyCreatedApiKey({
          name: apiKeyName,
          key: apiKeyResult.key,
          deviceName: newDevice.name,
          createdAt: new Date().toISOString()
        });
        showSuccessMessage('Device added successfully! Check the API Keys section below for your device configuration.');
      } else if (apiKeyResult.message) {
        // Device already has an API key
        showSuccessMessage(`Device added successfully! ${apiKeyResult.message}`);
      }
      
      setShowAddDevice(false);
      setNewDevice({ name: '', firmware_version: 'v1.0.0', mac_address: '', zone_id: '' });
      await loadAllData();
      
    } catch (err) {
      console.error('Error adding device:', err);
      setError('Failed to add device: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateZone = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Creating default zone...');
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setError('Please log in first');
        return null;
      }

      const { data, error } = await supabase
        .from('zones')
        .insert([{
          name: 'Garden Zone 1',
          description: 'Default garden zone for ESP32 device',
          soil_type: 'Loamy',
          moisture_threshold: 40,
          user_id: user.id,
          pump_on: false
        }])
        .select();

      if (error) {
        console.error('Error creating zone:', error);
        setError('Failed to create zone: ' + error.message);
        return null;
      }

      console.log('Zone created:', data);
      await loadZones();
      showSuccessMessage('Zone created successfully! You can now select it from the dropdown.');
      return data?.[0] || null;
    } catch (err) {
      console.error('Error in zone creation:', err);
      setError('Failed to create zone: ' + (err.message || 'Unknown error'));
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteApiKey = async (apiKeyId) => {
    try {
      if (confirm('Are you sure you want to delete this API key?')) {
        setLoading(true);
        setError(null);
        
        await DeviceService.deleteApiKey(apiKeyId);
        await loadApiKeys();
        showSuccessMessage('API key deleted successfully!');
      }
    } catch (err) {
      console.error('Error deleting API key:', err);
      setError('Failed to delete API key: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTestDevice = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Ensure there is at least one zone and get its id deterministically
      let selectedZoneId = zones[0]?.id || null;
      if (!selectedZoneId) {
        const createdZone = await handleCreateZone();
        selectedZoneId = createdZone?.id || null;
      }
      if (!selectedZoneId) {
        throw new Error('No zone available to assign to test device');
      }
      
      // Create a test device
      const testDevice = {
        name: 'Test ESP32 Device',
        firmware_version: 'v1.0.0',
        mac_address: '00:11:22:33:44:' + Math.floor(Math.random()*99).toString().padStart(2, '0'),
        zone_id: selectedZoneId
      };
      
      console.log('Creating test device:', testDevice);
      const createdDevice = await DeviceService.createDevice(testDevice);
      
      if (createdDevice) {
        // Generate API key for the test device
        const apiKeyName = `${testDevice.name} API Key`;
        await DeviceService.generateApiKey(createdDevice.id, apiKeyName);
      }
      
      await loadAllData();
      showSuccessMessage('Test device created successfully! Check the API Keys section below.');
    } catch (err) {
      console.error('Error creating test device:', err);
      setError('Failed to create test device: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateApiKeyForDevice = async (deviceId) => {
    try {
      setLoading(true);
      setError(null);
      
      await DeviceService.generateApiKeyForDevice(deviceId);
      await loadApiKeys();
      showSuccessMessage('API key generated successfully! Check the API Keys section below.');
    } catch (err) {
      console.error('Error generating API key for device:', err);
      
      // Check if it's a schema issue
      if (err.message.includes('key') && err.message.includes('column')) {
        setError(`Database schema issue detected. Please run the following SQL in your Supabase dashboard:
        
1. Go to your Supabase project SQL editor
2. Run the schema fix script from: raw_data/fix_api_keys_schema.sql
3. Or run this command:
   CREATE TABLE IF NOT EXISTS api_keys (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     name TEXT NOT NULL,
     key TEXT UNIQUE NOT NULL,
     created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
     user_id UUID REFERENCES auth.users NOT NULL
   );`);
      } else {
        setError('Failed to generate API key: ' + (err.message || 'Unknown error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateApiKey = async (apiKeyId, deviceName) => {
    try {
      if (confirm('Are you sure you want to regenerate this API key? The old key will be invalidated.')) {
        setLoading(true);
        setError(null);
        
        // Find the device by name
       const device = devices.find(d => (d.device_name || d.name) === deviceName.replace(' API Key', ''));
        if (!device) {
          setError('Device not found');
          return;
        }
        
        await DeviceService.regenerateApiKeyForDevice(device.id);
        await loadApiKeys();
        showSuccessMessage('API key regenerated successfully!');
      }
    } catch (err) {
      console.error('Error regenerating API key:', err);
      setError('Failed to regenerate API key: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleTestApiKey = async (apiKey) => {
    try {
      setLoading(true);
      setError(null);
      
      // Since we're testing a display key, show appropriate message
      if (apiKey.startsWith('API_KEY_')) {
        showSuccessMessage('This is a display key. To test the actual API key, use it in your ESP32 code and check the dashboard for incoming data.');
        return;
      }
      
      const result = await DeviceService.testApiKey(apiKey);
      
      if (result.valid) {
        showSuccessMessage('API key is valid and working!');
      } else {
        setError('API key test failed: ' + result.error);
      }
    } catch (err) {
      console.error('Error testing API key:', err);
      setError('Failed to test API key: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      showSuccessMessage('Copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      setError('Failed to copy to clipboard');
    }
  };

  const toggleApiKeyVisibility = (apiKeyId) => {
    setHiddenApiKeys(prev => {
      const newSet = new Set(prev);
      if (newSet.has(apiKeyId)) {
        newSet.delete(apiKeyId);
      } else {
        newSet.add(apiKeyId);
      }
      return newSet;
    });
  };

  const hasApiKeyForDevice = (deviceName) => {
    return apiKeys.some(apiKey => apiKey.name.includes(deviceName));
  };

  const handleDeleteDevice = async (deviceId, deviceName) => {
    try {
      setLoading(true);
      setError(null);
      
      // Delete the device
      await DeviceService.deleteDevice(deviceId);
      
      // Reload data
      await loadAllData();
      
      showSuccessMessage(`Device "${deviceName}" deleted successfully!`);
    } catch (err) {
      console.error('Error deleting device:', err);
      setError('Failed to delete device: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteDevice = (deviceId, deviceName) => {
    setDeviceToDelete({ id: deviceId, name: deviceName });
    setShowDeleteConfirm(true);
  };

  const executeDeleteDevice = async () => {
    if (!deviceToDelete) return;
    
    await handleDeleteDevice(deviceToDelete.id, deviceToDelete.name);
    setShowDeleteConfirm(false);
    setDeviceToDelete(null);
  };

  const handleRefreshDevice = async (deviceId) => {
    try {
      setLoading(true);
      setError(null);
      
      // Get current device info
      const device = devices.find(d => d.id === deviceId);
      if (!device) {
        setError('Device not found');
        return;
      }
      
      // Update device status to trigger a refresh
      await DeviceService.updateDeviceStatus(deviceId, device.status === 'online' ? 'offline' : 'online');
      
      // Reload devices
      await loadDevices();
      
      showSuccessMessage(`Device "${device.device_name || device.name}" status refreshed!`);
    } catch (err) {
      console.error('Error refreshing device:', err);
      setError('Failed to refresh device: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshSchema = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Forcing schema refresh...');
      const result = await forceSchemaRefresh();
      
      if (result.success) {
        await loadAllData();
        showSuccessMessage('Schema cache refreshed successfully! Try creating a device now.');
      } else {
        setError('Schema refresh failed: ' + (result.error?.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error refreshing schema:', err);
      setError('Failed to refresh schema: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleCleanupDuplicateApiKeys = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Cleaning up duplicate API keys...');
      
      // Clean up duplicates for all devices
      const cleanupPromises = devices.map(device => 
        DeviceService.cleanupDuplicateApiKeys(device.id)
      );
      
      const results = await Promise.all(cleanupPromises);
      const totalDeleted = results.reduce((sum, result) => sum + (result.deletedCount || 0), 0);
      
      if (totalDeleted > 0) {
        showSuccessMessage(`Cleaned up ${totalDeleted} duplicate API keys successfully!`);
        await loadAllData(); // Reload to show updated list
      } else {
        showSuccessMessage('No duplicate API keys found. System is clean!');
      }
    } catch (err) {
      console.error('Error cleaning up duplicate API keys:', err);
      setError('Failed to cleanup duplicate API keys: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>System | Smart Garden Watering System</title>
      </Helmet>
      
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">System</h1>
        
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center">
              <FiAlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
            <button 
              onClick={() => setError(null)} 
              className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Success Display */}
        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center">
              <FiCheck className="h-5 w-5 text-green-400 mr-2" />
              <p className="text-green-800 dark:text-green-200">{success}</p>
            </div>
            <button 
              onClick={() => setSuccess(null)} 
              className="mt-2 text-sm text-green-600 dark:text-green-400 hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Newly Created API Key Display */}
        {newlyCreatedApiKey && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <FiActivity className="h-6 w-6 text-blue-500 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                    🎉 New API Key Created Successfully!
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Device: {newlyCreatedApiKey.deviceName} | Created: {new Date(newlyCreatedApiKey.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setNewlyCreatedApiKey(null)}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
              >
                <FiCheck className="h-5 w-5" />
              </button>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
              <label className="block text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                🔑 Your New API Key (Copy this now - you won't see it again!)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newlyCreatedApiKey.key}
                  readOnly
                  className="flex-1 px-3 py-2 border border-blue-300 dark:border-blue-600 rounded-md bg-blue-50 dark:bg-gray-700 text-blue-900 dark:text-white text-sm font-mono"
                />
                <button
                  onClick={() => copyToClipboard(newlyCreatedApiKey.key)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm"
                >
                  Copy Key
                </button>
              </div>
              
              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>⚠️ Important:</strong> This is the only time you'll see the actual API key. 
                  Copy it now and store it securely. You'll need this exact key for your ESP32 code.
                </p>
              </div>
              
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-200">
                  <strong>📱 ESP32 Usage:</strong> Use this key in your ESP32 code as the <code>apiKey</code> parameter 
                  when sending sensor data to the dashboard.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Loading Indicator */}
        {loading && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center">
              <FiRefreshCw className="h-5 w-5 text-blue-400 mr-2 animate-spin" />
              <p className="text-blue-800 dark:text-blue-200">Loading...</p>
            </div>
          </div>
        )}
        
        {/* Debug Info - Only show in development */}
        {isDevelopment && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Debug Information</h3>
            <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
              <p>Zones loaded: {zones.length}</p>
              <p>Devices loaded: {devices.length}</p>
              <p>API Keys loaded: {apiKeys.length}</p>
              <p>Modal open: {showAddDevice ? 'Yes' : 'No'}</p>
              <p>Zone names: {zones.map(z => z.name).join(', ') || 'None'}</p>
              <p>API Key names: {apiKeys.map(k => k.name).join(', ') || 'None'}</p>
            </div>
            <div className="mt-2 space-x-2">
              <button 
                onClick={loadZones} 
                className="px-2 py-1 bg-blue-500 text-white rounded text-xs"
              >
                Reload Zones
              </button>
              <button 
                onClick={loadApiKeys} 
                className="px-2 py-1 bg-green-500 text-white rounded text-xs"
              >
                Reload API Keys
              </button>
              <button 
                onClick={handleRefreshSchema} 
                className="px-2 py-1 bg-purple-500 text-white rounded text-xs"
              >
                Refresh Schema
              </button>
              <button 
                onClick={handleCleanupDuplicateApiKeys} 
                className="px-2 py-1 bg-red-500 text-white rounded text-xs"
              >
                Cleanup Duplicates
              </button>
              <button 
                onClick={() => setShowAddDevice(true)} 
                className="px-2 py-1 bg-purple-500 text-white rounded text-xs"
              >
                Open Modal
              </button>
              <button 
                onClick={handleCreateZone} 
                className="px-2 py-1 bg-orange-500 text-white rounded text-xs"
              >
                Create Test Zone
              </button>
              <button 
                onClick={handleCreateTestDevice} 
                className="px-2 py-1 bg-red-500 text-white rounded text-xs"
              >
                Create Test Device
              </button>
            </div>
          </div>
        )}

        {/* API Key Debugger - Only show in development */}
        {isDevelopment && <ApiKeyDebugger />}

        {/* Add Device Button */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">Device Management</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Add and manage your ESP32 devices</p>
            </div>
            <button
              onClick={() => setShowAddDevice(true)}
              disabled={loading}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
            >
              <FiPlus className="mr-2 h-4 w-4" />
              Add Device
            </button>
          </div>
        </div>

        {/* Add Device Modal */}
        {showAddDevice && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Add New Device</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Device Name</label>
                  <input
                    type="text"
                    value={newDevice.name}
                    onChange={(e) => setNewDevice(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., Garden Monitor 1"
                  />
                </div>
                
                <div>
                   <label className="block text-sm font-medium mb-1">MAC Address (optional)</label>
                  <input
                    type="text"
                     value={newDevice.mac_address}
                     onChange={(e) => setNewDevice(prev => ({ ...prev, mac_address: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                     placeholder="e.g., 84:CC:A8:12:34:56"
                  />
              </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Firmware Version</label>
                  <input
                    type="text"
                    value={newDevice.firmware_version}
                    onChange={(e) => setNewDevice(prev => ({ ...prev, firmware_version: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., v1.0.0"
                  />
            </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Zone</label>
                  {zones.length > 0 ? (
                    <select
                      value={newDevice.zone_id}
                      onChange={(e) => setNewDevice(prev => ({ ...prev, zone_id: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Select a zone</option>
                      {zones.map((zone) => (
                        <option key={zone.id} value={zone.id}>
                          {zone.name} ({zone.soil_type})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-red-500">No zones available. Create a zone first:</p>
                      <button
                        type="button"
                        onClick={handleCreateZone}
                        className="w-full px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition text-sm"
                      >
                        Create Default Zone
                      </button>
              </div>
                  )}
              </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowAddDevice(false)}
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddDevice}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Device'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* API Keys Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-semibold mb-1">Device Configuration</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">API keys and configuration data for your ESP32 devices</p>
              {apiKeys.length > 0 && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  Showing {apiKeys.length} unique API key{apiKeys.length !== 1 ? 's' : ''} (duplicates automatically filtered)
                </p>
              )}
            </div>
            <button
              onClick={loadApiKeys}
              disabled={loading}
              className="flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition disabled:opacity-50 w-full sm:w-auto"
            >
              <FiRefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
          
          {apiKeys.length > 0 ? (
            <div className="space-y-4">
              {apiKeys.map((apiKey) => (
                <div key={apiKey.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 sm:p-6 transition-all duration-200 hover:shadow-md">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white text-base">
                        {apiKey.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Created: {new Date(apiKey.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleRegenerateApiKey(apiKey.id, apiKey.name)}
                        disabled={loading}
                        className="p-2 text-orange-500 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-md transition disabled:opacity-50"
                        title="Regenerate API key"
                        aria-label="Regenerate API key"
                      >
                        <FiRefreshCw className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteApiKey(apiKey.id)}
                        disabled={loading}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition disabled:opacity-50"
                        title="Delete API key"
                        aria-label="Delete API key"
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        API Key (for ESP32 code)
                      </label>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <div className="flex-1 relative">
                          <input
                            type={hiddenApiKeys.has(apiKey.id) ? "password" : "text"}
                            value={apiKey.display_key}
                            readOnly
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-mono pr-10 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            aria-label="API key display value"
                          />
                          <button
                            onClick={() => toggleApiKeyVisibility(apiKey.id)}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded transition"
                            title={hiddenApiKeys.has(apiKey.id) ? "Show API key" : "Hide API key"}
                            aria-label={hiddenApiKeys.has(apiKey.id) ? "Show API key" : "Hide API key"}
                          >
                            {hiddenApiKeys.has(apiKey.id) ? <FiEye className="h-4 w-4" /> : <FiEyeOff className="h-4 w-4" />}
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => copyToClipboard(apiKey.display_key)}
                            disabled={loading}
                            className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm disabled:opacity-50 flex items-center justify-center min-w-[60px]"
                            aria-label="Copy API key to clipboard"
                          >
                            Copy
                          </button>
                          <button
                            onClick={() => handleTestApiKey(apiKey.display_key)}
                            disabled={loading}
                            className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition text-sm disabled:opacity-50 flex items-center justify-center min-w-[60px]"
                            aria-label="Test API key"
                            title="Test API key functionality"
                          >
                            Test
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                        ⚠️ This is a display key. Use the actual API key provided when creating this key for ESP32 integration.
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Supabase Configuration
                        </label>
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-3 text-sm font-mono overflow-x-auto">
                          <div className="text-blue-600 dark:text-blue-400">const char* supabaseUrl = "https://gqzaxkczxcudxbbkudmm.supabase.co";</div>
                          <div className="text-purple-600 dark:text-purple-400">const char* supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxemF4a2N6eGN1ZHhiYmt1ZG1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MzcwNzEsImV4cCI6MjA2OTMxMzA3MX0.RR4jib8iRkZG1rqFpH3wuTE82BY5ViJKFR0FVvu5N4U";</div>
                          <div className="text-green-600 dark:text-green-400">const char* apiKey = "{apiKey.key}";</div>
                        </div>
                        <button
                          onClick={() => copyToClipboard(`const char* supabaseUrl = "https://gqzaxkczxcudxbbkudmm.supabase.co";\nconst char* supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxemF4a2N6eGN1ZHhiYmt1ZG1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MzcwNzEsImV4cCI6MjA2OTMxMzA3MX0.RR4jib8iRkZG1rqFpH3wuTE82BY5ViJKFR0FVvu5N4U";\nconst char* apiKey = "${apiKey.key}";`)}
                          className="mt-2 px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700 transition"
                          aria-label="Copy Supabase configuration"
                        >
                          Copy Config
                        </button>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          ESP32 Code Template
                        </label>
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-3 text-sm font-mono overflow-x-auto">
                          <div className="text-gray-500 dark:text-gray-400">// Include your actual API key (not the display key)</div>
                          <div className="text-green-600 dark:text-green-400">const char* apiKey = "your-actual-api-key-here";</div>
                          <div className="text-gray-500 dark:text-gray-400">// Use in HTTP headers</div>
                          <div className="text-blue-600 dark:text-blue-400">headers["apikey"] = apiKey;</div>
                          <div className="text-gray-500 dark:text-gray-400 mt-2">// Data format for sensor readings:</div>
                          <div className="text-purple-600 dark:text-purple-400">{"{"}</div>
                          <div className="text-purple-600 dark:text-purple-400">  "device_id": "your-device-uuid",</div>
                          <div className="text-purple-600 dark:text-purple-400">  "zone_id": "your-zone-uuid",</div>
                          <div className="text-purple-600 dark:text-purple-400">  "sensor_type": "moisture",</div>
                          <div className="text-purple-600 dark:text-purple-400">  "value": 45.2,</div>
                          <div className="text-purple-600 dark:text-purple-400">  "unit": "%",</div>
                          <div className="text-purple-600 dark:text-purple-400">  "apiKey": "your-actual-api-key"</div>
                          <div className="text-purple-600 dark:text-purple-400">{"}"}</div>
                        </div>
                        <button
                          onClick={() => copyToClipboard(`// Include your actual API key (not the display key)\nconst char* apiKey = "your-actual-api-key-here";\n// Use in HTTP headers\nheaders["apikey"] = apiKey;\n\n// Data format for sensor readings:\n{\n  "device_id": "your-device-uuid",\n  "zone_id": "your-zone-uuid",\n  "sensor_type": "moisture",\n  "value": 45.2,\n  "unit": "%",\n  "apiKey": "your-actual-api-key"\n}`)}
                          className="mt-2 px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700 transition"
                          aria-label="Copy ESP32 code template"
                        >
                          Copy Template
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FiCpu className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No API keys found</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Add a device to generate API keys for ESP32 configuration</p>
            </div>
          )}
        </div>

        {/* Connected Devices Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold mb-1">Connected Devices</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">ESP32 devices registered to your account</p>
            </div>
            <button
              onClick={loadDevices}
              disabled={loading}
              className="flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
            >
              <FiRefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh All
            </button>
          </div>
          
          {devices.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {devices.map((device) => (
                <div key={device.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-white">{device.device_name || device.name}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      device.status === 'online' 
                        ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {device.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <p>ID: {device.id}</p>
                    <p>Last seen: {device.last_seen ? new Date(device.last_seen).toLocaleString() : 'N/A'}</p>
                    {device.firmware_version && (
                      <p>Firmware: {device.firmware_version}</p>
                    )}
                    {device.ip_address && (
                      <p>IP: {device.ip_address}</p>
                    )}
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 space-y-2">
                    {hasApiKeyForDevice(device.device_name || device.name) ? (
                      <div className="flex items-center justify-center text-green-600 dark:text-green-400 text-sm">
                        <FiActivity className="mr-1 h-4 w-4" />
                        API Key Available
                      </div>
                    ) : (
                      <button
                        onClick={() => handleGenerateApiKeyForDevice(device.id)}
                        disabled={loading}
                        className="w-full px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm disabled:opacity-50"
                      >
                        Generate API Key
                      </button>
                    )}
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleRefreshDevice(device.id)}
                        disabled={loading}
                        className="flex-1 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition text-sm disabled:opacity-50 flex items-center justify-center"
                        title="Refresh device status"
                      >
                        <FiRefreshCw className="h-4 w-4 mr-1" />
                        Refresh
                      </button>
                      <button
                        onClick={() => confirmDeleteDevice(device.id, device.device_name || device.name)}
                        disabled={loading}
                        className="flex-1 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition text-sm disabled:opacity-50 flex items-center justify-center"
                        title="Delete device"
                      >
                        <FiTrash2 className="h-4 w-4 mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FiCpu className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">No devices found</p>
              <p className="text-xs text-gray-400">Add your first ESP32 device to get started</p>
            </div>
          )}
        </div>
      </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && deviceToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center mb-4">
                <FiAlertCircle className="h-6 w-6 text-red-500 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete Device</h3>
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Are you sure you want to delete the device <strong>"{deviceToDelete.name}"</strong>?
              </p>
              
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-700 dark:text-red-300">
                  <strong>Warning:</strong> This action cannot be undone and will also delete any associated API keys.
                </p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeviceToDelete(null);
                  }}
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={executeDeleteDevice}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition disabled:opacity-50"
                >
                  {loading ? 'Deleting...' : 'Delete Device'}
                </button>
              </div>
            </div>
          </div>
        )}
    </>
  );
} 