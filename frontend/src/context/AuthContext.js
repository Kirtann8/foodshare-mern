import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Configure axios to send cookies
  axios.defaults.withCredentials = true;

  // Load user from localStorage on mount and verify session
  useEffect(() => {
    const loadUser = async () => {
      const userData = localStorage.getItem('user');

      if (userData && userData !== 'undefined' && userData !== 'null') {
        try {
          setUser(JSON.parse(userData));
          
          // Verify the session is still valid by fetching current user
          const response = await axios.get(`${process.env.REACT_APP_API_URL}/auth/me`);
          if (response.data.success) {
            setUser(response.data.data);
            localStorage.setItem('user', JSON.stringify(response.data.data));
          }
        } catch (err) {
          // Session invalid or parse error, clear user data
          localStorage.removeItem('user');
          setUser(null);
        }
      } else {
        // Clear invalid localStorage data
        localStorage.removeItem('user');
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  // Register user
  const register = async (userData) => {
    try {
      setError(null);
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/auth/register`,
        userData
      );

      if (response.data.success) {
        const { user } = response.data;
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);
        return { success: true };
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Registration failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  // Login user
  const login = async (credentials) => {
    try {
      setError(null);
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/auth/login`,
        credentials
      );

      if (response.data.success) {
        const { user } = response.data;
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);
        return { success: true };
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Login failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  // Logout user
  const logout = async () => {
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/auth/logout`);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  // Update user profile
  const updateProfile = async (userData) => {
    try {
      setError(null);
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/auth/updatedetails`,
        userData
      );

      if (response.data.success) {
        const updatedUser = { ...user, ...response.data.data };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        return { success: true };
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Update failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  // Request password change OTP
  const requestPasswordChangeOtp = async (currentPassword) => {
    try {
      setError(null);
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/auth/request-password-change-otp`,
        { currentPassword }
      );

      if (response.data.success) {
        return { success: true, message: response.data.message };
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to send OTP';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  // Change password with OTP
  const changePassword = async (passwordData) => {
    try {
      setError(null);
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/auth/updatepassword`,
        passwordData
      );

      if (response.data.success) {
        return { success: true };
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Password change failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  // Google OAuth login/register
  const googleLogin = async (googleData) => {
    try {
      setError(null);
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/auth/google`,
        googleData
      );

      if (response.data.success) {
        const { user } = response.data;
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);
        return { success: true };
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Google login failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const value = {
    user,
    loading,
    error,
    register,
    login,
    logout,
    updateProfile,
    requestPasswordChangeOtp,
    changePassword,
    googleLogin,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
