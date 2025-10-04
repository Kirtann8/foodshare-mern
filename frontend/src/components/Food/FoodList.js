import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import foodAPI from '../../services/api';
import FoodCard from './FoodCard';
import Loading from '../Common/Loading';
import './Food.css';

const FoodList = () => {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    claimStatus: '', // Show ALL food by default, not just available
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
    <div className="food-list-container">
      <div className="food-list-header">
        <h1>Available Food</h1>
        <Link to="/food/create" className="btn btn-primary">
          Share Food
        </Link>
      </div>

      <div className="filters-section">
        <form onSubmit={handleSearch} className="filters-form">
          <div className="filter-group">
            <input
              type="text"
              name="city"
              placeholder="Search by city..."
              value={filters.city}
              onChange={handleFilterChange}
            />
          </div>

          <div className="filter-group">
            <select
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
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

          <div className="filter-group">
            <select
              name="claimStatus"
              value={filters.claimStatus}
              onChange={handleFilterChange}
            >
              <option value="">All Status</option>
              <option value="available">Available</option>
              <option value="claimed">Claimed</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <button type="submit" className="btn btn-secondary">
            Apply Filters
          </button>
        </form>
      </div>

      {error && <div className="error-message">{error}</div>}

      {!error && foods.length === 0 ? (
        <div className="no-results">
          <h3>No food posts found</h3>
          {filters.category || filters.city || filters.claimStatus ? (
            <>
              <p>Try adjusting your filters or clearing them to see all available food.</p>
              <button 
                className="btn btn-secondary" 
                onClick={() => setFilters({ category: '', claimStatus: '', city: '', page: 1, limit: 12 })}
              >
                Clear All Filters
              </button>
            </>
          ) : (
            <>
              <p>Be the first to share food with your community!</p>
              <Link to="/food/create" className="btn btn-primary">
                Share Food Now
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="food-grid">
          {foods.map((food) => (
            <FoodCard key={food._id} food={food} />
          ))}
        </div>
      )}
    </div>
  );
};

export default FoodList;
