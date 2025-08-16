import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';

const Header = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const { theme, setThemeDirectly } = useTheme();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationsRef = useRef(null);
  const profileRef = useRef(null);
  
  // Mock notifications data - replace with real data from your backend
  const [notifications] = useState([
    {
      id: 1,
      title: "Watering Complete",
      description: "Zone A has been watered successfully",
      time: "2 minutes ago",
      read: false,
      icon: "💧",
      type: "success"
    },
    {
      id: 2,
      title: "Temperature Alert",
      description: "Temperature in Zone B is above optimal range",
      time: "15 minutes ago",
      read: false,
      icon: "🌡️",
      type: "warning"
    },
    {
      id: 3,
      title: "System Update",
      description: "New firmware update available",
      time: "1 hour ago",
      read: true,
      icon: "🔧",
      type: "info"
    }
  ]);
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      try {
        if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
          setShowNotifications(false);
        }
        if (profileRef.current && !profileRef.current.contains(event.target)) {
          setShowProfileMenu(false);
        }
      } catch (err) {
        console.error('Error handling click outside:', err);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close dropdowns on escape key
  useEffect(() => {
    const handleEscape = (event) => {
      try {
        if (event.key === 'Escape') {
          setShowNotifications(false);
          setShowProfileMenu(false);
        }
      } catch (err) {
        console.error('Error handling escape key:', err);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);
  
  // Handler for the theme toggle
  const handleToggleTheme = useCallback(() => {
    try {
      const newTheme = theme === 'light' ? 'dark' : 'light';
      setThemeDirectly(newTheme);
    } catch (err) {
      console.error('Error toggling theme:', err);
    }
  }, [theme, setThemeDirectly]);

  // Handler for logout
  const handleLogout = useCallback(async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Still try to navigate to login even if logout fails
      try {
        navigate('/login');
      } catch (navError) {
        console.error('Navigation error:', navError);
        // Last resort: reload page
        window.location.href = '/login';
      }
    }
  }, [logout, navigate]);
  
  // Handler for marking all notifications as read
  const markAllNotificationsRead = useCallback(() => {
    try {
      // In a real app, you would make an API call here
      console.log('Marking all notifications as read');
      setShowNotifications(false);
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;
  
  // Safe user email extraction
  const userEmail = user?.email || 'User';
  const userInitial = userEmail.charAt(0).toUpperCase();
  
  return (
    <header className={`${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white'} border-b shadow-soft sticky top-0 z-30 backdrop-blur-sm bg-opacity-95`}>
      <div className="px-4 sm:px-6 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <button 
            onClick={toggleSidebar}
            className={`mr-3 lg:hidden p-2 rounded-lg transition-colors ${
              theme === 'dark' 
                ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
            aria-label="Toggle sidebar"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className={`text-lg sm:text-xl font-bold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'} flex items-center`}>
            <span className="mr-2" aria-hidden="true">🌿</span>
            FarmFlow
          </h1>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Theme Toggle */}
          <button 
            onClick={handleToggleTheme}
            className={`p-2 rounded-lg transition-colors ${
              theme === 'dark' 
                ? 'text-yellow-300 hover:text-yellow-200 hover:bg-gray-700' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
            aria-label="Toggle dark mode"
            aria-pressed={theme === 'dark'}
          >
            {theme === 'dark' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
          
          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <button
              className={`relative p-2 rounded-lg transition-colors ${
                theme === 'dark' 
                  ? 'text-gray-300 hover:text-gray-200 hover:bg-gray-700' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
              onClick={() => setShowNotifications((prev) => !prev)}
              aria-label="View notifications"
              aria-haspopup="true"
              aria-expanded={showNotifications ? "true" : "false"}
            >
              <span className="sr-only">View notifications</span>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" 
                />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <div
                className={`origin-top-right absolute right-0 mt-2 w-80 max-w-xs rounded-lg shadow-soft z-50 border ${
                  theme === 'dark'
                    ? 'bg-gray-800 border-gray-700'
                    : 'bg-white border-gray-200'
                }`}
                tabIndex={-1}
              >
                <div className="py-3 px-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <span className={`font-semibold text-base ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                    Notifications ({unreadCount} unread)
                  </span>
                  <button
                    className={`text-xs px-2 py-1 rounded transition-colors ${
                      theme === 'dark'
                        ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={() => setShowNotifications(false)}
                    aria-label="Close notifications"
                  >
                    ✕
                  </button>
                </div>
                <ul className="max-h-64 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
                  {notifications && notifications.length > 0 ? (
                    notifications.map((notif, idx) => (
                      <li
                        key={notif.id || idx}
                        className={`px-4 py-3 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer ${
                          !notif.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}
                      >
                        <span className="mt-1 text-lg" aria-hidden="true">
                          {notif.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm ${notif.read ? 'text-gray-400 dark:text-gray-500' : theme === 'dark' ? 'text-white' : 'text-gray-900'} font-medium`}>
                            {notif.title}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{notif.description}</div>
                          <div className="text-xs text-gray-400 mt-1">{notif.time}</div>
                        </div>
                        {!notif.read && (
                          <span className="ml-2 mt-1 h-2 w-2 rounded-full bg-blue-500 inline-block" aria-hidden="true"></span>
                        )}
                      </li>
                    ))
                  ) : (
                    <li className="px-4 py-6 text-center text-gray-400 dark:text-gray-500 text-sm">
                      No new notifications.
                    </li>
                  )}
                </ul>
                {unreadCount > 0 && (
                  <div className="py-2 px-4 border-t border-gray-200 dark:border-gray-700 text-right">
                    <button
                      className={`text-xs font-medium transition-colors ${
                        theme === 'dark'
                          ? 'text-green-300 hover:text-green-200'
                          : 'text-green-600 hover:text-green-700'
                      }`}
                      onClick={markAllNotificationsRead}
                    >
                      Mark all as read
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Profile dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              className={`flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors ${
                theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              aria-label="User menu"
              aria-haspopup="true"
              aria-expanded={showProfileMenu ? "true" : "false"}
            >
              <span className="sr-only">Open user menu</span>
              <div className={`h-8 w-8 rounded-full ${theme === 'dark' ? 'bg-green-800 text-green-100' : 'bg-green-100 text-green-800'} flex items-center justify-center font-medium`}>
                {userInitial}
              </div>
            </button>
            
            {showProfileMenu && (
              <div className={`origin-top-right absolute right-0 mt-2 w-48 rounded-lg shadow-soft border z-50 ${
                theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
              }`}>
                <div className="py-1">
                  <div className={`px-4 py-2 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} border-b border-gray-200 dark:border-gray-600`}>
                    <div className="font-medium">{userEmail}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Signed in</div>
                  </div>
                  <button
                    onClick={() => {
                      try {
                        setShowProfileMenu(false);
                        navigate('/settings');
                      } catch (err) {
                        console.error('Navigation error:', err);
                        setShowProfileMenu(false);
                      }
                    }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      theme === 'dark' 
                        ? 'text-gray-200 hover:bg-gray-600' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      theme === 'dark' 
                        ? 'text-gray-200 hover:bg-gray-600' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;