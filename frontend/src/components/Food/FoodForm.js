import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import foodAPI from '../../services/api';
import './Food.css';

const FoodForm = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Other',
    quantity: '',
    location: {
      address: user?.address?.street || '',
      city: user?.address?.city || '',
      state: user?.address?.state || '',
      zipCode: user?.address?.zipCode || ''
    },
    pickupTiming: {
      startTime: '',
      endTime: ''
    },
    expiryDate: '',
    dietaryInfo: {
      isVegetarian: false,
      isVegan: false,
      isGlutenFree: false,
      containsNuts: false
    }
  });
  
  const [images, setImages] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('location.')) {
      const field = name.split('.')[1];
      setFormData({
        ...formData,
        location: { ...formData.location, [field]: value }
      });
    } else if (name.includes('pickupTiming.')) {
      const field = name.split('.')[1];
      setFormData({
        ...formData,
        pickupTiming: { ...formData.pickupTiming, [field]: value }
      });
    } else if (name.includes('dietaryInfo.')) {
      const field = name.split('.')[1];
      setFormData({
        ...formData,
        dietaryInfo: { ...formData.dietaryInfo, [field]: checked }
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 5) {
      setError('You can upload maximum 5 images');
      return;
    }
    setImages(files);
    setError('');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = new FormData();
      
      // Append all form fields
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('category', formData.category);
      data.append('quantity', formData.quantity);
      data.append('location[address]', formData.location.address);
      data.append('location[city]', formData.location.city);
      data.append('location[state]', formData.location.state);
      data.append('location[zipCode]', formData.location.zipCode);
      data.append('pickupTiming[startTime]', formData.pickupTiming.startTime);
      data.append('pickupTiming[endTime]', formData.pickupTiming.endTime);
      data.append('expiryDate', formData.expiryDate);
      data.append('dietaryInfo[isVegetarian]', formData.dietaryInfo.isVegetarian);
      data.append('dietaryInfo[isVegan]', formData.dietaryInfo.isVegan);
      data.append('dietaryInfo[isGlutenFree]', formData.dietaryInfo.isGlutenFree);
      data.append('dietaryInfo[containsNuts]', formData.dietaryInfo.containsNuts);
      
      // Append images
      images.forEach((image) => {
        data.append('images', image);
      });

      await foodAPI.createFood(data);
      navigate('/my-donations');
    } catch (err) {
      setError(err.error || 'Failed to create food post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="food-form-container">
      <div className="food-form-card">
        <h2>Share Food</h2>
        <p className="form-subtitle">Help reduce food waste and feed those in need</p>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={onSubmit} encType="multipart/form-data">
          <div className="form-group">
            <label htmlFor="title">Food Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={onChange}
              required
              placeholder="e.g., Fresh Homemade Pasta"
              maxLength="100"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={onChange}
              required
              placeholder="Describe the food, how it was prepared, etc."
              rows="4"
              maxLength="500"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">Category *</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={onChange}
                required
              >
                <option value="Cooked Food">Cooked Food</option>
                <option value="Raw Ingredients">Raw Ingredients</option>
                <option value="Packaged Food">Packaged Food</option>
                <option value="Baked Items">Baked Items</option>
                <option value="Beverages">Beverages</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="quantity">Quantity *</label>
              <input
                type="text"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={onChange}
                required
                placeholder="e.g., 5 servings, 2kg"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="images">Food Images (Max 5)</label>
            <input
              type="file"
              id="images"
              name="images"
              onChange={handleImageChange}
              accept="image/*"
              multiple
            />
            <small>Accepted formats: JPEG, PNG, GIF, WebP (Max 5MB each)</small>
          </div>

          <h3>Location Details</h3>
          
          <div className="form-group">
            <label htmlFor="location.address">Address *</label>
            <input
              type="text"
              id="location.address"
              name="location.address"
              value={formData.location.address}
              onChange={onChange}
              required
              placeholder="Street address"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="location.city">City *</label>
              <input
                type="text"
                id="location.city"
                name="location.city"
                value={formData.location.city}
                onChange={onChange}
                required
                placeholder="City"
              />
            </div>

            <div className="form-group">
              <label htmlFor="location.state">State</label>
              <input
                type="text"
                id="location.state"
                name="location.state"
                value={formData.location.state}
                onChange={onChange}
                placeholder="State"
              />
            </div>

            <div className="form-group">
              <label htmlFor="location.zipCode">ZIP Code</label>
              <input
                type="text"
                id="location.zipCode"
                name="location.zipCode"
                value={formData.location.zipCode}
                onChange={onChange}
                placeholder="ZIP Code"
              />
            </div>
          </div>

          <h3>Pickup & Expiry</h3>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="pickupTiming.startTime">Pickup Start Time *</label>
              <input
                type="datetime-local"
                id="pickupTiming.startTime"
                name="pickupTiming.startTime"
                value={formData.pickupTiming.startTime}
                onChange={onChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="pickupTiming.endTime">Pickup End Time *</label>
              <input
                type="datetime-local"
                id="pickupTiming.endTime"
                name="pickupTiming.endTime"
                value={formData.pickupTiming.endTime}
                onChange={onChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="expiryDate">Expiry Date *</label>
            <input
              type="date"
              id="expiryDate"
              name="expiryDate"
              value={formData.expiryDate}
              onChange={onChange}
              required
            />
          </div>

          <h3>Dietary Information</h3>

          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="dietaryInfo.isVegetarian"
                checked={formData.dietaryInfo.isVegetarian}
                onChange={onChange}
              />
              <span>Vegetarian</span>
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                name="dietaryInfo.isVegan"
                checked={formData.dietaryInfo.isVegan}
                onChange={onChange}
              />
              <span>Vegan</span>
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                name="dietaryInfo.isGlutenFree"
                checked={formData.dietaryInfo.isGlutenFree}
                onChange={onChange}
              />
              <span>Gluten-Free</span>
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                name="dietaryInfo.containsNuts"
                checked={formData.dietaryInfo.containsNuts}
                onChange={onChange}
              />
              <span>Contains Nuts</span>
            </label>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Posting...' : 'Share Food'}
            </button>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => navigate('/')}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FoodForm;
