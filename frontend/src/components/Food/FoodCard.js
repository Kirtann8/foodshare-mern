import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const FoodCard = ({ food }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  const getStatusBadge = (status) => {
    const badges = {
      available: { bg: 'bg-green-500', text: 'text-white', label: 'Available', icon: '✓' },
      claimed: { bg: 'bg-amber-500', text: 'text-white', label: 'Claimed', icon: '⏳' },
      completed: { bg: 'bg-blue-500', text: 'text-white', label: 'Completed', icon: '✓' },
      expired: { bg: 'bg-red-500', text: 'text-white', label: 'Expired', icon: '✕' }
    };
    return badges[status] || { bg: 'bg-gray-500', text: 'text-white', label: status, icon: '•' };
  };

  const getDaysUntilExpiry = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const statusBadge = getStatusBadge(food.claimStatus);
  const daysLeft = getDaysUntilExpiry(food.expiryDate);

  return (
    <Link 
      to={`/food/${food._id}`} 
      className="group block bg-white rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1 no-underline"
    >
      {/* Image Section with Overlay */}
      <div className="relative h-52 overflow-hidden bg-gray-100">
        {food.images && food.images.length > 0 ? (
          <>
            <img 
              src={food.images[0].startsWith('http') ? food.images[0] : `${process.env.REACT_APP_API_URL.replace('/api', '')}${food.images[0]}`} 
              alt={food.title}
              onLoad={() => setImageLoaded(true)}
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/400x300?text=Food+Image';
                setImageLoaded(true);
              }}
              className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gray-200 animate-pulse" />
            )}
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
            <span className="text-7xl group-hover:scale-110 transition-transform duration-300">🍽️</span>
          </div>
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />
        
        {/* Category Badge - Top Left */}
        <div className="absolute top-3 left-3 backdrop-blur-md bg-white/95 px-3 py-1.5 rounded-full shadow-lg">
          <span className="text-xs font-semibold text-gray-800">{food.category}</span>
        </div>
        
        {/* Status Badge - Top Right */}
        <div className={`absolute top-3 right-3 ${statusBadge.bg} ${statusBadge.text} px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5`}>
          <span className="text-xs font-bold">{statusBadge.icon}</span>
          <span className="text-xs font-semibold">{statusBadge.label}</span>
        </div>

        {/* Location - Bottom Left */}
        <div className="absolute bottom-3 left-3 backdrop-blur-md bg-black/40 text-white px-3 py-1.5 rounded-full flex items-center gap-1.5">
          <span className="text-sm">📍</span>
          <span className="text-sm font-medium">{food.location.city}</span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5">
        {/* Title */}
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-green-600 transition-colors">
          {food.title}
        </h3>
        
        {/* Description */}
        <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
          {food.description}
        </p>
        
        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <span className="text-base">📦</span>
            <span className="font-medium">{food.quantity}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <span className="text-base">�</span>
            <span className="font-medium truncate">{food.donor?.name || 'Anonymous'}</span>
          </div>
        </div>

        {/* Dietary Tags */}
        {(food.dietaryInfo?.isVegetarian || food.dietaryInfo?.isVegan || food.dietaryInfo?.isGlutenFree) && (
          <div className="flex gap-2 mb-4 flex-wrap">
            {food.dietaryInfo?.isVegetarian && (
              <span className="bg-green-50 text-green-700 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                🥬 Veg
              </span>
            )}
            {food.dietaryInfo?.isVegan && (
              <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                🌱 Vegan
              </span>
            )}
            {food.dietaryInfo?.isGlutenFree && (
              <span className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                🌾 GF
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
          <div className="flex flex-col">
            <span className="text-xs text-gray-500">Expires</span>
            <span className={`text-sm font-semibold ${daysLeft <= 1 ? 'text-red-600' : daysLeft <= 3 ? 'text-amber-600' : 'text-gray-700'}`}>
              {daysLeft <= 0 ? 'Today' : daysLeft === 1 ? 'Tomorrow' : `${daysLeft} days`}
            </span>
          </div>
          <div className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-semibold group-hover:bg-green-600 transition-all duration-300 flex items-center gap-2">
            <span>View</span>
            <span className="transform group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default FoodCard;
