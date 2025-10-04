import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      setUser(JSON.parse(userData));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    setLoading(false);
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
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
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
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
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
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
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

  // Change password
  const changePassword = async (passwords) => {
    try {
      setError(null);
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/auth/updatepassword`,
        passwords
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

  const value = {
    user,
    loading,
    error,
    register,
    login,
    logout,
    updateProfile,
    changePassword,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
