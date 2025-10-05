import React from 'react';
import { Link } from 'react-router-dom';
import './Food.css';

const FoodCard = ({ food }) => {
  const getStatusBadge = (status) => {
    const badges = {
      available: 'badge-success',
      claimed: 'badge-warning',
      completed: 'badge-info',
      expired: 'badge-danger'
    };
    return badges[status] || 'badge-default';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="food-card">
      <div className="food-card-image">
        {food.images && food.images.length > 0 ? (
          <img 
            src={food.images[0].startsWith('http') ? food.images[0] : `${process.env.REACT_APP_API_URL.replace('/api', '')}${food.images[0]}`} 
            alt={food.title}
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/300x200?text=Food+Image';
            }}
          />
        ) : (
          <div className="no-image">
            <span>🍽️</span>
          </div>
        )}
        <span className={`status-badge ${getStatusBadge(food.claimStatus)}`}>
          {food.claimStatus}
        </span>
      </div>

      <div className="food-card-content">
        <h3>{food.title}</h3>
        <p className="food-description">{food.description}</p>
        
        <div className="food-meta">
          <div className="meta-item">
            <span className="icon">📦</span>
            <span>{food.quantity}</span>
          </div>
          <div className="meta-item">
            <span className="icon">📍</span>
            <span>{food.location.city}</span>
          </div>
          <div className="meta-item">
            <span className="icon">🏷️</span>
            <span>{food.category}</span>
          </div>
        </div>

        <div className="food-dietary">
          {food.dietaryInfo?.isVegetarian && <span className="dietary-badge">🥬 Veg</span>}
          {food.dietaryInfo?.isVegan && <span className="dietary-badge">🌱 Vegan</span>}
          {food.dietaryInfo?.isGlutenFree && <span className="dietary-badge">🌾 Gluten-Free</span>}
        </div>

        <div className="food-footer">
          <span className="food-date">
            Expires: {formatDate(food.expiryDate)}
          </span>
          <Link to={`/food/${food._id}`} className="btn btn-small">
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FoodCard;
