import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true // Enable sending cookies with requests
});

// Add response interceptor to handle token expiration
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't retried yet, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh the token
        await axiosInstance.post('/auth/refresh');
        
        // Retry the original request
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('user'); // Clean up any stored user data
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Food API services
export const foodAPI = {
  // Get all food posts with optional filters
  getFoods: async (filters = {}) => {
    try {
      // Remove empty string values from filters
      const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});
      
      const queryString = new URLSearchParams(cleanFilters).toString();
      const url = queryString ? `/food?${queryString}` : '/food';
      console.log('API Request URL:', url);
      const response = await axiosInstance.get(url);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get single food post
  getFood: async (id) => {
    try {
      const response = await axiosInstance.get(`/food/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Create new food post
  createFood: async (foodData) => {
    try {
      const response = await axiosInstance.post('/food', foodData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update food post
  updateFood: async (id, foodData) => {
    try {
      const response = await axiosInstance.put(`/food/${id}`, foodData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete food post
  deleteFood: async (id) => {
    try {
      const response = await axiosInstance.delete(`/food/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Claim food post
  claimFood: async (id) => {
    try {
      const response = await axiosInstance.put(`/food/${id}/claim`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Complete food post
  completeFood: async (id) => {
    try {
      const response = await axiosInstance.put(`/food/${id}/complete`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get my donations
  getMyDonations: async () => {
    try {
      const response = await axiosInstance.get('/food/my/donations');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get my claims
  getMyClaims: async () => {
    try {
      const response = await axiosInstance.get('/food/my/claims');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Upload image to Cloudinary
  uploadImage: async (formData, onUploadProgress) => {
    try {
      const response = await axiosInstance.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Search by location
  searchByLocation: async (city, state) => {
    try {
      const params = { city };
      if (state) params.state = state;
      const queryString = new URLSearchParams(params).toString();
      const response = await axiosInstance.get(`/food/search/location?${queryString}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

// Admin API services
export const adminAPI = {
  // Get all users
  getAllUsers: async () => {
    try {
      const response = await axiosInstance.get('/auth/users');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get single user
  getUser: async (id) => {
    try {
      const response = await axiosInstance.get(`/auth/users/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update user
  updateUser: async (id, userData) => {
    try {
      const response = await axiosInstance.put(`/auth/users/${id}`, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete user
  deleteUser: async (id) => {
    try {
      const response = await axiosInstance.delete(`/auth/users/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get all food posts (including inactive) - Admin only
  getAllFoods: async (filters = {}) => {
    try {
      const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});
      
      const queryString = new URLSearchParams(cleanFilters).toString();
      const url = queryString ? `/food/admin/all?${queryString}` : '/food/admin/all';
      const response = await axiosInstance.get(url);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get food statistics - Admin only
  getFoodStats: async () => {
    try {
      const response = await axiosInstance.get('/food/admin/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete any food post - Admin only
  deleteFoodPost: async (id) => {
    try {
      const response = await axiosInstance.delete(`/food/admin/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

// Auth API services
export const authAPI = {
  // Google OAuth login/register
  googleAuth: async (googleData) => {
    try {
      const response = await axiosInstance.post('/auth/google', googleData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

// Export the axios instance as the default export
// This allows components to use generic HTTP methods (post, get, put, delete, etc.)
export default axiosInstance;
