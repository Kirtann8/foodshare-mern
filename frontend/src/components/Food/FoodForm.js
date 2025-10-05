import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import foodAPI from '../../services/api';

const FoodForm = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { id } = useParams(); // Get the food ID from URL params
  const isEditMode = Boolean(id); // Determine if we're in edit mode
  
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
  const [uploadProgress, setUploadProgress] = useState(0);

  // Fetch existing food data when in edit mode
  useEffect(() => {
    const fetchFoodData = async () => {
      if (!id) return; // Only fetch if we have an ID (edit mode)
      
      try {
        setLoading(true);
        const response = await foodAPI.getFood(id);
        const food = response.data;
        
        // Format dates for datetime-local and date inputs
        const formatDateTimeLocal = (date) => {
          if (!date) return '';
          const d = new Date(date);
          const offset = d.getTimezoneOffset();
          const localDate = new Date(d.getTime() - offset * 60 * 1000);
          return localDate.toISOString().slice(0, 16);
        };

        const formatDate = (date) => {
          if (!date) return '';
          const d = new Date(date);
          return d.toISOString().split('T')[0];
        };
        
        // Populate form with existing data
        setFormData({
          title: food.title || '',
          description: food.description || '',
          category: food.category || 'Other',
          quantity: food.quantity || '',
          location: {
            address: food.location?.address || '',
            city: food.location?.city || '',
            state: food.location?.state || '',
            zipCode: food.location?.zipCode || ''
          },
          pickupTiming: {
            startTime: formatDateTimeLocal(food.pickupTiming?.startTime),
            endTime: formatDateTimeLocal(food.pickupTiming?.endTime)
          },
          expiryDate: formatDate(food.expiryDate),
          dietaryInfo: {
            isVegetarian: food.dietaryInfo?.isVegetarian || false,
            isVegan: food.dietaryInfo?.isVegan || false,
            isGlutenFree: food.dietaryInfo?.isGlutenFree || false,
            containsNuts: food.dietaryInfo?.containsNuts || false
          }
        });
        
        // Set existing images
        if (food.images && food.images.length > 0) {
          setImages(food.images);
        }
        
        setError('');
      } catch (err) {
        console.error('Error fetching food data:', err);
        setError('Failed to load food data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchFoodData();
  }, [id]); // Re-run when ID changes

  const handleImageUpload = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;

      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        setError('Please upload only JPG, PNG or GIF images');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }

      setLoading(true);
      setError('');

      const formData = new FormData();
      formData.append('image', file);

      console.log('Uploading file:', file.name);

      const response = await foodAPI.uploadImage(formData, (progressEvent) => {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(progress);
        console.log('Upload progress:', progress);
      });

      if (response.success) {
        setImages(prevImages => [...prevImages, response.data.url]);
        setError('');
      }
    } catch (err) {
      console.error('Upload error:', err);
      console.error('Error response:', err.response);
      const errorMessage = err.response?.data?.message || err.message || 'Error uploading image';
      setError(errorMessage);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const removeImage = (indexToRemove) => {
    setImages(prevImages => prevImages.filter((_, index) => index !== indexToRemove));
  };

  const onChange = (e) => {
    const { name, value, checked } = e.target;
    
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
      
      // Append image URLs (already uploaded to Cloudinary)
      images.forEach((imageUrl, index) => {
        data.append(`images[${index}]`, imageUrl);
      });

      // Call appropriate API based on mode
      if (isEditMode) {
        await foodAPI.updateFood(id, data);
      } else {
        await foodAPI.createFood(data);
      }
      
      navigate('/my-donations');
    } catch (err) {
      setError(err.error || `Failed to ${isEditMode ? 'update' : 'create'} food post`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          {isEditMode ? 'Edit Food Donation' : 'Share Food'}
        </h2>
        <p className="text-gray-600 mb-6">
          {isEditMode ? 'Update your food donation details' : 'Help reduce food waste and feed those in need'}
        </p>
        
        {error && <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4">{error}</div>}
        
        <form onSubmit={onSubmit} encType="multipart/form-data">
          <div className="mb-4">
            <label htmlFor="title" className="block text-gray-700 font-medium mb-2">Food Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={onChange}
              required
              placeholder="e.g., Fresh Homemade Pasta"
              maxLength="100"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="description" className="block text-gray-700 font-medium mb-2">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={onChange}
              required
              placeholder="Describe the food, how it was prepared, etc."
              rows="4"
              maxLength="500"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="image" className="block text-gray-700 font-medium mb-2">Food Images</label>
            <input
              type="file"
              id="image"
              name="image"
              onChange={handleImageUpload}
              accept="image/*"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
            />
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="mt-3 bg-gray-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-green-500 h-full transition-all duration-300 flex items-center justify-center text-xs text-white font-semibold" 
                  style={{ width: `${uploadProgress}%` }}
                >
                </div>
              </div>
            )}
            {images.length > 0 && (
              <div className="flex flex-wrap gap-4 mt-4">
                {images.map((url, index) => (
                  <div key={index} className="relative w-36 h-36 rounded-lg overflow-hidden group">
                    <img src={url} alt={`Food ${index + 1}`} className="w-full h-full object-cover" />
                    <button 
                      type="button" 
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-lg font-bold transition-all opacity-0 group-hover:opacity-100"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="category" className="block text-gray-700 font-medium mb-2">Category *</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={onChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              >
                <option value="Cooked Food">Cooked Food</option>
                <option value="Raw Ingredients">Raw Ingredients</option>
                <option value="Packaged Food">Packaged Food</option>
                <option value="Baked Items">Baked Items</option>
                <option value="Beverages">Beverages</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="quantity" className="block text-gray-700 font-medium mb-2">Quantity *</label>
              <input
                type="text"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={onChange}
                required
                placeholder="e.g., 5 servings, 2kg"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <h3 className="text-xl font-bold text-gray-800 mt-8 mb-4 pb-2 border-b-2 border-gray-200">Location Details</h3>
          
          <div className="mb-4">
            <label htmlFor="location.address" className="block text-gray-700 font-medium mb-2">Address *</label>
            <input
              type="text"
              id="location.address"
              name="location.address"
              value={formData.location.address}
              onChange={onChange}
              required
              placeholder="Street address"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label htmlFor="location.city" className="block text-gray-700 font-medium mb-2">City *</label>
              <input
                type="text"
                id="location.city"
                name="location.city"
                value={formData.location.city}
                onChange={onChange}
                required
                placeholder="City"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label htmlFor="location.state" className="block text-gray-700 font-medium mb-2">State</label>
              <input
                type="text"
                id="location.state"
                name="location.state"
                value={formData.location.state}
                onChange={onChange}
                placeholder="State"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label htmlFor="location.zipCode" className="block text-gray-700 font-medium mb-2">ZIP Code</label>
              <input
                type="text"
                id="location.zipCode"
                name="location.zipCode"
                value={formData.location.zipCode}
                onChange={onChange}
                placeholder="ZIP Code"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <h3 className="text-xl font-bold text-gray-800 mt-8 mb-4 pb-2 border-b-2 border-gray-200">Pickup & Expiry</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="pickupTiming.startTime" className="block text-gray-700 font-medium mb-2">Pickup Start Time *</label>
              <input
                type="datetime-local"
                id="pickupTiming.startTime"
                name="pickupTiming.startTime"
                value={formData.pickupTiming.startTime}
                onChange={onChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label htmlFor="pickupTiming.endTime" className="block text-gray-700 font-medium mb-2">Pickup End Time *</label>
              <input
                type="datetime-local"
                id="pickupTiming.endTime"
                name="pickupTiming.endTime"
                value={formData.pickupTiming.endTime}
                onChange={onChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="expiryDate" className="block text-gray-700 font-medium mb-2">Expiry Date *</label>
            <input
              type="date"
              id="expiryDate"
              name="expiryDate"
              value={formData.expiryDate}
              onChange={onChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            />
          </div>

          <h3 className="text-xl font-bold text-gray-800 mt-8 mb-4 pb-2 border-b-2 border-gray-200">Dietary Information</h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="dietaryInfo.isVegetarian"
                checked={formData.dietaryInfo.isVegetarian}
                onChange={onChange}
                className="w-5 h-5 text-green-500 border-gray-300 rounded focus:ring-green-500"
              />
              <span className="text-gray-700">Vegetarian</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="dietaryInfo.isVegan"
                checked={formData.dietaryInfo.isVegan}
                onChange={onChange}
                className="w-5 h-5 text-green-500 border-gray-300 rounded focus:ring-green-500"
              />
              <span className="text-gray-700">Vegan</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="dietaryInfo.isGlutenFree"
                checked={formData.dietaryInfo.isGlutenFree}
                onChange={onChange}
                className="w-5 h-5 text-green-500 border-gray-300 rounded focus:ring-green-500"
              />
              <span className="text-gray-700">Gluten-Free</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="dietaryInfo.containsNuts"
                checked={formData.dietaryInfo.containsNuts}
                onChange={onChange}
                className="w-5 h-5 text-green-500 border-gray-300 rounded focus:ring-green-500"
              />
              <span className="text-gray-700">Contains Nuts</span>
            </label>
          </div>

          <div className="flex gap-4 pt-6 border-t-2 border-gray-200">
            <button type="submit" className="flex-1 bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed" disabled={loading}>
              {loading ? (isEditMode ? 'Updating...' : 'Posting...') : (isEditMode ? 'Update Food' : 'Share Food')}
            </button>
            <button 
              type="button" 
              className="flex-1 bg-gray-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-all duration-300"
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
