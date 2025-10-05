import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import foodAPI from '../../services/api';
import FoodCard from './FoodCard';
import Loading from '../Common/Loading';
import './Food.css';

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
    <div className="my-donations-container">
      <div className="page-header">
        <h1>My Donations</h1>
        <Link to="/food/create" className="btn btn-primary">
          Add New Food
        </Link>
      </div>

      {error && <div className="error-message">{error}</div>}

      {foods.length === 0 ? (
        <div className="no-results">
          <p>You haven't shared any food yet.</p>
          <Link to="/food/create" className="btn btn-primary">
            Share Your First Food
          </Link>
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

export default MyDonations;
