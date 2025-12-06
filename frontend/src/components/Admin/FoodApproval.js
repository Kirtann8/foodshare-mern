import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';
import Loading from '../Common/Loading';

const FoodApproval = () => {
  const [pendingFoods, setPendingFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [selectedFood, setSelectedFood] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    fetchPendingFoods();
  }, []);

  const fetchPendingFoods = async () => {
    try {
      const response = await api.get('/food/admin/pending');
      setPendingFoods(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch pending food posts');
      console.error('Error fetching pending foods:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (foodId) => {
    setActionLoading(prev => ({ ...prev, [foodId]: true }));
    try {
      await api.put(`/food/admin/${foodId}/approve`);
      toast.success('Food post approved successfully');
      setPendingFoods(prev => prev.filter(food => food._id !== foodId));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve food post');
    } finally {
      setActionLoading(prev => ({ ...prev, [foodId]: false }));
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setActionLoading(prev => ({ ...prev, [selectedFood._id]: true }));
    try {
      await api.put(`/food/admin/${selectedFood._id}/reject`, {
        reason: rejectionReason
      });
      toast.success('Food post rejected successfully');
      setPendingFoods(prev => prev.filter(food => food._id !== selectedFood._id));
      setShowRejectModal(false);
      setRejectionReason('');
      setSelectedFood(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject food post');
    } finally {
      setActionLoading(prev => ({ ...prev, [selectedFood._id]: false }));
    }
  };

  const openRejectModal = (food) => {
    setSelectedFood(food);
    setShowRejectModal(true);
  };

  const closeRejectModal = () => {
    setShowRejectModal(false);
    setRejectionReason('');
    setSelectedFood(null);
  };

  if (loading) return <Loading />;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Food Approval</h1>
        <p className="text-gray-600 mt-2">Review and approve pending food donations</p>
      </div>

      {pendingFoods.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">✅</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">All caught up!</h3>
          <p className="text-gray-500">No pending food posts to review.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {pendingFoods.map((food) => (
            <div key={food._id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{food.title}</h3>
                    <p className="text-gray-600 mb-3">{food.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Category:</span>
                        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {food.category}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Quantity:</span>
                        <span className="ml-2 text-gray-600">{food.quantity}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Donor:</span>
                        <span className="ml-2 text-gray-600">{food.donor?.name}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Location:</span>
                        <span className="ml-2 text-gray-600">{food.location?.city}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Expiry:</span>
                        <span className="ml-2 text-gray-600">
                          {new Date(food.expiryDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Posted:</span>
                        <span className="ml-2 text-gray-600">
                          {new Date(food.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {food.dietaryInfo && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {food.dietaryInfo.isVegetarian && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                            Vegetarian
                          </span>
                        )}
                        {food.dietaryInfo.isVegan && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                            Vegan
                          </span>
                        )}
                        {food.dietaryInfo.isGlutenFree && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                            Gluten Free
                          </span>
                        )}
                        {food.dietaryInfo.containsNuts && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                            Contains Nuts
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {food.images && food.images.length > 0 && (
                    <div className="ml-6 flex-shrink-0">
                      <img
                        src={food.images[0]}
                        alt={food.title}
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => openRejectModal(food)}
                    disabled={actionLoading[food._id]}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {actionLoading[food._id] ? 'Processing...' : 'Reject'}
                  </button>
                  <button
                    onClick={() => handleApprove(food._id)}
                    disabled={actionLoading[food._id]}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {actionLoading[food._id] ? 'Processing...' : 'Approve'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Reject Food Post
            </h3>
            <p className="text-gray-600 mb-4">
              Please provide a reason for rejecting "{selectedFood?.title}":
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              rows="4"
            />
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={closeRejectModal}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading[selectedFood?._id] || !rejectionReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {actionLoading[selectedFood?._id] ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FoodApproval;