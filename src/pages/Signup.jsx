import React, { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const { signup, clearError } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  const handleSignup = useCallback(async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setError(null);
    
    // Validation
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    try {
      setLoading(true);
      const { data, error } = await signup(email, password);
      
      if (error) throw error;
      
      setSuccessMsg(
        "Success! Please check your email for verification link."
      );
      
      // In development, we might want to redirect directly
      setTimeout(() => {
        try {
          navigate('/login');
        } catch (navError) {
          console.error('Navigation error:', navError);
          window.location.href = '/login';
        }
      }, 3000);
      
    } catch (err) {
      console.error('Signup error:', err);
      const errorMessage = err?.message || 'Failed to create account. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [email, password, confirmPassword, signup, navigate]);

  const handleEmailChange = useCallback((e) => {
    setEmail(e.target.value);
    if (error) {
      clearError();
    }
  }, [error, clearError]);

  const handlePasswordChange = useCallback((e) => {
    setPassword(e.target.value);
    if (error) {
      clearError();
    }
  }, [error, clearError]);

  const handleConfirmPasswordChange = useCallback((e) => {
    setConfirmPassword(e.target.value);
    if (error) {
      clearError();
    }
  }, [error, clearError]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !loading && !successMsg) {
      handleSignup(e);
    }
  }, [handleSignup, loading, successMsg]);

  const handleGoToLogin = useCallback(() => {
    try {
      navigate('/login');
    } catch (err) {
      console.error('Navigation error:', err);
      window.location.href = '/login';
    }
  }, [navigate]);

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${
      isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-green-50 to-blue-50'
    }`}>
      <div className={`max-w-md w-full space-y-8 ${isDark ? 'bg-gray-800' : 'bg-white'} p-6 sm:p-8 rounded-2xl shadow-soft border ${
        isDark ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
            <span className="text-3xl" aria-hidden="true">🌿</span>
          </div>
          <h1 className={`text-3xl font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>🌿 FarmFlow</h1>
          <h2 className={`mt-2 text-lg font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Create your account</h2>
        </div>
        
        {error && (
          <div className={`p-4 rounded-lg border-l-4 border-red-500 ${
            isDark ? 'bg-red-900/20 text-red-300' : 'bg-red-50 text-red-700'
          }`} role="alert" aria-live="polite">
            <div className="flex items-center">
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium">{error}</p>
            </div>
          </div>
        )}
        
        {successMsg && (
          <div className={`p-4 rounded-lg border-l-4 border-green-500 ${
            isDark ? 'bg-green-900/20 text-green-300' : 'bg-green-50 text-green-700'
          }`} role="alert" aria-live="polite">
            <div className="flex items-center">
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm font-medium">{successMsg}</p>
            </div>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSignup} noValidate>
          <div>
            <label htmlFor="email" className={`block text-sm font-medium ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            } mb-2`}>
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className={`w-full px-4 py-3 border rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white focus:ring-green-500 focus:border-green-500 placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 focus:ring-green-500 focus:border-green-500 placeholder-gray-500'
              }`}
              placeholder="Enter your email"
              value={email}
              onChange={handleEmailChange}
              onKeyPress={handleKeyPress}
              disabled={loading || successMsg}
              aria-describedby={error ? "signup-error" : undefined}
              aria-invalid={error ? "true" : "false"}
            />
          </div>
          
          <div>
            <label htmlFor="password" className={`block text-sm font-medium ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            } mb-2`}>
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              className={`w-full px-4 py-3 border rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white focus:ring-green-500 focus:border-green-500 placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 focus:ring-green-500 focus:border-green-500 placeholder-gray-500'
              }`}
              placeholder="Enter your password"
              value={password}
              onChange={handlePasswordChange}
              onKeyPress={handleKeyPress}
              disabled={loading || successMsg}
              aria-describedby={error ? "signup-error" : undefined}
              aria-invalid={error ? "true" : "false"}
            />
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className={`block text-sm font-medium ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            } mb-2`}>
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              className={`w-full px-4 py-3 border rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white focus:ring-green-500 focus:border-green-500 placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 focus:ring-green-500 focus:border-green-500 placeholder-gray-500'
              }`}
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              onKeyPress={handleKeyPress}
              disabled={loading || successMsg}
              aria-describedby={error ? "signup-error" : undefined}
              aria-invalid={error ? "true" : "false"}
            />
          </div>
          
          <div>
            <button
              type="submit"
              disabled={loading || successMsg}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-colors ${
                (loading || successMsg) 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
              }`}
              aria-describedby={error ? "signup-error" : undefined}
            >
              {loading ? 'Creating account...' : 'Sign up'}
            </button>
          </div>
        </form>
        
        <div className="text-center">
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Already have an account?{' '}
            <button 
              onClick={handleGoToLogin} 
              className={`font-medium transition-colors ${
                isDark 
                  ? 'text-green-400 hover:text-green-300' 
                  : 'text-green-600 hover:text-green-500'
              }`}
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;