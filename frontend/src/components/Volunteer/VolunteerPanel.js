import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI, communicationAPI } from '../../services/api';
import AuthContext from '../../context/AuthContext';
import Loading from '../Common/Loading';
import ErrorMessage from '../Common/ErrorMessage';
import { toast } from 'react-toastify';

const VolunteerPanel = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('pending');
  const [pendingPosts, setPendingPosts] = useState([]);
  const [assignedPosts, setAssignedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [stats, setStats] = useState({
    pendingCount: 0,
    assignedCount: 0,
    approvedToday: 0
  });

  useEffect(() => {
    fetchData();
  }, [activeTab, fetchData]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      if (activeTab === 'pending') {
        const response = await adminAPI.getPendingFoodPosts(1, 20);
        setPendingPosts(response.data);
        setStats(prev => ({ ...prev, pendingCount: response.total }));
      } else if (activeTab === 'assigned') {
        // Get food posts assigned to current volunteer
        const response = await adminAPI.getAssignedFoods();
        setAssignedPosts(response.data);
        setStats(prev => ({ ...prev, assignedCount: response.total }));
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.error || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  const handleApprove = async (postId) => {
    try {
      await adminAPI.approveFoodPost(postId);
      toast.success('Food post approved successfully!');
      fetchData();
    } catch (err) {
      toast.error(err.error || 'Failed to approve post');
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      await adminAPI.rejectFoodPost(selectedPostId, rejectionReason);
      toast.success('Food post rejected successfully!');
      setShowRejectModal(false);
      setRejectionReason('');
      setSelectedPostId(null);
      fetchData();
    } catch (err) {
      toast.error(err.error || 'Failed to reject post');
    }
  };

  const handleUpdateCollectionStatus = async (postId, status, notes, distributionDetails) => {
    try {
      await adminAPI.updateCollectionStatus(postId, status, notes, distributionDetails);
      toast.success(`Collection status updated to ${status}`);
      fetchData();
    } catch (err) {
      toast.error(err.error || 'Failed to update status');
    }
  };



  const openRejectModal = (postId) => {
    setSelectedPostId(postId);
    setShowRejectModal(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) return <Loading />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 sm:p-8 rounded-2xl mb-6 sm:mb-8 shadow-lg">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">🤝 Volunteer Panel</h1>
        <p className="text-purple-50 text-sm sm:text-base">Help moderate food posts and assist with community food distribution</p>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-4 sm:p-6 rounded-2xl shadow-lg">
          <div className="text-3xl sm:text-4xl mb-2">⏳</div>
          <div>
            <h3 className="text-2xl sm:text-3xl font-bold">{stats.pendingCount}</h3>
            <p className="text-orange-100 text-sm sm:text-base">Pending Posts</p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 sm:p-6 rounded-2xl shadow-lg">
          <div className="text-3xl sm:text-4xl mb-2">📋</div>
          <div>
            <h3 className="text-2xl sm:text-3xl font-bold">{stats.assignedCount}</h3>
            <p className="text-blue-100 text-sm sm:text-base">Assigned to Me</p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 sm:p-6 rounded-2xl shadow-lg">
          <div className="text-3xl sm:text-4xl mb-2">✅</div>
          <div>
            <h3 className="text-2xl sm:text-3xl font-bold">{stats.approvedToday}</h3>
            <p className="text-green-100 text-sm sm:text-base">Approved Today</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row gap-2 mb-6 sm:mb-8 bg-white p-2 rounded-xl shadow-md">
        <button 
          className={`flex-1 px-4 sm:px-6 py-3 rounded-lg font-semibold transition-all duration-300 text-sm sm:text-base ${
            activeTab === 'pending' ? 'bg-purple-500 text-white' : 'text-gray-700 hover:bg-gray-100'
          }`} 
          onClick={() => setActiveTab('pending')}
        >
          ⏳ Pending Posts {stats.pendingCount > 0 && <span className="ml-1 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{stats.pendingCount}</span>}
        </button>
        <button 
          className={`flex-1 px-4 sm:px-6 py-3 rounded-lg font-semibold transition-all duration-300 text-sm sm:text-base ${
            activeTab === 'assigned' ? 'bg-purple-500 text-white' : 'text-gray-700 hover:bg-gray-100'
          }`} 
          onClick={() => setActiveTab('assigned')}
        >
          📋 My Collections
        </button>
        <button 
          className={`flex-1 px-4 sm:px-6 py-3 rounded-lg font-semibold transition-all duration-300 text-sm sm:text-base ${
            activeTab === 'assignments' ? 'bg-purple-500 text-white' : 'text-gray-700 hover:bg-gray-100'
          }`} 
          onClick={() => navigate('/volunteer/assignments')}
        >
          🚚 My Assignments
        </button>
        <button 
          className={`flex-1 px-4 sm:px-6 py-3 rounded-lg font-semibold transition-all duration-300 text-sm sm:text-base ${
            activeTab === 'approvals' ? 'bg-purple-500 text-white' : 'text-gray-700 hover:bg-gray-100'
          }`} 
          onClick={() => navigate('/admin/food-approval')}
        >
          ✅ Food Approvals
        </button>
      </div>

      {/* Pending Posts Tab */}
      {activeTab === 'pending' && (
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Pending Food Posts</h2>
            <button 
              className="bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-all duration-300 text-sm sm:text-base" 
              onClick={fetchData}
            >
              🔄 Refresh
            </button>
          </div>

          {pendingPosts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">✅</div>
              <p className="text-base sm:text-lg">No pending posts to review!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {pendingPosts.map((post) => (
                <div key={post._id} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Post Images */}
                    {post.images && post.images.length > 0 && (
                      <div className="lg:w-1/3">
                        <img 
                          src={post.images[0]} 
                          alt={post.title}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      </div>
                    )}
                    
                    {/* Post Details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">{post.title}</h3>
                          <p className="text-gray-600 mb-2">{post.description}</p>
                          <div className="flex flex-wrap gap-2 mb-3">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">
                              {post.category}
                            </span>
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium">
                              {post.quantity}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h4 className="font-medium text-gray-700 mb-1">Donor:</h4>
                          <p className="text-gray-600">{post.donor?.name}</p>
                          <p className="text-gray-500 text-sm">{post.donor?.email}</p>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-700 mb-1">Location:</h4>
                          <p className="text-gray-600">{post.location?.address}</p>
                          <p className="text-gray-500 text-sm">{post.location?.city}, {post.location?.state}</p>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-700 mb-1">Pickup Time:</h4>
                          <p className="text-gray-600 text-sm">
                            {formatDate(post.pickupTiming?.startTime)} - {formatDate(post.pickupTiming?.endTime)}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-700 mb-1">Expiry:</h4>
                          <p className="text-gray-600 text-sm">{formatDate(post.expiryDate)}</p>
                        </div>
                      </div>
                      
                      {/* Dietary Info */}
                      {(post.dietaryInfo?.isVegetarian || post.dietaryInfo?.isVegan || post.dietaryInfo?.isGlutenFree || post.dietaryInfo?.containsNuts) && (
                        <div className="mb-4">
                          <h4 className="font-medium text-gray-700 mb-2">Dietary Information:</h4>
                          <div className="flex flex-wrap gap-2">
                            {post.dietaryInfo.isVegetarian && <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">🥬 Vegetarian</span>}
                            {post.dietaryInfo.isVegan && <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">🌱 Vegan</span>}
                            {post.dietaryInfo.isGlutenFree && <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">🌾 Gluten-Free</span>}
                            {post.dietaryInfo.containsNuts && <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">🥜 Contains Nuts</span>}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="lg:w-48 flex flex-col gap-3">
                      <button
                        onClick={() => handleApprove(post._id)}
                        className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all duration-300 flex items-center justify-center gap-2"
                      >
                        ✅ Approve
                      </button>
                      <button
                        onClick={() => openRejectModal(post._id)}
                        className="w-full px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all duration-300 flex items-center justify-center gap-2"
                      >
                        ❌ Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Assigned Collections Tab */}
      {activeTab === 'assigned' && (
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">My Assigned Collections</h2>
            <button 
              className="bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-all duration-300 text-sm sm:text-base" 
              onClick={fetchData}
            >
              🔄 Refresh
            </button>
          </div>

          {assignedPosts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">📋</div>
              <p className="text-base sm:text-lg">No collections assigned to you yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {assignedPosts.map((post) => (
                <div key={post._id || post.assignmentId} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Food Image */}
                    {post.images && post.images.length > 0 && (
                      <div className="lg:w-1/4">
                        <img 
                          src={post.images[0]} 
                          alt={post.title}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">{post.title}</h3>
                          <p className="text-gray-600 mb-2 text-sm">{post.description}</p>
                          <div className="flex flex-wrap gap-2 mb-3">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">
                              {post.category}
                            </span>
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium">
                              {post.quantity}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              post.collectionStatus === 'assigned' ? 'bg-yellow-100 text-yellow-800' :
                              post.collectionStatus === 'collected' ? 'bg-blue-100 text-blue-800' :
                              post.collectionStatus === 'distributed' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {post.collectionStatus === 'assigned' && '📋 Assigned'}
                              {post.collectionStatus === 'collected' && '📦 Collected'}
                              {post.collectionStatus === 'distributed' && '✅ Distributed'}
                              {!post.collectionStatus && '⏳ Pending'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h4 className="font-medium text-gray-700 mb-1">Donor Contact:</h4>
                          <p className="text-gray-600">{post.donor?.name || 'Contact not available'}</p>
                          <p className="text-gray-500 text-sm">{post.donor?.email || 'Email not available'}</p>
                          <p className="text-gray-500 text-sm">{post.donor?.phone || 'Phone not available'}</p>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-700 mb-1">Pickup Location:</h4>
                          <p className="text-gray-600 text-sm">{post.location?.address || 'Address not available'}</p>
                          <p className="text-gray-500 text-sm">{post.location?.city || 'City not available'}, {post.location?.state || 'State not available'}</p>
                          {post.location?.zipCode && <p className="text-gray-500 text-sm">ZIP: {post.location.zipCode}</p>}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-700 mb-1">Pickup Time:</h4>
                          <p className="text-gray-600 text-sm">
                            {post.pickupTiming?.startTime ? formatDate(post.pickupTiming.startTime) : 'N/A'} - 
                            {post.pickupTiming?.endTime ? formatDate(post.pickupTiming.endTime) : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-700 mb-1">Assignment Status:</h4>
                          <p className="text-gray-600 text-sm">{post.assignmentStatus || 'assigned'}</p>
                          {post.assignedAt && <p className="text-gray-500 text-xs">Assigned: {formatDate(post.assignedAt)}</p>}
                        </div>
                      </div>
                    </div>
                    
                    {/* Status Update Buttons */}
                    <div className="lg:w-48 flex flex-col gap-3">
                      {post.collectionStatus === 'assigned' && (
                        <>
                          <button
                            onClick={() => handleUpdateCollectionStatus(post._id, 'collected')}
                            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all duration-300"
                          >
                            📦 Mark Collected
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Please provide a reason for rejecting this assignment:');
                              if (reason && reason.trim()) {
                                // Handle rejection logic here
                                alert('Assignment rejection functionality will be implemented');
                              }
                            }}
                            className="w-full px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all duration-300"
                          >
                            ❌ Reject Assignment
                          </button>
                        </>
                      )}
                      {post.collectionStatus === 'collected' && (
                        <button
                          onClick={() => handleUpdateCollectionStatus(post._id, 'distributed')}
                          className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all duration-300"
                        >
                          ✅ Mark Distributed
                        </button>
                      )}
                      {post.collectionStatus === 'distributed' && (
                        <div className="w-full px-4 py-3 bg-green-100 text-green-800 rounded-lg font-medium text-center">
                          ✅ Completed
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Reject Food Post</h3>
            <p className="text-gray-600 mb-4">Please provide a reason for rejecting this post:</p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              rows={4}
              maxLength={500}
            />
            <div className="text-right text-sm text-gray-500 mb-4">
              {rejectionReason.length}/500
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                  setSelectedPostId(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-400 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all duration-300"
              >
                Reject Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VolunteerPanel;