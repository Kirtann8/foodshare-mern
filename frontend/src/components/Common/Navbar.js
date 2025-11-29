import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated, isVolunteer, isVolunteerOrAdmin, canApplyForVolunteer, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setDropdownOpen(false);
    setMobileMenuOpen(false);
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close mobile menu when window is resized to desktop size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [mobileMenuOpen]);

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-green-500 no-underline">
            <span className="text-2xl sm:text-3xl">🍽️</span>
            <span>FoodShare</span>
          </Link>

          {/* Desktop Menu */}
          <ul className="hidden md:flex list-none gap-2 lg:gap-4 items-center">
            <li>
              <Link to="/" className="no-underline text-gray-800 font-medium px-3 lg:px-4 py-2 rounded-lg transition-all duration-300 hover:bg-gray-100 hover:text-green-500 text-sm lg:text-base">Browse Food</Link>
            </li>

            {isAuthenticated ? (
              <>
                <li>
                  <Link to="/food/create" className="no-underline text-gray-800 font-medium px-3 lg:px-4 py-2 rounded-lg transition-all duration-300 hover:bg-gray-100 hover:text-green-500 text-sm lg:text-base">Share Food</Link>
                </li>
                <li>
                  <Link to="/my-donations" className="no-underline text-gray-800 font-medium px-3 lg:px-4 py-2 rounded-lg transition-all duration-300 hover:bg-gray-100 hover:text-green-500 text-sm lg:text-base">My Donations</Link>
                </li>
                <li>
                  <Link to="/my-claims" className="no-underline text-gray-800 font-medium px-3 lg:px-4 py-2 rounded-lg transition-all duration-300 hover:bg-gray-100 hover:text-green-500 text-sm lg:text-base">My Claims</Link>
                </li>
                <li>
                  <Link to="/messages" className="no-underline text-gray-800 font-medium px-3 lg:px-4 py-2 rounded-lg transition-all duration-300 hover:bg-gray-100 hover:text-green-500 text-sm lg:text-base">💬 Messages</Link>
                </li>
                {canApplyForVolunteer && (
                  <li>
                    <Link to="/apply-volunteer" className="no-underline text-blue-600 font-medium px-3 lg:px-4 py-2 rounded-lg transition-all duration-300 hover:bg-blue-50 text-sm lg:text-base">
                      🤝 Become Volunteer
                    </Link>
                  </li>
                )}
                {isVolunteer && (
                  <li>
                    <Link to="/volunteer" className="no-underline text-purple-600 font-bold px-3 lg:px-4 py-2 rounded-lg transition-all duration-300 hover:bg-purple-50 text-sm lg:text-base">
                      🤝 Volunteer Panel
                    </Link>
                  </li>
                )}
                {user?.role === 'admin' && (
                  <li>
                    <Link to="/admin" className="no-underline text-amber-500 font-bold px-3 lg:px-4 py-2 rounded-lg transition-all duration-300 hover:bg-gray-100 text-sm lg:text-base">
                      🛡️ Admin
                    </Link>
                  </li>
                )}
                <li className="relative" ref={dropdownRef}>
                  <button 
                    onClick={toggleDropdown}
                    className="text-gray-800 font-medium px-3 lg:px-4 py-2 rounded-lg transition-all duration-300 hover:bg-gray-100 hover:text-green-500 bg-transparent border-none cursor-pointer text-sm lg:text-base"
                  >
                    {user?.name || 'Account'}
                    {user?.role === 'admin' && <span className="ml-1 text-xs">👑</span>}
                    {user?.role === 'volunteer' && <span className="ml-1 text-xs">🤝</span>}
                    <span className="ml-1">{dropdownOpen ? '▴' : '▾'}</span>
                  </button>
                  {dropdownOpen && (
                    <div className="absolute top-full right-0 bg-white shadow-lg rounded-lg min-w-[200px] mt-2 border border-gray-200 overflow-hidden">
                      <Link to="/profile" onClick={() => setDropdownOpen(false)} className="block px-4 py-3 text-gray-800 no-underline transition-all duration-300 hover:bg-gray-100">Profile</Link>
                      <Link to="/change-password" onClick={() => setDropdownOpen(false)} className="block px-4 py-3 text-gray-800 no-underline transition-all duration-300 hover:bg-gray-100">Change Password</Link>
                      {canApplyForVolunteer && (
                        <Link to="/apply-volunteer" onClick={() => setDropdownOpen(false)} className="block px-4 py-3 text-blue-600 no-underline transition-all duration-300 hover:bg-gray-100">🤝 Become Volunteer</Link>
                      )}
                      {isVolunteer && (
                        <Link to="/volunteer" onClick={() => setDropdownOpen(false)} className="block px-4 py-3 text-purple-600 no-underline transition-all duration-300 hover:bg-gray-100">🤝 Volunteer Panel</Link>
                      )}
                      {user?.role === 'admin' && (
                        <Link to="/admin" onClick={() => setDropdownOpen(false)} className="block px-4 py-3 text-gray-800 no-underline transition-all duration-300 hover:bg-gray-100">🛡️ Admin Panel</Link>
                      )}
                      <button onClick={handleLogout} className="w-full text-left block px-4 py-3 text-red-600 transition-all duration-300 hover:bg-gray-100 bg-transparent border-none cursor-pointer text-base font-medium">Logout</button>
                    </div>
                  )}
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link to="/login" className="no-underline text-gray-800 font-medium px-3 lg:px-4 py-2 rounded-lg transition-all duration-300 hover:bg-gray-100 hover:text-green-500 text-sm lg:text-base">Login</Link>
                </li>
                <li>
                  <Link to="/register" className="no-underline bg-green-500 text-white font-medium px-3 lg:px-4 py-2 rounded-lg transition-all duration-300 hover:bg-green-600 text-sm lg:text-base">Register</Link>
                </li>
              </>
            )}
          </ul>

          {/* Mobile Menu Button */}
          <button 
            onClick={toggleMobileMenu}
            className="md:hidden text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-all duration-300"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <ul className="flex flex-col gap-2">
              <li>
                <Link 
                  to="/" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="block no-underline text-gray-800 font-medium px-4 py-2 rounded-lg transition-all duration-300 hover:bg-gray-100 hover:text-green-500"
                >
                  Browse Food
                </Link>
              </li>

              {isAuthenticated ? (
                <>
                  <li>
                    <Link 
                      to="/food/create" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="block no-underline text-gray-800 font-medium px-4 py-2 rounded-lg transition-all duration-300 hover:bg-gray-100 hover:text-green-500"
                    >
                      Share Food
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to="/my-donations" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="block no-underline text-gray-800 font-medium px-4 py-2 rounded-lg transition-all duration-300 hover:bg-gray-100 hover:text-green-500"
                    >
                      My Donations
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to="/my-claims" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="block no-underline text-gray-800 font-medium px-4 py-2 rounded-lg transition-all duration-300 hover:bg-gray-100 hover:text-green-500"
                    >
                      My Claims
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to="/messages" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="block no-underline text-gray-800 font-medium px-4 py-2 rounded-lg transition-all duration-300 hover:bg-gray-100 hover:text-green-500"
                    >
                      💬 Messages
                    </Link>
                  </li>
                  {canApplyForVolunteer && (
                    <li>
                      <Link 
                        to="/apply-volunteer" 
                        onClick={() => setMobileMenuOpen(false)}
                        className="block no-underline text-blue-600 font-medium px-4 py-2 rounded-lg transition-all duration-300 hover:bg-blue-50"
                      >
                        🤝 Become Volunteer
                      </Link>
                    </li>
                  )}
                  {isVolunteer && (
                    <li>
                      <Link 
                        to="/volunteer" 
                        onClick={() => setMobileMenuOpen(false)}
                        className="block no-underline text-purple-600 font-bold px-4 py-2 rounded-lg transition-all duration-300 hover:bg-purple-50"
                      >
                        🤝 Volunteer Panel
                      </Link>
                    </li>
                  )}
                  {user?.role === 'admin' && (
                    <li>
                      <Link 
                        to="/admin" 
                        onClick={() => setMobileMenuOpen(false)}
                        className="block no-underline text-amber-500 font-bold px-4 py-2 rounded-lg transition-all duration-300 hover:bg-gray-100"
                      >
                        🛡️ Admin Panel
                      </Link>
                    </li>
                  )}
                  <li className="border-t border-gray-200 mt-2 pt-2">
                    <Link 
                      to="/profile" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="block no-underline text-gray-800 font-medium px-4 py-2 rounded-lg transition-all duration-300 hover:bg-gray-100"
                    >
                      Profile
                      {user?.role === 'admin' && <span className="ml-1 text-xs">👑</span>}
                      {user?.role === 'volunteer' && <span className="ml-1 text-xs">🤝</span>}
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to="/change-password" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="block no-underline text-gray-800 font-medium px-4 py-2 rounded-lg transition-all duration-300 hover:bg-gray-100"
                    >
                      Change Password
                    </Link>
                  </li>
                  <li>
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left block text-red-600 font-medium px-4 py-2 rounded-lg transition-all duration-300 hover:bg-gray-100 bg-transparent border-none cursor-pointer text-base"
                    >
                      Logout
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link 
                      to="/login" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="block no-underline text-gray-800 font-medium px-4 py-2 rounded-lg transition-all duration-300 hover:bg-gray-100 hover:text-green-500"
                    >
                      Login
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to="/register" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="block no-underline bg-green-500 text-white font-medium px-4 py-2 rounded-lg transition-all duration-300 hover:bg-green-600 text-center"
                    >
                      Register
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
