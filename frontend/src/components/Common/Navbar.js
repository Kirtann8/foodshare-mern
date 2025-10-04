import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import './Common.css';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <span className="logo-icon">🍽️</span>
          <span className="logo-text">FoodShare</span>
        </Link>

        <ul className="nav-menu">
          <li className="nav-item">
            <Link to="/" className="nav-link">Browse Food</Link>
          </li>

          {isAuthenticated ? (
            <>
              <li className="nav-item">
                <Link to="/food/create" className="nav-link">Share Food</Link>
              </li>
              <li className="nav-item">
                <Link to="/my-donations" className="nav-link">My Donations</Link>
              </li>
              <li className="nav-item">
                <Link to="/my-claims" className="nav-link">My Claims</Link>
              </li>
              {user?.role === 'admin' && (
                <li className="nav-item">
                  <Link to="/admin" className="nav-link" style={{ color: '#f59e0b', fontWeight: 'bold' }}>
                    🛡️ Admin Panel
                  </Link>
                </li>
              )}
              <li className="nav-item dropdown">
                <button className="nav-link dropdown-toggle">
                  {user?.name || 'Account'}
                  {user?.role === 'admin' && <span style={{ marginLeft: '5px', fontSize: '0.8em' }}>👑</span>}
                </button>
                <div className="dropdown-menu">
                  <Link to="/profile" className="dropdown-item">Profile</Link>
                  <Link to="/change-password" className="dropdown-item">Change Password</Link>
                  {user?.role === 'admin' && (
                    <Link to="/admin" className="dropdown-item">🛡️ Admin Panel</Link>
                  )}
                  <button onClick={handleLogout} className="dropdown-item">Logout</button>
                </div>
              </li>
            </>
          ) : (
            <>
              <li className="nav-item">
                <Link to="/login" className="nav-link">Login</Link>
              </li>
              <li className="nav-item">
                <Link to="/register" className="nav-link nav-link-primary">Register</Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
