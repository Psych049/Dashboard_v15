// src/components/Sidebar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiHome, FiSettings, FiDroplet, FiActivity, FiDatabase, FiCpu, FiX } from 'react-icons/fi';
import { FaLeaf } from 'react-icons/fa';
import StickyAlert from './StickyAlert';
import { useTheme } from '../contexts/ThemeContext';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: <FiHome />, description: 'Overview of your garden' },
  { to: '/plants', label: 'Plants', icon: <FaLeaf />, description: 'Manage plant zones' },
  { to: '/schedule', label: 'Watering', icon: <FiDroplet />, description: 'Schedule and controls' },
  { to: '/sensors', label: 'Sensors', icon: <FiDatabase />, description: 'Sensor data and status' },
  { to: '/analytics', label: 'Analytics', icon: <FiActivity />, description: 'Data analysis and trends' },
  { to: '/system', label: 'System', icon: <FiCpu />, description: 'System status and logs' },
  { to: '/settings', label: 'Settings', icon: <FiSettings />, description: 'Preferences and configuration' },
];

const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  const { theme } = useTheme();
  
  const darkMode = theme === 'dark';

  const handleLinkClick = () => {
    try {
      setIsOpen(false);
    } catch (err) {
      console.error('Error closing sidebar:', err);
    }
  };

  const handleCloseClick = () => {
    try {
      setIsOpen(false);
    } catch (err) {
      console.error('Error closing sidebar:', err);
    }
  };

  const minimalUI = import.meta.env.VITE_MINIMAL_UI === 'true';
  const visibleLinks = minimalUI 
    ? links.filter(l => ['/dashboard', '/system', '/settings', '/plants'].includes(l.to)) 
    : links;

  return (
    <>
      {/* Mobile sidebar overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden backdrop-blur-sm"
          onClick={handleCloseClick}
          aria-hidden="true"
        ></div>
      )}
    
      {/* Sidebar */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 z-50 lg:z-auto transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } h-full ${
          darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'
        } flex flex-col justify-between w-64 lg:w-64 transition-all duration-300 ease-in-out border-r ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        } shadow-soft lg:shadow-sm`}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Mobile Close Button */}
        <div className="lg:hidden flex justify-end p-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={handleCloseClick}
            className={`p-2 rounded-lg transition-colors ${
              darkMode 
                ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
            aria-label="Close sidebar"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>
        
        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2" role="navigation">
          <div className="mb-6">
            <h2 className={`text-xs font-semibold uppercase tracking-wider ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            } mb-3`}>
              Navigation
            </h2>
          </div>
          
          {visibleLinks.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={handleLinkClick}
                className={`group flex items-center gap-3 p-3 rounded-lg transition-all duration-200 relative min-h-[48px] ${
                  isActive
                    ? darkMode 
                      ? 'bg-green-900/50 text-green-400 font-semibold shadow-sm border border-green-700/50'
                      : 'bg-green-50 text-green-700 font-semibold shadow-sm border border-green-200'
                    : darkMode
                      ? 'text-gray-300 hover:bg-gray-700 hover:text-gray-100'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
                aria-current={isActive ? 'page' : undefined}
                title={link.description}
              >
                {/* Active indicator */}
                {isActive && (
                  <div className={`absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 rounded-r-full ${
                    darkMode ? 'bg-green-400' : 'bg-green-500'
                  }`} aria-hidden="true"></div>
                )}
                
                <span className={`text-xl transition-colors flex-shrink-0 ${
                  isActive 
                    ? darkMode ? 'text-green-400' : 'text-green-500' 
                    : darkMode ? 'text-gray-300 group-hover:text-gray-100' : 'text-gray-400 group-hover:text-gray-600'
                }`}
                >
                  {link.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="font-medium block">{link.label}</span>
                  <p className={`text-xs mt-0.5 ${
                    isActive 
                      ? darkMode ? 'text-green-300' : 'text-green-600'
                      : darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {link.description}
                  </p>
                </div>
                
                {/* Hover indicator */}
                <div className={`absolute inset-0 rounded-lg transition-opacity duration-200 ${
                  darkMode ? 'bg-green-400/10' : 'bg-green-500/5'
                } opacity-0 group-hover:opacity-100`} aria-hidden="true"></div>
              </Link>
            );
          })}
        </nav>

        {/* Sticky Alert at Bottom */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <StickyAlert 
            message="⚠ Moisture level critically low in Zone 3" 
            type="warning" 
          />
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
