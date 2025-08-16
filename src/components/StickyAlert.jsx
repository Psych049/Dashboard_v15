// src/components/StickyAlert.jsx
import React from "react";
import { FiAlertTriangle } from "react-icons/fi";
import { useTheme } from '../contexts/ThemeContext';

const StickyAlert = ({ message = "Sensor disconnected!", type = "error" }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const colorMap = {
    error: isDark 
      ? "bg-red-900 bg-opacity-30 text-red-300 border-red-500" 
      : "bg-red-100 text-red-800 border-red-400",
    warning: isDark 
      ? "bg-yellow-900 bg-opacity-30 text-yellow-300 border-yellow-500" 
      : "bg-yellow-100 text-yellow-800 border-yellow-400",
    info: isDark 
      ? "bg-blue-900 bg-opacity-30 text-blue-300 border-blue-500" 
      : "bg-blue-100 text-blue-800 border-blue-400",
  };

  return (
    <div className={`mx-2 mb-4 p-3 border-l-4 ${colorMap[type]} rounded flex items-center gap-2 text-sm transition-colors`}>
      <FiAlertTriangle className="text-lg flex-shrink-0" />
      <span className="flex-1">{message}</span>
    </div>
  );
};

export default StickyAlert;
