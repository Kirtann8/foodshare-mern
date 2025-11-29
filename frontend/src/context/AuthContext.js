import React, { createContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);

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

  // Setup Socket.IO connection when user is authenticated
  useEffect(() => {
    if (user) {
      // Get base URL from API URL (remove /api suffix)
      const socketUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
      
      // Initialize socket connection
      socketRef.current = io(socketUrl, {
        transports: ['websocket', 'polling'],
        withCredentials: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5
      });

      const socket = socketRef.current;

      socket.on('connect', () => {
        console.log('Socket connected:', socket.id);
        // Authenticate the socket with user ID
        socket.emit('authenticate', user._id);
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      // Listen for food claimed events
      socket.on('foodClaimed', (data) => {
        console.log('Received foodClaimed event:', data);
        // Show notification for all users about food being claimed
        toast.info(`📢 "${data.foodTitle}" has been claimed by ${data.claimedBy.name}`, {
          position: 'top-right',
          autoClose: 5000
        });
      });

      // Listen for personalized food claimed notification (for donors)
      socket.on('foodClaimedNotification', (data) => {
        console.log('Received foodClaimedNotification event:', data);
        toast.success(`🎉 Your food "${data.foodTitle}" has been claimed by ${data.claimedBy.name}!`, {
          position: 'top-right',
          autoClose: 7000
        });
      });

      // Listen for food completed events
      socket.on('foodCompleted', (data) => {
        console.log('Received foodCompleted event:', data);
        toast.success(`✅ "${data.foodTitle}" has been marked as completed`, {
          position: 'top-right',
          autoClose: 5000
        });
      });

      // Listen for personalized food completed notification (for claimers)
      socket.on('foodCompletedNotification', (data) => {
        console.log('Received foodCompletedNotification event:', data);
        toast.success(`✅ The food "${data.foodTitle}" you claimed has been completed!`, {
          position: 'top-right',
          autoClose: 7000
        });
      });

      socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
      });

      // Cleanup on unmount or user logout
      return () => {
        if (socketRef.current) {
          console.log('Disconnecting socket...');
          socketRef.current.disconnect();
        }
      };
    }
  }, [user]);

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

  // Apply for volunteer role
  const applyForVolunteer = async (applicationData) => {
    try {
      setError(null);
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/auth/apply-volunteer`,
        applicationData
      );

      if (response.data.success) {
        // Update user data to reflect application status
        const updatedUser = { ...user, volunteerApplication: response.data.data };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        return { success: true, message: response.data.message };
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Application failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  // Get volunteer applications (Admin only)
  const getVolunteerApplications = async () => {
    try {
      setError(null);
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/auth/volunteer-applications`
      );

      if (response.data.success) {
        return { success: true, data: response.data.data };
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to fetch applications';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  // Review volunteer application (Admin only)
  const reviewVolunteerApplication = async (userId, action) => {
    try {
      setError(null);
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/auth/review-volunteer-application`,
        { userId, action }
      );

      if (response.data.success) {
        return { success: true, message: response.data.message };
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Review failed';
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
    applyForVolunteer,
    getVolunteerApplications,
    reviewVolunteerApplication,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isVolunteer: user?.role === 'volunteer',
    isVolunteerOrAdmin: user?.role === 'volunteer' || user?.role === 'admin',
    canApplyForVolunteer: user?.role === 'user' && user?.volunteerApplication?.status !== 'pending' && user?.volunteerApplication?.status !== 'approved'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
