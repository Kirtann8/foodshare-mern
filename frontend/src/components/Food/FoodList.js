import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { foodAPI } from '../../services/api';
import FoodCard from './FoodCard';
import FoodCardSkeleton from './FoodCardSkeleton';
import LocationAutocomplete from './LocationAutocomplete';

const FoodList = () => {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showStateField, setShowStateField] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    claimStatus: 'available', // Show ALL food which is available by default
    city: '',
    state: '',
    page: 1,
    limit: 12
  });

  const fetchFoods = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Fetching foods with filters:', filters);
      const data = await foodAPI.getFoods(filters);
      console.log('Received food data:', data);
      setFoods(data.data);
    } catch (err) {
      console.error('Error fetching foods:', err);
      setError(err.error || err.message || 'Failed to fetch food posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFoods();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.category, filters.claimStatus]); // Only trigger on category/status change, NOT on city/state

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    
    // For category and claimStatus, update filters immediately (will trigger useEffect)
    // For city and state, just update the input value (won't trigger fetch until form submit)
    setFilters({
      ...filters,
      [name]: value,
      page: 1 // Reset to page 1 when filters change
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchFoods(); // Fetch with updated city/state values
  };

  return (
    <div className="w-full px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800">Available Food</h1>
        <Link to="/food/create" className="w-full sm:w-auto text-center bg-green-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-green-600 transition-all duration-300 no-underline text-sm sm:text-base">
          Share Food
        </Link>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md mb-6 sm:mb-8">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-3 sm:gap-4 flex-col sm:flex-row items-stretch sm:items-end">
            <div className="flex-1 min-w-0">
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                🗺️ Search by Location
              </label>
              <LocationAutocomplete
                name="city"
                value={filters.city}
                onChange={handleFilterChange}
                placeholder="Search for a city..."
              />
            </div>

            {showStateField && (
              <div className="flex-1 min-w-0">
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                  State <span className="text-gray-400">(Optional)</span>
                </label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  placeholder="Enter state..."
                  value={filters.state}
                  onChange={handleFilterChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm sm:text-base"
                />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm sm:text-base"
              >
                <option value="">All Categories</option>
                <option value="Cooked Food">Cooked Food</option>
                <option value="Raw Ingredients">Raw Ingredients</option>
                <option value="Packaged Food">Packaged Food</option>
                <option value="Baked Items">Baked Items</option>
                <option value="Beverages">Beverages</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="flex-1 min-w-0">
              <label htmlFor="claimStatus" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="claimStatus"
                name="claimStatus"
                value={filters.claimStatus}
                onChange={handleFilterChange}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm sm:text-base"
              >
                <option value="">All Status</option>
                <option value="available">Available</option>
                <option value="claimed">Claimed</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <button type="submit" className="bg-gray-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-gray-700 transition-all duration-300 text-sm sm:text-base whitespace-nowrap">
              Apply Filters
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowStateField(!showStateField)}
              className="text-sm text-green-600 hover:text-green-700 font-medium transition-colors"
            >
              {showStateField ? '− Hide State Filter' : '+ Add State Filter'}
            </button>
            {(filters.city || filters.state || filters.category || filters.claimStatus !== 'available') && (
              <button
                type="button"
                onClick={() => {
                  setFilters({ category: '', claimStatus: 'available', city: '', state: '', page: 1, limit: 12 });
                  setShowStateField(false);
                }}
                className="text-sm text-gray-600 hover:text-gray-700 font-medium transition-colors ml-auto"
              >
                Clear All Filters
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Active Filters & Result Count */}
      {!loading && !error && (
        <div className="mb-6">
          {/* Active Filter Chips */}
          {(filters.city || filters.state || filters.category || filters.claimStatus !== 'available') && (
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-sm text-gray-600 font-medium py-2">Active Filters:</span>
              {filters.city && (
                <span className="bg-green-100 text-green-800 px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2">
                  📍 {filters.city}
                  <button
                    onClick={() => setFilters({ ...filters, city: '' })}
                    className="hover:bg-green-200 rounded-full p-0.5 transition-colors"
                  >
                    ✕
                  </button>
                </span>
              )}
              {filters.state && (
                <span className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2">
                  🏛️ {filters.state}
                  <button
                    onClick={() => setFilters({ ...filters, state: '' })}
                    className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                  >
                    ✕
                  </button>
                </span>
              )}
              {filters.category && (
                <span className="bg-purple-100 text-purple-800 px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2">
                  🏷️ {filters.category}
                  <button
                    onClick={() => setFilters({ ...filters, category: '' })}
                    className="hover:bg-purple-200 rounded-full p-0.5 transition-colors"
                  >
                    ✕
                  </button>
                </span>
              )}
              {filters.claimStatus && filters.claimStatus !== 'available' && (
                <span className="bg-amber-100 text-amber-800 px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2">
                  ⚡ Status: {filters.claimStatus}
                  <button
                    onClick={() => setFilters({ ...filters, claimStatus: 'available' })}
                    className="hover:bg-amber-200 rounded-full p-0.5 transition-colors"
                  >
                    ✕
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Result Count */}
          {foods.length > 0 && (
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">
                Showing <span className="font-semibold text-gray-900">{foods.length}</span> food {foods.length === 1 ? 'post' : 'posts'}
              </p>
            </div>
          )}
        </div>
      )}

      {error && <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6 text-sm sm:text-base">{error}</div>}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[...Array(6)].map((_, index) => (
            <FoodCardSkeleton key={index} />
          ))}
        </div>
      ) : !error && foods.length === 0 ? (
        <div className="text-center py-12 sm:py-16 bg-white rounded-xl shadow-md px-4">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">No food posts found</h3>
          {filters.category || filters.city || filters.state || filters.claimStatus !== 'available' ? (
            <>
              <p className="text-gray-600 mb-6 text-sm sm:text-base">Try adjusting your filters or clearing them to see all available food.</p>
              <button 
                className="bg-gray-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-gray-700 transition-all duration-300 text-sm sm:text-base" 
                onClick={() => {
                  setFilters({ category: '', claimStatus: 'available', city: '', state: '', page: 1, limit: 12 });
                  setShowStateField(false);
                }}
              >
                Clear All Filters
              </button>
            </>
          ) : (
            <>
              <p className="text-gray-600 mb-6 text-sm sm:text-base">Be the first to share food with your community!</p>
              <Link to="/food/create" className="inline-block bg-green-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-green-600 transition-all duration-300 no-underline text-sm sm:text-base">
                Share Food Now
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {foods.map((food) => (
            <FoodCard key={food._id} food={food} />
          ))}
        </div>
      )}
    </div>
  );
};

export default FoodList;
