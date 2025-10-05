import React, { useState, useEffect } from 'react';
import foodAPI from '../../services/api';
import FoodCard from './FoodCard';
import Loading from '../Common/Loading';

const MyClaims = () => {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMyClaims();
  }, []);

  const fetchMyClaims = async () => {
    try {
      setLoading(true);
      const data = await foodAPI.getMyClaims();
      setFoods(data.data);
    } catch (err) {
      setError(err.error || 'Failed to fetch your claims');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800">My Claims</h1>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">{error}</div>}

      {foods.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-md">
          <p className="text-gray-600 mb-2 text-lg">You haven't claimed any food yet.</p>
          <p className="text-gray-600">Browse available food and help reduce waste!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {foods.map((food) => (
            <FoodCard key={food._id} food={food} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyClaims;
