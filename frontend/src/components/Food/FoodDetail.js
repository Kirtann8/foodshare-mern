import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import { foodAPI } from '../../services/api';
import Loading from '../Common/Loading';
import ChatButton from '../Chat/ChatButton';

const FoodDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useContext(AuthContext);
  
  const [food, setFood] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchFoodDetail = useCallback(async () => {
    try {
      setLoading(true);
      const data = await foodAPI.getFood(id);
      setFood(data.data);
    } catch (err) {
      setError(err.error || 'Failed to fetch food details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchFoodDetail();
  }, [fetchFoodDetail]);

  const handleClaim = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      setActionLoading(true);
      await foodAPI.claimFood(id);
      fetchFoodDetail(); // Refresh data
      alert('Food claimed successfully!');
    } catch (err) {
      alert(err.error || 'Failed to claim food');
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    try {
      setActionLoading(true);
      await foodAPI.completeFood(id);
      fetchFoodDetail(); // Refresh data
      alert('Food marked as completed!');
    } catch (err) {
      alert(err.error || 'Failed to complete food');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this food post?')) {
      try {
        await foodAPI.deleteFood(id);
        navigate('/my-donations');
      } catch (err) {
        alert(err.error || 'Failed to delete food');
      }
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      available: '#10b981',
      claimed: '#f59e0b',
      completed: '#3b82f6',
      expired: '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  if (loading) return <Loading />;
  if (error) return <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">{error}</div>;
  if (!food) return <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">Food not found</div>;

  const isDonor = user && user.id === food.donor._id;
  const canClaim = isAuthenticated && food.claimStatus === 'available' && !isDonor;
  const canComplete = isDonor && food.claimStatus === 'claimed';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="p-4 sm:p-6 lg:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800">{food.title}</h1>
          <span 
            className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-semibold uppercase text-white whitespace-nowrap" 
            style={{ backgroundColor: getStatusColor(food.claimStatus) }}
          >
            {food.claimStatus}
          </span>
        </div>

        {food.images && food.images.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 p-4 sm:p-6 lg:p-8 bg-gray-50">
            {food.images.map((image, index) => (
              <img
                key={index}
                src={image.startsWith('http') ? image : `${process.env.REACT_APP_API_URL.replace('/api', '')}${image}`}
                alt={`${food.title} ${index + 1}`}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/600x400?text=Food+Image';
                }}
                className="w-full h-48 sm:h-56 lg:h-64 object-cover rounded-lg"
              />
            ))}
          </div>
        )}

        <div className="p-4 sm:p-6 lg:p-8">
          <section className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">Description</h2>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">{food.description}</p>
          </section>

          <section className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">Details</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="flex flex-col gap-1">
                <strong className="text-gray-600 text-xs sm:text-sm font-semibold">Category:</strong>
                <span className="text-gray-800 text-sm sm:text-base">{food.category}</span>
              </div>
              <div className="flex flex-col gap-1">
                <strong className="text-gray-600 text-xs sm:text-sm font-semibold">Quantity:</strong>
                <span className="text-gray-800 text-sm sm:text-base">{food.quantity}</span>
              </div>
              <div className="flex flex-col gap-1">
                <strong className="text-gray-600 text-xs sm:text-sm font-semibold">Expiry Date:</strong>
                <span className="text-gray-800 text-xs sm:text-sm">{formatDate(food.expiryDate)}</span>
              </div>
              <div className="flex flex-col gap-1">
                <strong className="text-gray-600 text-xs sm:text-sm font-semibold">Views:</strong>
                <span className="text-gray-800 text-sm sm:text-base">{food.views}</span>
              </div>
            </div>
          </section>

          <section className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">Pickup Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="flex flex-col gap-1">
                <strong className="text-gray-600 text-xs sm:text-sm font-semibold">Start Time:</strong>
                <span className="text-gray-800 text-xs sm:text-base">{formatDate(food.pickupTiming.startTime)}</span>
              </div>
              <div className="flex flex-col gap-1">
                <strong className="text-gray-600 text-xs sm:text-sm font-semibold">End Time:</strong>
                <span className="text-gray-800 text-xs sm:text-base">{formatDate(food.pickupTiming.endTime)}</span>
              </div>
            </div>
          </section>

          <section className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">Location</h2>
            <div className="text-sm sm:text-base text-gray-700">
              <p className="mb-2">{food.location.address}</p>
              <p>{food.location.city}, {food.location.state} {food.location.zipCode}</p>
            </div>
          </section>

          <section className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">Dietary Information</h2>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {food.dietaryInfo?.isVegetarian && <span className="bg-green-50 text-green-700 px-2 sm:px-3 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-medium">🥬 Vegetarian</span>}
              {food.dietaryInfo?.isVegan && <span className="bg-green-50 text-green-700 px-2 sm:px-3 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-medium">🌱 Vegan</span>}
              {food.dietaryInfo?.isGlutenFree && <span className="bg-green-50 text-green-700 px-2 sm:px-3 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-medium">🌾 Gluten-Free</span>}
              {food.dietaryInfo?.containsNuts && <span className="bg-green-50 text-green-700 px-2 sm:px-3 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-medium">🥜 Contains Nuts</span>}
              {!food.dietaryInfo?.isVegetarian && !food.dietaryInfo?.isVegan && 
               !food.dietaryInfo?.isGlutenFree && !food.dietaryInfo?.containsNuts && (
                <span className="text-sm sm:text-base text-gray-600">No special dietary information</span>
              )}
            </div>
          </section>

          <section className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">Donor Information</h2>
            <div className="text-sm sm:text-base text-gray-700">
              <p className="mb-2"><strong>Name:</strong> {food.donor.name}</p>
              <p className="mb-2"><strong>Email:</strong> {food.donor.email}</p>
              {food.donor.phone && <p className="mb-2"><strong>Phone:</strong> {food.donor.phone}</p>}
            </div>
          </section>

          {food.claimedBy && (
            <section className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">Claimed By</h2>
              <div className="text-sm sm:text-base text-gray-700">
                <p className="mb-2"><strong>Name:</strong> {food.claimedBy.name}</p>
                <p className="mb-2"><strong>Email:</strong> {food.claimedBy.email}</p>
                {food.claimedBy.phone && <p className="mb-2"><strong>Phone:</strong> {food.claimedBy.phone}</p>}
                <p className="mb-2"><strong>Claimed At:</strong> {formatDate(food.claimedAt)}</p>
              </div>
            </section>
          )}

          <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-200">
            {canClaim && (
              <>
                <button 
                  className="w-full sm:w-auto bg-green-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-green-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base" 
                  onClick={handleClaim}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Claiming...' : 'Claim This Food'}
                </button>
                <div className="w-full sm:w-auto">
                  <ChatButton foodPostId={food._id} donorId={food.donor._id} />
                </div>
              </>
            )}

            {canComplete && (
              <button 
                className="w-full sm:w-auto bg-blue-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-blue-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base" 
                onClick={handleComplete}
                disabled={actionLoading}
              >
                {actionLoading ? 'Completing...' : 'Mark as Completed'}
              </button>
            )}

            {isDonor && (
              <>
                <Link to={`/food/edit/${food._id}`} className="w-full sm:w-auto text-center bg-gray-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-gray-600 transition-all duration-300 no-underline text-sm sm:text-base">
                  Edit
                </Link>
                <button className="w-full sm:w-auto bg-red-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-red-600 transition-all duration-300 text-sm sm:text-base" onClick={handleDelete}>
                  Delete
                </button>
              </>
            )}

            <button className="w-full sm:w-auto border-2 border-gray-500 text-gray-700 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-gray-500 hover:text-white transition-all duration-300 text-sm sm:text-base" onClick={() => navigate(-1)}>
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoodDetail;
