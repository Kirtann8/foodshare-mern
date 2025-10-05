import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import AuthContext from '../../context/AuthContext';

const Register = () => {
  const navigate = useNavigate();
  const { register, googleLogin } = useContext(AuthContext);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'user',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    }
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { name, email, password, confirmPassword, phone, role, address } = formData;

  const onChange = (e) => {
    if (e.target.name.includes('address.')) {
      const field = e.target.name.split('.')[1];
      setFormData({
        ...formData,
        address: { ...address, [field]: e.target.value }
      });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    const result = await register({
      name,
      email,
      password,
      phone,
      role,
      address
    });
    
    setLoading(false);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setError('');
      setLoading(true);
      
      // Decode the JWT credential to get user info
      const decoded = jwtDecode(credentialResponse.credential);
      
      const googleData = {
        email: decoded.email,
        name: decoded.name,
        googleId: decoded.sub,
        picture: decoded.picture
      };

      const result = await googleLogin(googleData);
      
      setLoading(false);

      if (result.success) {
        navigate('/');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setLoading(false);
      setError('Google registration failed. Please try again.');
    }
  };

  const handleGoogleError = () => {
    setError('Google registration failed. Please try again.');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-2xl w-full">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">Join FoodShare</h2>
        <p className="text-center text-gray-600 mb-6">Create an account to start sharing</p>
        
        {error && <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4">{error}</div>}
        
        <form onSubmit={onSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-gray-700 font-medium mb-2">Full Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={name}
              onChange={onChange}
              required
              placeholder="Enter your full name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 font-medium mb-2">Email Address *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={onChange}
              required
              placeholder="Enter your email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="phone" className="block text-gray-700 font-medium mb-2">Phone Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={phone}
              onChange={onChange}
              placeholder="10-digit phone number"
              pattern="[0-9]{10}"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="password" className="block text-gray-700 font-medium mb-2">Password *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={onChange}
              required
              minLength="6"
              placeholder="At least 6 characters"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="confirmPassword" className="block text-gray-700 font-medium mb-2">Confirm Password *</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={confirmPassword}
              onChange={onChange}
              required
              minLength="6"
              placeholder="Re-enter your password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="address.street" className="block text-gray-700 font-medium mb-2">Street Address</label>
            <input
              type="text"
              id="address.street"
              name="address.street"
              value={address.street}
              onChange={onChange}
              placeholder="Street address"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="address.city" className="block text-gray-700 font-medium mb-2">City</label>
              <input
                type="text"
                id="address.city"
                name="address.city"
                value={address.city}
                onChange={onChange}
                placeholder="City"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label htmlFor="address.state" className="block text-gray-700 font-medium mb-2">State</label>
              <input
                type="text"
                id="address.state"
                name="address.state"
                value={address.state}
                onChange={onChange}
                placeholder="State"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="address.zipCode" className="block text-gray-700 font-medium mb-2">ZIP Code</label>
            <input
              type="text"
              id="address.zipCode"
              name="address.zipCode"
              value={address.zipCode}
              onChange={onChange}
              placeholder="ZIP Code"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            />
          </div>
          
          <button type="submit" className="w-full bg-green-500 text-white font-semibold py-3 rounded-lg hover:bg-green-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed" disabled={loading}>
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <div className="my-6 flex items-center">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-4 text-gray-500 text-sm">OR</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            text="signup_with"
            shape="rectangular"
            size="large"
            width="100%"
          />
        </div>
        
        <p className="text-center text-gray-600 mt-6">
          Already have an account? <Link to="/login" className="text-green-500 font-medium hover:text-green-600">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
