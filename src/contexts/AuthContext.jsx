import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, getCurrentUser } from '../lib/supabase';

// Create the auth context
export const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for existing user on mount
  useEffect(() => {
    let authListener = null;
    
    async function loadUser() {
      try {
        const { user: currentUser, error } = await getCurrentUser();
        if (error) throw error;
        setUser(currentUser);
      } catch (err) {
        console.error('Error loading user:', err);
        setError(err.message || 'Failed to load user');
      } finally {
        setLoading(false);
      }
    }

    // Initial user load
    loadUser();

    // Subscribe to auth changes with proper error handling
    try {
      const { data: authData } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          try {
            if (session?.user) {
              setUser(session.user);
            } else {
              setUser(null);
            }
            setLoading(false);
            setError(null); // Clear any previous errors
          } catch (err) {
            console.error('Auth state change error:', err);
            setError('Authentication error occurred');
            setLoading(false);
          }
        }
      );
      
      authListener = authData;
    } catch (err) {
      console.error('Failed to set up auth listener:', err);
      setError('Failed to set up authentication listener');
      setLoading(false);
    }

    // Cleanup subscription
    return () => {
      try {
        if (authListener?.subscription?.unsubscribe) {
          authListener.subscription.unsubscribe();
        }
      } catch (err) {
        console.error('Error cleaning up auth listener:', err);
      }
    };
  }, []);

  // Auth functions with improved error handling
  const login = useCallback(async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!email || !password) {
        throw new Error('Email and password are required');
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      return data;
    } catch (err) {
      const errorMessage = err.message || 'Failed to login. Please check your credentials and try again.';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const signup = useCallback(async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!email || !password) {
        throw new Error('Email and password are required');
      }
      
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) throw error;
      return data;
    } catch (err) {
      const errorMessage = err.message || 'Failed to create account. Please try again.';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear user state immediately
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
      setError(err.message || 'Failed to logout');
      // Still clear user state even if logout fails
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = {
    user,
    loading,
    error,
    login,
    signup,
    logout,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}