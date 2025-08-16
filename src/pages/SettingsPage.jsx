import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';
import { FiUser, FiBell, FiSettings, FiShield, FiTrash2, FiSave, FiKey, FiCheck, FiX } from 'react-icons/fi';

const SettingsPage = () => {
  const { user, logout } = useAuth();
  const { theme, setThemeDirectly } = useTheme();
  const isDark = theme === 'dark';
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  
  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    alerts: true,
    reports: false,
    tips: true
  });

  // System settings
  const [systemSettings, setSystemSettings] = useState({
    autoWatering: true,
    darkMode: isDark
  });

  // Update darkMode setting when theme changes
  useEffect(() => {
    setSystemSettings(prev => ({
      ...prev,
      darkMode: isDark
    }));
  }, [isDark]);

  // Auto-dismiss success messages after 3 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
      // In a real app, we would fetch additional user profile data from Supabase
      // For now, we'll use mock data
      setName('Garden Enthusiast');
    }
  }, [user]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    
    try {
      // In a real app, we would update the user profile in Supabase
      // For now, just simulate an API call
      setTimeout(() => {
        setMessage('Profile updated successfully');
        setLoading(false);
      }, 1000);
    } catch (err) {
      setError('Failed to update profile. Please try again.');
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password',
      });
      
      if (error) throw error;
      
      setMessage('Password reset email sent. Please check your inbox.');
    } catch (err) {
      setError('Failed to send password reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationChange = (setting) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
    
    // Show feedback that setting was changed (without auto-clear to prevent layout shifts)
    setMessage(`${setting.charAt(0).toUpperCase() + setting.slice(1)} notifications ${!notificationSettings[setting] ? 'enabled' : 'disabled'}`);
  };

  const handleSystemSettingChange = (setting) => {
    const newValue = !systemSettings[setting];
    
    // Update system settings
    setSystemSettings(prev => ({
      ...prev,
      [setting]: newValue
    }));
    
    // If darkMode is being toggled, also update the theme context
    if (setting === 'darkMode') {
      setThemeDirectly(newValue ? 'dark' : 'light');
      setMessage(`Dark mode ${newValue ? 'enabled' : 'disabled'}`);
    } else if (setting === 'autoWatering') {
      setMessage(`Automatic watering ${newValue ? 'enabled' : 'disabled'}`);
    }
  };



  const handleLogout = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    
    try {
      await logout();
      setMessage('Logged out successfully');
    } catch (error) {
      setError('Failed to log out. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }
    
    setLoading(true);
    setError(null);
    setMessage(null);
    
    try {
      // In a real app, we would delete the user account from Supabase
      // For now, just simulate an API call
      setTimeout(() => {
        setMessage('Account deletion request submitted. You will receive a confirmation email.');
        setLoading(false);
      }, 1000);
    } catch (err) {
      setError('Failed to delete account. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Settings</h1>
          <p className={`mt-2 text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Manage your account preferences and system settings
          </p>
        </div>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className={`flex items-center p-4 ${isDark ? 'bg-red-900 bg-opacity-20 border-red-500 text-red-400' : 'bg-red-50 border-red-500 text-red-700'} border-l-4 rounded-lg shadow-sm`}>
          <FiX className="w-5 h-5 mr-3 flex-shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {message && (
        <div className={`fixed top-4 right-4 z-50 flex items-center p-4 ${isDark ? 'bg-green-900 bg-opacity-95 border-green-500 text-green-400' : 'bg-green-50 border-green-500 text-green-700'} border-l-4 rounded-lg shadow-lg max-w-sm`}>
          <FiCheck className="w-5 h-5 mr-3 flex-shrink-0" />
          <p className="font-medium">{message}</p>
          <button 
            onClick={() => setMessage(null)}
            className={`ml-3 p-1 rounded-full ${isDark ? 'hover:bg-green-800' : 'hover:bg-green-100'}`}
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Settings Sections */}
      <div className="space-y-8">
        {/* Profile Settings */}
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm overflow-hidden border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
            <div className="flex items-center">
              <FiUser className={`w-5 h-5 mr-3 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Profile Settings</h2>
            </div>
          </div>
          
          <div className="p-6">
          <form onSubmit={handleProfileUpdate}>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                  <label htmlFor="name" className={`block text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Display Name
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${
                      isDark ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="Enter your display name"
                />
              </div>

              <div>
                  <label htmlFor="email" className={`block text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={email}
                    className={`w-full px-4 py-3 border rounded-lg ${
                      isDark ? 'border-gray-600 bg-gray-700 text-gray-400' : 'border-gray-300 bg-gray-100 text-gray-600'
                    }`}
                  disabled
                    aria-describedby="email-disabled"
                />
                  <p id="email-disabled" className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Email cannot be changed from this page. Contact support for email changes.
                  </p>
                </div>
            </div>

              <div className="flex flex-col sm:flex-row justify-between gap-4 mt-8">
              <button
                type="submit"
                disabled={loading}
                  className={`flex items-center justify-center px-6 py-3 border border-transparent text-sm font-semibold rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <FiSave className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
              </button>

              <button
                type="button"
                onClick={handlePasswordReset}
                disabled={loading}
                  className={`flex items-center justify-center px-6 py-3 border text-sm font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors ${
                  isDark ? 'border-gray-600 text-gray-300 bg-gray-700 hover:bg-gray-600' : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                  }`}
              >
                  <FiKey className="w-4 h-4 mr-2" />
                Reset Password
              </button>
            </div>
          </form>
        </div>
        </div>

        {/* Notification Settings */}
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm overflow-hidden border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
            <div className="flex items-center">
              <FiBell className={`w-5 h-5 mr-3 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Notification Settings</h2>
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg border ${isDark ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'}">
                <div className="flex-1">
                  <h3 className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Email Notifications</h3>
                  <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Receive notifications via email</p>
              </div>
                <div className="flex items-center ml-4">
                <button
                  onClick={() => handleNotificationChange('email')}
                  className={`${
                    notificationSettings.email ? 'bg-green-600' : isDark ? 'bg-gray-600' : 'bg-gray-200'
                  } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
                    aria-pressed={notificationSettings.email}
                    role="switch"
                    aria-labelledby="email-notifications-label"
                >
                  <span
                    className={`${
                      notificationSettings.email ? 'translate-x-5' : 'translate-x-0'
                    } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                  ></span>
                </button>
                  <span id="email-notifications-label" className="sr-only">Email Notifications</span>
                </div>
            </div>

              <div className="flex items-center justify-between p-4 rounded-lg border ${isDark ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'}">
                <div className="flex-1">
                  <h3 className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>System Alerts</h3>
                  <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Get notified about critical system alerts</p>
              </div>
                <div className="flex items-center ml-4">
                <button
                  onClick={() => handleNotificationChange('alerts')}
                  className={`${
                    notificationSettings.alerts ? 'bg-green-600' : isDark ? 'bg-gray-600' : 'bg-gray-200'
                  } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
                    aria-pressed={notificationSettings.alerts}
                    role="switch"
                    aria-labelledby="system-alerts-label"
                >
                  <span
                    className={`${
                      notificationSettings.alerts ? 'translate-x-5' : 'translate-x-0'
                    } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                  ></span>
                </button>
                  <span id="system-alerts-label" className="sr-only">System Alerts</span>
                </div>
            </div>

              <div className="flex items-center justify-between p-4 rounded-lg border ${isDark ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'}">
                <div className="flex-1">
                  <h3 className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Weekly Reports</h3>
                  <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Receive weekly garden performance reports</p>
              </div>
                <div className="flex items-center ml-4">
                <button
                  onClick={() => handleNotificationChange('reports')}
                  className={`${
                    notificationSettings.reports ? 'bg-green-600' : isDark ? 'bg-gray-600' : 'bg-gray-200'
                  } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
                    aria-pressed={notificationSettings.reports}
                    role="switch"
                    aria-labelledby="weekly-reports-label"
                >
                  <span
                    className={`${
                      notificationSettings.reports ? 'translate-x-5' : 'translate-x-0'
                    } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                  ></span>
                </button>
                  <span id="weekly-reports-label" className="sr-only">Weekly Reports</span>
                </div>
            </div>

              <div className="flex items-center justify-between p-4 rounded-lg border ${isDark ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'}">
                <div className="flex-1">
                  <h3 className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Gardening Tips</h3>
                  <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Get personalized gardening advice</p>
              </div>
                <div className="flex items-center ml-4">
                <button
                  onClick={() => handleNotificationChange('tips')}
                  className={`${
                    notificationSettings.tips ? 'bg-green-600' : isDark ? 'bg-gray-600' : 'bg-gray-200'
                  } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
                    aria-pressed={notificationSettings.tips}
                    role="switch"
                    aria-labelledby="gardening-tips-label"
                >
                  <span
                    className={`${
                      notificationSettings.tips ? 'translate-x-5' : 'translate-x-0'
                    } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                  ></span>
                </button>
                  <span id="gardening-tips-label" className="sr-only">Gardening Tips</span>
                </div>
              </div>
              

            </div>
          </div>
        </div>

        {/* System Settings */}
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm overflow-hidden border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
            <div className="flex items-center">
              <FiSettings className={`w-5 h-5 mr-3 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>System Settings</h2>
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg border ${isDark ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'}">
                <div className="flex-1">
                  <h3 className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Automatic Watering</h3>
                  <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Enable automatic watering based on moisture levels</p>
              </div>
                <div className="flex items-center ml-4">
                <button
                  onClick={() => handleSystemSettingChange('autoWatering')}
                  className={`${
                    systemSettings.autoWatering ? 'bg-green-600' : isDark ? 'bg-gray-600' : 'bg-gray-200'
                  } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
                    aria-pressed={systemSettings.autoWatering}
                    role="switch"
                    aria-labelledby="automatic-watering-label"
                >
                  <span
                    className={`${
                      systemSettings.autoWatering ? 'translate-x-5' : 'translate-x-0'
                    } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                  ></span>
                </button>
                  <span id="automatic-watering-label" className="sr-only">Automatic Watering</span>
                </div>
            </div>

              <div className="flex items-center justify-between p-4 rounded-lg border ${isDark ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'}">
                <div className="flex-1">
                  <h3 className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Dark Mode</h3>
                  <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Switch to dark theme</p>
              </div>
                <div className="flex items-center ml-4">
                <button
                  onClick={() => handleSystemSettingChange('darkMode')}
                  className={`${
                    systemSettings.darkMode ? 'bg-green-600' : isDark ? 'bg-gray-600' : 'bg-gray-200'
                  } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
                  aria-pressed={systemSettings.darkMode}
                  role="switch"
                    aria-labelledby="dark-mode-label"
                >
                  <span
                    className={`${
                      systemSettings.darkMode ? 'translate-x-5' : 'translate-x-0'
                    } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                  ></span>
                </button>
                  <span id="dark-mode-label" className="sr-only">Dark Mode</span>
                </div>
            </div>


              

            </div>
          </div>
        </div>

        {/* Account Management */}
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm overflow-hidden border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
            <div className="flex items-center">
              <FiShield className={`w-5 h-5 mr-3 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Account Management</h2>
            </div>
          </div>
          
          <div className="p-6">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
            <button
              onClick={handleLogout}
                disabled={loading}
                className={`flex items-center justify-center px-6 py-3 border text-sm font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors ${
                isDark ? 'border-gray-600 text-gray-300 bg-gray-700 hover:bg-gray-600' : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    Signing Out...
                  </>
                ) : (
                  <>
                    <FiShield className="w-4 h-4 mr-2" />
              Sign Out
                  </>
                )}
            </button>
            
            <button
              type="button"
                onClick={handleDeleteAccount}
                disabled={loading}
                className={`flex items-center justify-center px-6 py-3 border text-sm font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors ${
                isDark ? 'border-red-800 text-red-400 bg-gray-700 hover:bg-red-900 hover:bg-opacity-20' : 'border-red-300 text-red-700 bg-white hover:bg-red-50'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <FiTrash2 className="w-4 h-4 mr-2" />
              Delete Account
                  </>
                )}
            </button>
            </div>
            
            <div className={`mt-4 p-4 rounded-lg ${isDark ? 'bg-red-900 bg-opacity-20 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
              <p className={`text-sm ${isDark ? 'text-red-300' : 'text-red-700'}`}>
                <strong>Warning:</strong> Deleting your account will permanently remove all your data, including plant information, sensor data, and settings. This action cannot be undone.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;