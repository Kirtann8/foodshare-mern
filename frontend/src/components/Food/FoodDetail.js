import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import foodAPI from '../../services/api';
import Loading from '../Common/Loading';
import './Food.css';

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
  if (error) return <div className="error-message">{error}</div>;
  if (!food) return <div className="error-message">Food not found</div>;

  const isDonor = user && user.id === food.donor._id;
  const canClaim = isAuthenticated && food.claimStatus === 'available' && !isDonor;
  const canComplete = isDonor && food.claimStatus === 'claimed';

  return (
    <div className="food-detail-container">
      <div className="food-detail-card">
        <div className="detail-header">
          <h1>{food.title}</h1>
          <span 
            className="status-badge-large" 
            style={{ backgroundColor: getStatusColor(food.claimStatus) }}
          >
            {food.claimStatus}
          </span>
        </div>

        {food.images && food.images.length > 0 && (
          <div className="detail-images">
            {food.images.map((image, index) => (
              <img
                key={index}
                src={image.startsWith('http') ? image : `${process.env.REACT_APP_API_URL.replace('/api', '')}${image}`}
                alt={`${food.title} ${index + 1}`}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/600x400?text=Food+Image';
                }}
              />
            ))}
          </div>
        )}

        <div className="detail-content">
          <section className="detail-section">
            <h2>Description</h2>
            <p>{food.description}</p>
          </section>

          <section className="detail-section">
            <h2>Details</h2>
            <div className="detail-grid">
              <div className="detail-item">
                <strong>Category:</strong>
                <span>{food.category}</span>
              </div>
              <div className="detail-item">
                <strong>Quantity:</strong>
                <span>{food.quantity}</span>
              </div>
              <div className="detail-item">
                <strong>Expiry Date:</strong>
                <span>{formatDate(food.expiryDate)}</span>
              </div>
              <div className="detail-item">
                <strong>Views:</strong>
                <span>{food.views}</span>
              </div>
            </div>
          </section>

          <section className="detail-section">
            <h2>Pickup Information</h2>
            <div className="detail-grid">
              <div className="detail-item">
                <strong>Start Time:</strong>
                <span>{formatDate(food.pickupTiming.startTime)}</span>
              </div>
              <div className="detail-item">
                <strong>End Time:</strong>
                <span>{formatDate(food.pickupTiming.endTime)}</span>
              </div>
            </div>
          </section>

          <section className="detail-section">
            <h2>Location</h2>
            <div className="location-info">
              <p>{food.location.address}</p>
              <p>{food.location.city}, {food.location.state} {food.location.zipCode}</p>
            </div>
          </section>

          <section className="detail-section">
            <h2>Dietary Information</h2>
            <div className="dietary-badges">
              {food.dietaryInfo?.isVegetarian && <span className="dietary-badge">🥬 Vegetarian</span>}
              {food.dietaryInfo?.isVegan && <span className="dietary-badge">🌱 Vegan</span>}
              {food.dietaryInfo?.isGlutenFree && <span className="dietary-badge">🌾 Gluten-Free</span>}
              {food.dietaryInfo?.containsNuts && <span className="dietary-badge">🥜 Contains Nuts</span>}
              {!food.dietaryInfo?.isVegetarian && !food.dietaryInfo?.isVegan && 
               !food.dietaryInfo?.isGlutenFree && !food.dietaryInfo?.containsNuts && (
                <span>No special dietary information</span>
              )}
            </div>
          </section>

          <section className="detail-section">
            <h2>Donor Information</h2>
            <div className="donor-info">
              <p><strong>Name:</strong> {food.donor.name}</p>
              <p><strong>Email:</strong> {food.donor.email}</p>
              {food.donor.phone && <p><strong>Phone:</strong> {food.donor.phone}</p>}
            </div>
          </section>

          {food.claimedBy && (
            <section className="detail-section">
              <h2>Claimed By</h2>
              <div className="claimer-info">
                <p><strong>Name:</strong> {food.claimedBy.name}</p>
                <p><strong>Email:</strong> {food.claimedBy.email}</p>
                {food.claimedBy.phone && <p><strong>Phone:</strong> {food.claimedBy.phone}</p>}
                <p><strong>Claimed At:</strong> {formatDate(food.claimedAt)}</p>
              </div>
            </section>
          )}

          <div className="detail-actions">
            {canClaim && (
              <button 
                className="btn btn-primary" 
                onClick={handleClaim}
                disabled={actionLoading}
              >
                {actionLoading ? 'Claiming...' : 'Claim This Food'}
              </button>
            )}

            {canComplete && (
              <button 
                className="btn btn-success" 
                onClick={handleComplete}
                disabled={actionLoading}
              >
                {actionLoading ? 'Completing...' : 'Mark as Completed'}
              </button>
            )}

            {isDonor && (
              <>
                <Link to={`/food/edit/${food._id}`} className="btn btn-secondary">
                  Edit
                </Link>
                <button className="btn btn-danger" onClick={handleDelete}>
                  Delete
                </button>
              </>
            )}

            <button className="btn btn-outline" onClick={() => navigate(-1)}>
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoodDetail;
