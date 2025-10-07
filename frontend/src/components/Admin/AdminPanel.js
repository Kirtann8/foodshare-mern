import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import Loading from '../Common/Loading';
import ErrorMessage from '../Common/ErrorMessage';

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('users');
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalFoods: 0,
    availableFoods: 0
  });

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch users data
      const usersData = await adminAPI.getAllUsers();
      setUsers(usersData.data);
      
      // Fetch food stats
      const foodStats = await adminAPI.getFoodStats();
      
      // Calculate stats
      const activeUserCount = usersData.data.filter(u => u.isActive).length;
      setStats({
        totalUsers: usersData.data.length,
        activeUsers: activeUserCount,
        totalFoods: foodStats.data.totalFoods,
        availableFoods: foodStats.data.availableFoods
      });

      // Fetch all foods if on food tab
      if (activeTab === 'foods') {
        const foodsData = await adminAPI.getAllFoods({ limit: 50 });
        setFoods(foodsData.data);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
      setError(err.error || 'Failed to fetch data. Make sure you are logged in as admin.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      await adminAPI.updateUser(userId, { isActive: !currentStatus });
      fetchData(); // Refresh data
    } catch (err) {
      setError(err.error || 'Failed to update user status');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await adminAPI.deleteUser(userId);
      fetchData(); // Refresh data
    } catch (err) {
      setError(err.error || 'Failed to delete user');
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      await adminAPI.updateUser(userId, { role: newRole });
      fetchData(); // Refresh data
    } catch (err) {
      setError(err.error || 'Failed to change user role');
    }
  };

  const handleDeleteFoodPost = async (foodId, foodTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${foodTitle}"? This will permanently remove it from the database and cannot be undone.`)) {
      return;
    }

    try {
      await adminAPI.deleteFoodPost(foodId);
      setError('');
      // Show success and refresh
      alert('Food post deleted successfully!');
      fetchData(); // Refresh data
    } catch (err) {
      setError(err.error || 'Failed to delete food post');
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-6 sm:p-8 rounded-2xl mb-6 sm:mb-8 shadow-lg">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">🛡️ Admin Panel</h1>
        <p className="text-amber-50 text-sm sm:text-base">Manage users, content, and monitor platform activity</p>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 sm:p-6 rounded-2xl shadow-lg">
          <div className="text-3xl sm:text-4xl mb-2">👥</div>
          <div>
            <h3 className="text-2xl sm:text-3xl font-bold">{stats.totalUsers}</h3>
            <p className="text-blue-100 text-sm sm:text-base">Total Users</p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 sm:p-6 rounded-2xl shadow-lg">
          <div className="text-3xl sm:text-4xl mb-2">✅</div>
          <div>
            <h3 className="text-2xl sm:text-3xl font-bold">{stats.activeUsers}</h3>
            <p className="text-green-100 text-sm sm:text-base">Active Users</p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-4 sm:p-6 rounded-2xl shadow-lg">
          <div className="text-3xl sm:text-4xl mb-2">🍕</div>
          <div>
            <h3 className="text-2xl sm:text-3xl font-bold">{stats.totalFoods}</h3>
            <p className="text-orange-100 text-sm sm:text-base">Food Posts</p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 sm:p-6 rounded-2xl shadow-lg">
          <div className="text-3xl sm:text-4xl mb-2">🟢</div>
          <div>
            <h3 className="text-2xl sm:text-3xl font-bold">{stats.availableFoods}</h3>
            <p className="text-purple-100 text-sm sm:text-base">Available</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row gap-2 mb-6 sm:mb-8 bg-white p-2 rounded-xl shadow-md overflow-x-auto">
        <button 
          className={`flex-1 px-4 sm:px-6 py-3 rounded-lg font-semibold transition-all duration-300 whitespace-nowrap text-sm sm:text-base ${activeTab === 'users' ? 'bg-amber-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`} 
          onClick={() => setActiveTab('users')}
        >
          👥 Users
        </button>
        <button 
          className={`flex-1 px-4 sm:px-6 py-3 rounded-lg font-semibold transition-all duration-300 whitespace-nowrap text-sm sm:text-base ${activeTab === 'foods' ? 'bg-amber-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`} 
          onClick={() => setActiveTab('foods')}
        >
          🍕 Food Posts
        </button>
        <button 
          className={`flex-1 px-4 sm:px-6 py-3 rounded-lg font-semibold transition-all duration-300 whitespace-nowrap text-sm sm:text-base ${activeTab === 'analytics' ? 'bg-amber-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`} 
          onClick={() => setActiveTab('analytics')}
        >
          📊 Analytics
        </button>
        <button 
          className={`flex-1 px-4 sm:px-6 py-3 rounded-lg font-semibold transition-all duration-300 whitespace-nowrap text-sm sm:text-base ${activeTab === 'overview' ? 'bg-amber-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`} 
          onClick={() => setActiveTab('overview')}
        >
          � Overview
        </button>
      </div>

      {/* Users Management Tab */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">User Management</h2>
            <button className="bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-all duration-300 text-sm sm:text-base" onClick={fetchData}>
              🔄 Refresh
            </button>
          </div>

          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Email</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Phone</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Joined</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-50">
                        <td className="px-3 sm:px-6 py-4 text-sm font-medium text-gray-900">
                          <div className="flex flex-col">
                            <span>{user.name}</span>
                            <span className="text-xs text-gray-500 sm:hidden">{user.email}</span>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 text-sm text-gray-500 hidden sm:table-cell">{user.email}</td>
                        <td className="px-3 sm:px-6 py-4 text-sm text-gray-500">
                          <select
                            value={user.role}
                            onChange={(e) => handleChangeRole(user._id, e.target.value)}
                            className="px-2 sm:px-3 py-1.5 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="px-3 sm:px-6 py-4 text-sm text-gray-500 hidden lg:table-cell">{user.phone}</td>
                        <td className="px-3 sm:px-6 py-4">
                          <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {user.isActive ? '✅' : '❌'}
                            <span className="hidden sm:inline ml-1">{user.isActive ? 'Active' : 'Inactive'}</span>
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-4 text-sm text-gray-500 hidden md:table-cell">{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td className="px-3 sm:px-6 py-4 text-sm font-medium">
                          <div className="flex gap-1 sm:gap-2">
                            <button
                              className={`px-2 sm:px-3 py-1.5 rounded-lg text-white font-medium transition-all duration-300 text-xs sm:text-sm ${user.isActive ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'}`}
                              onClick={() => handleToggleUserStatus(user._id, user.isActive)}
                              title={user.isActive ? 'Deactivate' : 'Activate'}
                            >
                              {user.isActive ? '🔒' : '🔓'}
                            </button>
                            <button
                              className="px-2 sm:px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-all duration-300 text-xs sm:text-sm"
                              onClick={() => handleDeleteUser(user._id)}
                              title="Delete User"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Food Posts Management Tab */}
      {activeTab === 'foods' && (
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Food Posts Management</h2>
            <button className="bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-all duration-300 text-sm sm:text-base" onClick={fetchData}>
              🔄 Refresh
            </button>
          </div>

          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 sm:px-6 py-4 rounded-lg mb-6 text-sm sm:text-base">
            <p>⚠️ <strong>Admin Power:</strong> You can delete any inappropriate or spam food posts. This action is permanent and will remove the post from the database.</p>
          </div>

          {foods.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-base sm:text-lg">No food posts found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <div className="overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Donor</th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Category</th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Location</th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Posted</th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {foods.map((food) => (
                        <tr key={food._id} className="hover:bg-gray-50">
                          <td className="px-3 sm:px-6 py-4">
                            <div className="flex flex-col">
                              <strong className="text-gray-900 text-sm">{food.title}</strong>
                              {!food.isActive && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 mt-1 self-start">Inactive</span>}
                              <span className="text-xs text-gray-500 lg:hidden mt-1">{food.donor?.name || 'Unknown'}</span>
                              <span className="text-xs text-gray-500 md:hidden mt-1">{food.category}</span>
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-4 text-sm text-gray-500 hidden lg:table-cell">
                            <div className="text-gray-900">{food.donor?.name || 'Unknown'}</div>
                            <div className="text-gray-500 text-xs">{food.donor?.email}</div>
                          </td>
                          <td className="px-3 sm:px-6 py-4 text-sm text-gray-500 hidden md:table-cell">{food.category}</td>
                          <td className="px-3 sm:px-6 py-4">
                            <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                              food.claimStatus === 'available' ? 'bg-green-100 text-green-800' : 
                              food.claimStatus === 'claimed' ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {food.claimStatus === 'available' && '🟢'}
                              {food.claimStatus === 'claimed' && '🟡'}
                              {food.claimStatus === 'completed' && '✅'}
                              <span className="hidden sm:inline ml-1">
                                {food.claimStatus === 'available' && 'Available'}
                                {food.claimStatus === 'claimed' && 'Claimed'}
                                {food.claimStatus === 'completed' && 'Completed'}
                              </span>
                            </span>
                          </td>
                          <td className="px-3 sm:px-6 py-4 text-sm text-gray-500 hidden sm:table-cell">
                            {food.location?.city}, {food.location?.state}
                          </td>
                          <td className="px-3 sm:px-6 py-4 text-sm text-gray-500 hidden lg:table-cell">{new Date(food.createdAt).toLocaleDateString()}</td>
                          <td className="px-3 sm:px-6 py-4 text-sm font-medium">
                            <button
                              className="px-2 sm:px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-all duration-300 text-xs sm:text-sm whitespace-nowrap"
                              onClick={() => handleDeleteFoodPost(food._id, food.title)}
                              title="Delete Post"
                            >
                              🗑️ <span className="hidden sm:inline">Delete</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Platform Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 rounded-xl border border-indigo-200">
              <h3 className="text-xl font-bold text-indigo-900 mb-3">Recent Activity</h3>
              <p className="text-indigo-700">Coming soon: Recent user registrations, food posts, and claims</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
              <h3 className="text-xl font-bold text-green-900 mb-3">System Health</h3>
              <p className="text-green-700">✅ All systems operational</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
