import React, { useState, useEffect } from 'react';
import foodAPI from '../../services/api';
import FoodCard from './FoodCard';
import Loading from '../Common/Loading';
import './Food.css';

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
    <div className="my-claims-container">
      <div className="page-header">
        <h1>My Claims</h1>
      </div>

      {error && <div className="error-message">{error}</div>}

      {foods.length === 0 ? (
        <div className="no-results">
          <p>You haven't claimed any food yet.</p>
          <p>Browse available food and help reduce waste!</p>
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

export default MyClaims;
