import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import foodAPI from '../../services/api';
import FoodCard from './FoodCard';
import Loading from '../Common/Loading';

const MyDonations = () => {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMyDonations();
  }, []);

  const fetchMyDonations = async () => {
    try {
      setLoading(true);
      const data = await foodAPI.getMyDonations();
      setFoods(data.data);
    } catch (err) {
      setError(err.error || 'Failed to fetch your donations');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800">My Donations</h1>
        <Link to="/food/create" className="bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 transition-all duration-300 no-underline">
          Add New Food
        </Link>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">{error}</div>}

      {foods.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-md">
          <p className="text-gray-600 mb-6 text-lg">You haven't shared any food yet.</p>
          <Link to="/food/create" className="inline-block bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 transition-all duration-300 no-underline">
            Share Your First Food
          </Link>
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

export default MyDonations;
