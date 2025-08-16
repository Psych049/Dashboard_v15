import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

// Create context
const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Get initial theme from localStorage or system preference with error handling
  const getInitialTheme = useCallback(() => {
    try {
      const saved = localStorage.getItem('farmflow-theme');
      if (saved && (saved === 'dark' || saved === 'light')) {
        return saved;
      }
      
      // Check system preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
      
      return 'light';
    } catch (error) {
      console.error('Error reading theme from localStorage:', error);
      return 'light'; // Fallback to light theme
    }
  }, []);

  const [theme, setTheme] = useState(getInitialTheme);

  // Apply theme by toggling `dark` class on <html> with error handling
  const applyTheme = useCallback((t) => {
    try {
      if (t === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (error) {
      console.error('Error applying theme:', error);
    }
  }, []);

  // Run once on theme change
  useEffect(() => {
    try {
      applyTheme(theme);
      localStorage.setItem('farmflow-theme', theme);
    } catch (error) {
      console.error('Error saving theme to localStorage:', error);
    }
  }, [theme, applyTheme]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      const newTheme = e.matches ? 'dark' : 'light';
      setTheme(newTheme);
    };

    try {
      mediaQuery.addEventListener('change', handleChange);
    } catch (error) {
      // Fallback for older browsers
      try {
        mediaQuery.addListener(handleChange);
      } catch (fallbackError) {
        console.error('Could not add theme change listener:', fallbackError);
      }
    }

    return () => {
      try {
        mediaQuery.removeEventListener('change', handleChange);
      } catch (error) {
        // Fallback for older browsers
        try {
          mediaQuery.removeListener(handleChange);
        } catch (fallbackError) {
          console.error('Could not remove theme change listener:', fallbackError);
        }
      }
    };
  }, []);

  // Toggle function with error handling
  const toggleTheme = useCallback(() => {
    try {
      setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
    } catch (error) {
      console.error('Error toggling theme:', error);
    }
  }, []);

  // Set theme manually (for settings page) with validation
  const setThemeDirectly = useCallback((newTheme) => {
    try {
      if (newTheme === 'dark' || newTheme === 'light') {
        setTheme(newTheme);
      } else {
        console.warn('Invalid theme value:', newTheme);
      }
    } catch (error) {
      console.error('Error setting theme directly:', error);
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setThemeDirectly }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook with error handling
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
