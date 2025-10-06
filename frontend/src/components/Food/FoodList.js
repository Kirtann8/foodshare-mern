import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { foodAPI } from '../../services/api';
import FoodCard from './FoodCard';
import Loading from '../Common/Loading';

const FoodList = () => {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    claimStatus: 'available', // Show ALL food which is available by default
    city: '',
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
  }, [filters]);

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
      page: 1 // Reset to page 1 when filters change
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchFoods();
  };

  if (loading) return <Loading />;

  return (
    <div className="w-full px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800">Available Food</h1>
        <Link to="/food/create" className="w-full sm:w-auto text-center bg-green-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-green-600 transition-all duration-300 no-underline text-sm sm:text-base">
          Share Food
        </Link>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md mb-6 sm:mb-8">
        <form onSubmit={handleSearch} className="flex gap-3 sm:gap-4 flex-col sm:flex-row items-stretch sm:items-end">
          <div className="flex-1 min-w-0">
            <input
              type="text"
              name="city"
              placeholder="Search by city..."
              value={filters.city}
              onChange={handleFilterChange}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm sm:text-base"
            />
          </div>

          <div className="flex-1 min-w-0">
            <select
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
            <select
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
        </form>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6 text-sm sm:text-base">{error}</div>}

      {!error && foods.length === 0 ? (
        <div className="text-center py-12 sm:py-16 bg-white rounded-xl shadow-md px-4">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">No food posts found</h3>
          {filters.category || filters.city || filters.claimStatus ? (
            <>
              <p className="text-gray-600 mb-6 text-sm sm:text-base">Try adjusting your filters or clearing them to see all available food.</p>
              <button 
                className="bg-gray-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-gray-700 transition-all duration-300 text-sm sm:text-base" 
                onClick={() => setFilters({ category: '', claimStatus: '', city: '', page: 1, limit: 12 })}
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
