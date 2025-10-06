import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';

const ChangePassword = () => {
  const { changePassword, requestPasswordChangeOtp } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1); // Step 1: Enter passwords, Step 2: Enter OTP
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    otp: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { currentPassword, newPassword, confirmPassword, otp } = formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Step 1: Request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    // Password strength validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(newPassword)) {
      setError('Password must contain at least one uppercase letter, one lowercase letter, and one number');
      return;
    }

    setLoading(true);

    const result = await requestPasswordChangeOtp(currentPassword);
    
    setLoading(false);

    if (result.success) {
      setStep(2); // Move to OTP verification step
      setMessage(result.message || 'OTP sent to your email!');
    } else {
      setError(result.error);
    }
  };

  // Step 2: Verify OTP and change password
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);

    const result = await changePassword({
      otp,
      newPassword
    });
    
    setLoading(false);

    if (result.success) {
      setMessage('Password changed successfully! Redirecting...');
      setTimeout(() => {
        navigate('/profile');
      }, 2000);
    } else {
      setError(result.error);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setMessage('');
    setLoading(true);

    const result = await requestPasswordChangeOtp(currentPassword);
    
    setLoading(false);

    if (result.success) {
      setMessage('✅ New OTP sent to your email!');
      setFormData({ ...formData, otp: '' });
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">
          {step === 1 ? 'Change Password' : 'Verify OTP'}
        </h2>
        <p className="text-center text-gray-600 mb-6">
          {step === 1 ? 'Enter your current and new password' : 'Enter the OTP sent to your email'}
        </p>
        
        {message && <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-4">{message}</div>}
        {error && <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4">{error}</div>}
        
        {/* Step 1: Enter Passwords */}
        {step === 1 && (
          <form onSubmit={handleRequestOtp}>
            <div className="mb-4">
              <label htmlFor="currentPassword" className="block text-gray-700 font-medium mb-2">
                Current Password *
              </label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={currentPassword}
                onChange={onChange}
                required
                placeholder="Enter current password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="newPassword" className="block text-gray-700 font-medium mb-2">
                New Password *
              </label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={newPassword}
                onChange={onChange}
                required
                minLength="6"
                placeholder="Enter new password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <p className="text-xs text-gray-500 mt-1">
                Must contain uppercase, lowercase, and number
              </p>
            </div>
            
            <div className="mb-6">
              <label htmlFor="confirmPassword" className="block text-gray-700 font-medium mb-2">
                Confirm New Password *
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={confirmPassword}
                onChange={onChange}
                required
                minLength="6"
                placeholder="Re-enter new password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            
            <div className="flex gap-4 flex-wrap">
              <button 
                type="submit" 
                className="flex-1 bg-blue-500 text-white font-semibold py-3 rounded-lg hover:bg-blue-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed" 
                disabled={loading}
              >
                {loading ? '📧 Sending OTP...' : '📧 Send OTP'}
              </button>
              <button 
                type="button" 
                className="flex-1 bg-gray-500 text-white font-semibold py-3 rounded-lg hover:bg-gray-600 transition-all duration-300"
                onClick={() => navigate('/profile')}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Verify OTP */}
        {step === 2 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <form onSubmit={handleVerifyOtp}>
              <div className="mb-4">
                <label htmlFor="otp" className="block text-gray-700 font-medium mb-2">
                  Enter 6-Digit OTP *
                </label>
                <input
                  type="text"
                  id="otp"
                  name="otp"
                  value={otp}
                  onChange={(e) => setFormData({ ...formData, otp: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                  placeholder="Enter OTP"
                  maxLength="6"
                  className="w-full px-4 py-3 text-center text-2xl font-bold tracking-widest border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
                <p className="text-xs text-gray-600 mt-2 text-center">
                  Check your email for the verification code
                </p>
              </div>
              
              <button
                type="submit"
                className="w-full bg-blue-500 text-white font-semibold py-3 rounded-lg hover:bg-blue-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mb-3"
                disabled={loading || otp.length !== 6}
              >
                {loading ? '🔐 Changing Password...' : '🔐 Change Password'}
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                className="w-full bg-white text-blue-600 border border-blue-600 font-semibold py-2 rounded-lg hover:bg-blue-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mb-3"
                disabled={loading}
              >
                {loading ? 'Resending...' : '🔄 Resend OTP'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setFormData({ ...formData, otp: '' });
                  setError('');
                  setMessage('');
                }}
                className="w-full bg-gray-500 text-white font-semibold py-2 rounded-lg hover:bg-gray-600 transition-all duration-300"
              >
                ← Back
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChangePassword;
