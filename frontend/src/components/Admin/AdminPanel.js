import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import Loading from '../Common/Loading';
import ErrorMessage from '../Common/ErrorMessage';
import './Admin.css';

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
    <div className="admin-panel">
      <div className="admin-header">
        <h1>🛡️ Admin Panel</h1>
        <p>Manage users, content, and monitor platform activity</p>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Stats Dashboard */}
      <div className="stats-dashboard">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>{stats.totalUsers}</h3>
            <p>Total Users</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <h3>{stats.activeUsers}</h3>
            <p>Active Users</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🍕</div>
          <div className="stat-info">
            <h3>{stats.totalFoods}</h3>
            <p>Food Posts</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🟢</div>
          <div className="stat-info">
            <h3>{stats.availableFoods}</h3>
            <p>Available</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button 
          className={activeTab === 'users' ? 'active' : ''} 
          onClick={() => setActiveTab('users')}
        >
          👥 Users Management
        </button>
        <button 
          className={activeTab === 'foods' ? 'active' : ''} 
          onClick={() => setActiveTab('foods')}
        >
          🍕 Food Posts Management
        </button>
        <button 
          className={activeTab === 'overview' ? 'active' : ''} 
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
      </div>

      {/* Users Management Tab */}
      {activeTab === 'users' && (
        <div className="admin-content">
          <div className="content-header">
            <h2>User Management</h2>
            <button className="btn btn-secondary" onClick={fetchData}>
              🔄 Refresh
            </button>
          </div>

          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <select
                        value={user.role}
                        onChange={(e) => handleChangeRole(user._id, e.target.value)}
                        className="role-select"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>{user.phone}</td>
                    <td>
                      <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                        {user.isActive ? '✅ Active' : '❌ Inactive'}
                      </span>
                    </td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="action-buttons">
                      <button
                        className={`btn-small ${user.isActive ? 'btn-warning' : 'btn-success'}`}
                        onClick={() => handleToggleUserStatus(user._id, user.isActive)}
                        title={user.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {user.isActive ? '🔒' : '🔓'}
                      </button>
                      <button
                        className="btn-small btn-danger"
                        onClick={() => handleDeleteUser(user._id)}
                        title="Delete User"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Food Posts Management Tab */}
      {activeTab === 'foods' && (
        <div className="admin-content">
          <div className="content-header">
            <h2>Food Posts Management</h2>
            <button className="btn btn-secondary" onClick={fetchData}>
              🔄 Refresh
            </button>
          </div>

          <div className="info-message">
            <p>⚠️ <strong>Admin Power:</strong> You can delete any inappropriate or spam food posts. This action is permanent and will remove the post from the database.</p>
          </div>

          {foods.length === 0 ? (
            <div className="no-results">
              <p>No food posts found.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Donor</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Location</th>
                    <th>Posted</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {foods.map((food) => (
                    <tr key={food._id}>
                      <td>
                        <strong>{food.title}</strong>
                        {!food.isActive && <span className="inactive-badge">Inactive</span>}
                      </td>
                      <td>
                        {food.donor?.name || 'Unknown'}
                        <br />
                        <small>{food.donor?.email}</small>
                      </td>
                      <td>{food.category}</td>
                      <td>
                        <span className={`status-badge ${food.claimStatus === 'available' ? 'available' : food.claimStatus === 'claimed' ? 'claimed' : 'completed'}`}>
                          {food.claimStatus === 'available' && '🟢 Available'}
                          {food.claimStatus === 'claimed' && '🟡 Claimed'}
                          {food.claimStatus === 'completed' && '✅ Completed'}
                        </span>
                      </td>
                      <td>
                        {food.location?.city}, {food.location?.state}
                      </td>
                      <td>{new Date(food.createdAt).toLocaleDateString()}</td>
                      <td className="action-buttons">
                        <button
                          className="btn-small btn-danger"
                          onClick={() => handleDeleteFoodPost(food._id, food.title)}
                          title="Delete Post"
                        >
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="admin-content">
          <h2>Platform Overview</h2>
          <div className="overview-section">
            <div className="overview-card">
              <h3>Recent Activity</h3>
              <p>Coming soon: Recent user registrations, food posts, and claims</p>
            </div>
            <div className="overview-card">
              <h3>System Health</h3>
              <p>✅ All systems operational</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
