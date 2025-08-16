import React, { useState, useCallback } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import Header from '../Header';
import Sidebar from '../Sidebar';

const AuthenticatedLayout = () => {
  const { user, loading } = useAuth();
  const { theme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleToggleSidebar = useCallback(() => {
    try {
      setSidebarOpen(prev => !prev);
    } catch (err) {
      console.error('Error toggling sidebar:', err);
    }
  }, []);

  const handleSidebarChange = useCallback((isOpen) => {
    try {
      setSidebarOpen(isOpen);
    } catch (err) {
      console.error('Error changing sidebar state:', err);
    }
  }, []);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    try {
      return <Navigate to="/login" replace />;
    } catch (err) {
      console.error('Navigation error:', err);
      // Fallback: reload page to trigger navigation
      window.location.href = '/login';
      return null;
    }
  }

  return (
    <div className={`min-h-screen flex flex-col ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-green-50/30'}`}>
      {/* Header */}
      <Header toggleSidebar={handleToggleSidebar} />
      
      {/* Main Layout Container */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} setIsOpen={handleSidebarChange} />
        
        {/* Main Content Area */}
        <main className={`flex-1 overflow-y-auto ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-transparent'}`}>
          <div className="p-4 sm:p-6 min-h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AuthenticatedLayout;
