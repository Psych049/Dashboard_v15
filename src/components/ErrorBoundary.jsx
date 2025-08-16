import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null 
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true,
      errorId: Date.now() // Generate unique error ID for tracking
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console and any error reporting service
    console.error('Dashboard Error:', {
      error: error.toString(),
      errorInfo: errorInfo,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // In production, you might want to send this to an error reporting service
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  componentDidUpdate(prevProps, prevState) {
    // Reset error state if props change (e.g., route change)
    if (prevProps.children !== this.props.children && this.state.hasError) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback 
        error={this.state.error} 
        errorInfo={this.state.errorInfo}
        errorId={this.state.errorId}
        onReset={() => this.setState({
          hasError: false,
          error: null,
          errorInfo: null,
          errorId: null
        })}
      />;
    }

    return this.props.children;
  }
}

const ErrorFallback = ({ error, errorInfo, errorId, onReset }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const handleReload = () => {
    try {
      window.location.reload();
    } catch (err) {
      console.error('Failed to reload page:', err);
      // Fallback: try to navigate to dashboard
      window.location.href = '/dashboard';
    }
  };

  const handleGoHome = () => {
    try {
      window.location.href = '/dashboard';
    } catch (err) {
      console.error('Failed to navigate to dashboard:', err);
      // Fallback: try to reload
      window.location.reload();
    }
  };

  const handleReset = () => {
    try {
      onReset();
    } catch (err) {
      console.error('Failed to reset error boundary:', err);
      // Fallback: reload page
      window.location.reload();
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className={`max-w-md w-full ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'} p-6`}>
        <div className="text-center">
          <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${isDark ? 'bg-red-900' : 'bg-red-100'} mb-4`}>
            <svg className={`h-6 w-6 ${isDark ? 'text-red-400' : 'text-red-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h3 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
            Something went wrong
          </h3>
          
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-6`}>
            We encountered an unexpected error while loading the dashboard. Please try refreshing the page or contact support if the problem persists.
          </p>

          {errorId && (
            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'} mb-4`}>
              Error ID: {errorId}
            </p>
          )}

          <div className="space-y-3">
            <button
              onClick={handleReset}
              className={`w-full px-4 py-2 rounded-lg transition-colors ${
                isDark 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              Try Again
            </button>
            
            <button
              onClick={handleReload}
              className={`w-full px-4 py-2 rounded-lg transition-colors ${
                isDark 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              Refresh Page
            </button>
            
            <button
              onClick={handleGoHome}
              className={`w-full px-4 py-2 rounded-lg transition-colors ${
                isDark 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              }`}
            >
              Go to Dashboard
            </button>
          </div>

          {process.env.NODE_ENV === 'development' && error && (
            <details className="mt-6 text-left">
              <summary className={`text-sm font-medium cursor-pointer ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                Error Details (Development)
              </summary>
              <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'} bg-gray-100 dark:bg-gray-700 p-3 rounded border overflow-auto max-h-32`}>
                <div className="mb-2">
                  <strong>Error:</strong> {error.toString()}
                </div>
                {errorInfo && (
                  <div>
                    <strong>Stack:</strong>
                    <pre className="whitespace-pre-wrap mt-1">{errorInfo.componentStack}</pre>
                  </div>
                )}
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorBoundary; 