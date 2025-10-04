import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import './Auth.css';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useContext(AuthContext);
  
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

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Join FoodShare</h2>
        <p className="auth-subtitle">Create an account to start sharing</p>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="name">Full Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={name}
              onChange={onChange}
              required
              placeholder="Enter your full name"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email Address *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={onChange}
              required
              placeholder="Enter your email"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={phone}
              onChange={onChange}
              placeholder="10-digit phone number"
              pattern="[0-9]{10}"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={onChange}
              required
              minLength="6"
              placeholder="At least 6 characters"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password *</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={confirmPassword}
              onChange={onChange}
              required
              minLength="6"
              placeholder="Re-enter your password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="address.street">Street Address</label>
            <input
              type="text"
              id="address.street"
              name="address.street"
              value={address.street}
              onChange={onChange}
              placeholder="Street address"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="address.city">City</label>
              <input
                type="text"
                id="address.city"
                name="address.city"
                value={address.city}
                onChange={onChange}
                placeholder="City"
              />
            </div>

            <div className="form-group">
              <label htmlFor="address.state">State</label>
              <input
                type="text"
                id="address.state"
                name="address.state"
                value={address.state}
                onChange={onChange}
                placeholder="State"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="address.zipCode">ZIP Code</label>
            <input
              type="text"
              id="address.zipCode"
              name="address.zipCode"
              value={address.zipCode}
              onChange={onChange}
              placeholder="ZIP Code"
            />
          </div>
          
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>
        
        <p className="auth-link">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
