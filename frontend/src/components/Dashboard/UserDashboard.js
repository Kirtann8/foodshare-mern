import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { foodAPI } from '../../services/api';
import AuthContext from '../../context/AuthContext';
import Loading from '../Common/Loading';
import ErrorMessage from '../Common/ErrorMessage';

const UserDashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    myDonations: 0,
    myClaims: 0,
    availableFood: 0,
    completedDonations: 0
  });
  const [recentDonations, setRecentDonations] = useState([]);
  const [recentClaims, setRecentClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch user's donations
      const donationsResponse = await foodAPI.getMyDonations();
      const donations = donationsResponse.data;
      
      // Fetch user's claims
      const claimsResponse = await foodAPI.getMyClaims();
      const claims = claimsResponse.data;

      // Fetch available food count
      const availableFoodResponse = await foodAPI.getFoods({ limit: 1 });
      
      // Calculate stats
      const completedDonations = donations.filter(d => d.claimStatus === 'completed').length;
      
      setStats({
        myDonations: donations.length,
        myClaims: claims.length,
        availableFood: availableFoodResponse.total || 0,
        completedDonations
      });

      // Set recent items (last 3)
      setRecentDonations(donations.slice(0, 3));
      setRecentClaims(claims.slice(0, 3));

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      available: 'bg-green-100 text-green-800',
      claimed: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-blue-100 text-blue-800',
      expired: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) return <Loading />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 sm:p-8 rounded-2xl mb-6 sm:mb-8 shadow-lg">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">Welcome back, {user?.name}! 👋</h1>
        <p className="text-green-50 text-sm sm:text-base">Here's your food sharing activity overview</p>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 sm:p-6 rounded-2xl shadow-lg">
          <div className="text-3xl sm:text-4xl mb-2">🍽️</div>
          <div>
            <h3 className="text-2xl sm:text-3xl font-bold">{stats.myDonations}</h3>
            <p className="text-blue-100 text-sm sm:text-base">My Donations</p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 sm:p-6 rounded-2xl shadow-lg">
          <div className="text-3xl sm:text-4xl mb-2">🤝</div>
          <div>
            <h3 className="text-2xl sm:text-3xl font-bold">{stats.myClaims}</h3>
            <p className="text-green-100 text-sm sm:text-base">My Claims</p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 sm:p-6 rounded-2xl shadow-lg">
          <div className="text-3xl sm:text-4xl mb-2">🌟</div>
          <div>
            <h3 className="text-2xl sm:text-3xl font-bold">{stats.availableFood}</h3>
            <p className="text-purple-100 text-sm sm:text-base">Available Food</p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-4 sm:p-6 rounded-2xl shadow-lg">
          <div className="text-3xl sm:text-4xl mb-2">✅</div>
          <div>
            <h3 className="text-2xl sm:text-3xl font-bold">{stats.completedDonations}</h3>
            <p className="text-orange-100 text-sm sm:text-base">Completed</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/share-food"
            className="flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-xl border border-green-200 transition-all duration-300 group"
          >
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white text-xl group-hover:scale-110 transition-transform">
              🍽️
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Share Food</h3>
              <p className="text-sm text-gray-600">Donate food to help others</p>
            </div>
          </Link>
          
          <Link
            to="/browse-food"
            className="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 transition-all duration-300 group"
          >
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl group-hover:scale-110 transition-transform">
              🔍
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Browse Food</h3>
              <p className="text-sm text-gray-600">Find available food near you</p>
            </div>
          </Link>
          
          <Link
            to="/my-donations"
            className="flex items-center gap-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-xl border border-purple-200 transition-all duration-300 group"
          >
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white text-xl group-hover:scale-110 transition-transform">
              📋
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">My Donations</h3>
              <p className="text-sm text-gray-600">Manage your food posts</p>
            </div>
          </Link>
          
          <Link
            to="/my-claims"
            className="flex items-center gap-3 p-4 bg-orange-50 hover:bg-orange-100 rounded-xl border border-orange-200 transition-all duration-300 group"
          >
            <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white text-xl group-hover:scale-110 transition-transform">
              🤝
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">My Claims</h3>
              <p className="text-sm text-gray-600">View claimed food items</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Donations */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Recent Donations</h2>
            <Link to="/my-donations" className="text-green-600 hover:text-green-700 font-medium text-sm">
              View All →
            </Link>
          </div>
          
          {recentDonations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">🍽️</div>
              <p>No donations yet</p>
              <Link to="/share-food" className="text-green-600 hover:text-green-700 font-medium">
                Share your first food item
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentDonations.map((donation) => (
                <div key={donation._id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center">
                    {donation.images && donation.images.length > 0 ? (
                      <img 
                        src={donation.images[0]} 
                        alt={donation.title}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <span className="text-2xl">🍽️</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{donation.title}</h3>
                    <p className="text-sm text-gray-600">{donation.category} • {donation.quantity}</p>
                    <p className="text-xs text-gray-500">{formatDate(donation.createdAt)}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(donation.claimStatus)}`}>
                    {donation.claimStatus}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Claims */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Recent Claims</h2>
            <Link to="/my-claims" className="text-blue-600 hover:text-blue-700 font-medium text-sm">
              View All →
            </Link>
          </div>
          
          {recentClaims.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">🤝</div>
              <p>No claims yet</p>
              <Link to="/browse-food" className="text-blue-600 hover:text-blue-700 font-medium">
                Browse available food
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentClaims.map((claim) => (
                <div key={claim._id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                    {claim.images && claim.images.length > 0 ? (
                      <img 
                        src={claim.images[0]} 
                        alt={claim.title}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <span className="text-2xl">🍽️</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{claim.title}</h3>
                    <p className="text-sm text-gray-600">From: {claim.donor?.name}</p>
                    <p className="text-xs text-gray-500">{formatDate(claim.claimedAt)}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(claim.claimStatus)}`}>
                    {claim.claimStatus}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Impact Section */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl p-6 sm:p-8 shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Your Impact 🌟</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold mb-1">{stats.completedDonations}</div>
            <p className="text-indigo-100">Successful Donations</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold mb-1">{stats.myClaims}</div>
            <p className="text-indigo-100">Food Items Rescued</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold mb-1">{Math.round((stats.completedDonations + stats.myClaims) * 2.5)}</div>
            <p className="text-indigo-100">Estimated Meals Saved</p>
          </div>
        </div>
        <p className="text-center text-indigo-100 mt-6">
          Thank you for helping reduce food waste and supporting your community! 💚
        </p>
      </div>
    </div>
  );
};

export default UserDashboard;