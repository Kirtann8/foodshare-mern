import React from 'react';
import { Link } from 'react-router-dom';

const FoodCard = ({ food }) => {
  const getStatusBadge = (status) => {
    const badges = {
      available: 'bg-green-100 text-green-800',
      claimed: 'bg-amber-100 text-amber-800',
      completed: 'bg-blue-100 text-blue-800',
      expired: 'bg-red-100 text-red-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300">
      <div className="relative h-48 overflow-hidden">
        {food.images && food.images.length > 0 ? (
          <img 
            src={food.images[0].startsWith('http') ? food.images[0] : `${process.env.REACT_APP_API_URL.replace('/api', '')}${food.images[0]}`} 
            alt={food.title}
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/300x200?text=Food+Image';
            }}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <span className="text-6xl">🍽️</span>
          </div>
        )}
        <span className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold uppercase ${getStatusBadge(food.claimStatus)}`}>
          {food.claimStatus}
        </span>
      </div>

      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">{food.title}</h3>
        <p className="text-gray-600 mb-4 line-clamp-2">{food.description}</p>
        
        <div className="flex gap-4 mb-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <span>📦</span>
            <span>{food.quantity}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>📍</span>
            <span>{food.location.city}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>🏷️</span>
            <span>{food.category}</span>
          </div>
        </div>

        <div className="flex gap-2 mb-4 flex-wrap">
          {food.dietaryInfo?.isVegetarian && <span className="bg-green-50 text-green-700 px-2 py-1 rounded-full text-xs font-medium">🥬 Veg</span>}
          {food.dietaryInfo?.isVegan && <span className="bg-green-50 text-green-700 px-2 py-1 rounded-full text-xs font-medium">🌱 Vegan</span>}
          {food.dietaryInfo?.isGlutenFree && <span className="bg-green-50 text-green-700 px-2 py-1 rounded-full text-xs font-medium">🌾 Gluten-Free</span>}
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <span className="text-sm text-gray-500">
            Expires: {formatDate(food.expiryDate)}
          </span>
          <Link to={`/food/${food._id}`} className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition-all duration-300 no-underline">
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FoodCard;
