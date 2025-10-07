import React, { useState } from 'react';
import { foodAPI } from '../../services/api';
import FoodCard from './FoodCard';
import Loading from '../Common/Loading';
import ErrorMessage from '../Common/ErrorMessage';

const LocationSearch = () => {
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!city.trim()) {
      setError('Please enter a city name');
      return;
    }

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const response = await foodAPI.searchByLocation(city.trim(), state.trim() || undefined);
      setFoods(response.data || []);
    } catch (err) {
      setError(err.error || 'Failed to search for food posts');
      setFoods([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setCity('');
    setState('');
    setFoods([]);
    setError(null);
    setSearched(false);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          🗺️ Search Food by Location
        </h2>
        <p className="text-gray-600 mb-4">
          Find available food donations near you by searching for your city
        </p>

        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g., Mumbai, Delhi, Bangalore"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                State <span className="text-gray-400">(Optional)</span>
              </label>
              <input
                type="text"
                id="state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="e.g., Maharashtra, Karnataka"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Searching...' : '🔍 Search'}
            </button>
            
            {searched && (
              <button
                type="button"
                onClick={handleClear}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors duration-300"
              >
                Clear
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Results Section */}
      {loading && <Loading />}
      
      {error && <ErrorMessage message={error} />}

      {searched && !loading && !error && (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            Search Results {foods.length > 0 && `(${foods.length} found)`}
          </h3>

          {foods.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg mb-2">
                No food posts found in "{city}"
                {state && `, ${state}`}
              </p>
              <p className="text-gray-500 text-sm">
                Try searching for a different location or check back later
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {foods.map((food) => (
                <FoodCard key={food._id} food={food} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationSearch;
