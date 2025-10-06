import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import AuthContext from '../../context/AuthContext';
import api from '../../services/api';

const Register = () => {
  const navigate = useNavigate();
  const { login, googleLogin } = useContext(AuthContext);
  
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
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [registeredPassword, setRegisteredPassword] = useState('');
  const [resendLoading, setResendLoading] = useState(false);

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

    try {
      // Clean address object - only send if fields have values
      const cleanAddress = Object.entries(address).reduce((acc, [key, value]) => {
        if (value && value.trim() !== '') {
          acc[key] = value.trim();
        }
        return acc;
      }, {});

      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role
      };

      // Only add phone if provided
      if (phone && phone.trim()) {
        payload.phone = phone.trim();
      }

      // Only add address if at least one field has value
      if (Object.keys(cleanAddress).length > 0) {
        payload.address = cleanAddress;
      }

      console.log('Sending registration payload:', payload);

      const response = await api.post('/auth/register', payload);

      if (response.data.success) {
        setRegisteredEmail(email);
        setRegisteredPassword(password);
        setShowOtpInput(true);
        setError('');
      }
    } catch (err) {
      console.error('Registration error:', err);
      console.error('Error response:', err.response);
      const errorMessage = err.response?.data?.error || err.message || 'Registration failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');

    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/verify-email', { token: otp });

      if (response.data.success) {
        // Auto login after verification
        const result = await login(registeredEmail, registeredPassword);

        if (result.success) {
          navigate('/');
        } else {
          // If auto-login fails, redirect to login page
          navigate('/login', { 
            state: { 
              message: 'Email verified successfully! Please login.' 
            } 
          });
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setResendLoading(true);

    try {
      const response = await api.post('/auth/resend-verification', {
        email: registeredEmail
      });

      if (response.data.success) {
        setError('');
        alert('✅ New OTP sent to your email!');
        setOtp('');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend OTP.');
    } finally {
      setResendLoading(false);
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
        <p className="text-center text-gray-600 mb-6">
          {showOtpInput ? 'Verify your email to complete registration' : 'Create an account to start sharing'}
        </p>
        
        {error && <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4">{error}</div>}
        
        {/* OTP Verification Section */}
        {showOtpInput ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h3 className="text-xl font-bold text-green-800 mb-2">📧 Verify Your Email</h3>
            <p className="text-green-700 mb-4">
              We've sent a 6-digit OTP to <strong>{registeredEmail}</strong>. Please check your email and enter the code below.
            </p>
            
            <form onSubmit={handleVerifyOtp}>
              <div className="mb-4">
                <label htmlFor="otp" className="block text-gray-700 font-medium mb-2">Enter OTP</label>
                <input
                  type="text"
                  id="otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit OTP"
                  maxLength="6"
                  className="w-full px-4 py-3 text-center text-2xl font-bold tracking-widest border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  required
                />
              </div>
              
              <button
                type="submit"
                className="w-full bg-green-500 text-white font-semibold py-3 rounded-lg hover:bg-green-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mb-3"
                disabled={loading || otp.length !== 6}
              >
                {loading ? 'Verifying...' : 'Verify Email & Login'}
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                className="w-full bg-white text-green-600 border border-green-600 font-semibold py-2 rounded-lg hover:bg-green-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={resendLoading}
              >
                {resendLoading ? 'Resending...' : '🔄 Resend OTP'}
              </button>
            </form>
          </div>
        ) : (
          <>
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
              
              <button 
                type="submit" 
                className="w-full bg-green-500 text-white font-semibold py-3 rounded-lg hover:bg-green-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed" 
                disabled={loading}
              >
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
                width={400}
              />
            </div>
            
            <p className="text-center text-gray-600 mt-6">
              Already have an account? <Link to="/login" className="text-green-500 font-medium hover:text-green-600">Login here</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default Register;
