import Food from '../models/Food.js';
import ErrorResponse from '../config/ErrorResponse.js';
import { v2 as cloudinary } from 'cloudinary';

// Helper function to extract public_id from Cloudinary URL
const extractPublicId = (url) => {
  if (!url || !url.includes('cloudinary.com')) return null;
  
  // Extract public_id from URL: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/public_id.ext
  const parts = url.split('/');
  const uploadIndex = parts.indexOf('upload');
  if (uploadIndex === -1) return null;
  
  // Get everything after version number (v1234567890)
  const pathAfterUpload = parts.slice(uploadIndex + 2).join('/');
  // Remove file extension
  return pathAfterUpload.replace(/\.[^/.]+$/, '');
};

// Helper function to delete Cloudinary images
const deleteCloudinaryImages = async (imageUrls) => {
  if (!imageUrls || imageUrls.length === 0) return;
  
  const deletePromises = imageUrls.map(async (url) => {
    const publicId = extractPublicId(url);
    if (publicId) {
      try {
        await cloudinary.uploader.destroy(publicId);
        console.log(`Deleted Cloudinary image: ${publicId}`);
      } catch (error) {
        console.error(`Failed to delete Cloudinary image ${publicId}:`, error.message);
      }
    }
  });
  
  await Promise.allSettled(deletePromises);
};

// @desc    Get all food posts
// @route   GET /api/food
// @access  Public
export const getFoods = async (req, res, next) => {
  try {
    let query;

    // Copy req.query
    const reqQuery = { ...req.query };

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit', 'city', 'state'];
    
    // Extract city and state before removing them
    const citySearch = req.query.city;
    const stateSearch = req.query.state;
    
    removeFields.forEach(param => delete reqQuery[param]);

    // Add filters for active food
    reqQuery.isActive = true;

    // Create query string
    let queryStr = JSON.stringify(reqQuery);

    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // Parse query
    let parsedQuery = JSON.parse(queryStr);

    // Handle city search with case-insensitive partial matching
    if (citySearch && citySearch.trim() !== '') {
      parsedQuery['location.city'] = { $regex: citySearch.trim(), $options: 'i' };
    }

    // Handle state search with case-insensitive partial matching
    if (stateSearch && stateSearch.trim() !== '') {
      parsedQuery['location.state'] = { $regex: stateSearch.trim(), $options: 'i' };
    }

    // Finding resource
    query = Food.find(parsedQuery).populate('donor', 'name email phone');

    // Select Fields
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    }

    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Food.countDocuments(parsedQuery);

    query = query.skip(startIndex).limit(limit);

    // Executing query
    const foods = await query;

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: foods.length,
      total,
      pagination,
      data: foods
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single food post
// @route   GET /api/food/:id
// @access  Public
export const getFood = async (req, res, next) => {
  try {
    const food = await Food.findById(req.params.id)
      .populate('donor', 'name email phone address')
      .populate('claimedBy', 'name email phone');

    if (!food) {
      return next(new ErrorResponse(`Food not found with id of ${req.params.id}`, 404));
    }

    // Increment views
    food.views += 1;
    await food.save();

    res.status(200).json({
      success: true,
      data: food
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new food post
// @route   POST /api/food
// @access  Private
export const createFood = async (req, res, next) => {
  try {
    // Log request body for debugging (always for now)
    console.log('=== CREATE FOOD DEBUG ===');
    console.log('Raw req.body:', JSON.stringify(req.body, null, 2));
    console.log('req.body.images type:', typeof req.body.images);
    console.log('req.body.images value:', req.body.images);
    console.log('Is Array?:', Array.isArray(req.body.images));
    console.log('=== END DEBUG ===');

    // Add user to req.body
    req.body.donor = req.user.id;

    // Validate required fields before attempting to create
    const requiredFields = ['title', 'description', 'quantity', 'category'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return next(new ErrorResponse(`Missing required fields: ${missingFields.join(', ')}`, 400));
    }

    // Validate location object
    if (!req.body.location || !req.body.location.address || !req.body.location.city) {
      return next(new ErrorResponse('Location with address and city is required', 400));
    }

    // Validate pickup timing
    if (!req.body.pickupTiming || !req.body.pickupTiming.startTime || !req.body.pickupTiming.endTime) {
      return next(new ErrorResponse('Pickup timing with start and end time is required', 400));
    }

    // Validate expiry date
    if (!req.body.expiryDate) {
      return next(new ErrorResponse('Expiry date is required', 400));
    }

    // Images should be provided as Cloudinary URLs in the request body
    // Images are optional, but if provided should be an array
    if (req.body.images && !Array.isArray(req.body.images)) {
      req.body.images = [req.body.images];
    }
    
    const food = await Food.create(req.body);

    res.status(201).json({
      success: true,
      data: food
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update food post
// @route   PUT /api/food/:id
// @access  Private
export const updateFood = async (req, res, next) => {
  try {
    // Log request body for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('Update Food Request Body:', JSON.stringify(req.body, null, 2));
    }

    let food = await Food.findById(req.params.id);

    if (!food) {
      return next(new ErrorResponse(`Food not found with id of ${req.params.id}`, 404));
    }

    // Make sure user is food donor or admin
    if (food.donor.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this food post`, 403));
    }

    // If new images are provided, delete old Cloudinary images
    if (req.body.images && req.body.images.length > 0) {
      const oldImages = food.images || [];
      if (oldImages.length > 0) {
        await deleteCloudinaryImages(oldImages);
      }
    }

    // Images should be an array
    if (req.body.images && !Array.isArray(req.body.images)) {
      req.body.images = [req.body.images];
    }

    food = await Food.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: food
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete food post
// @route   DELETE /api/food/:id
// @access  Private
export const deleteFood = async (req, res, next) => {
  try {
    const food = await Food.findById(req.params.id);

    if (!food) {
      return next(new ErrorResponse(`Food not found with id of ${req.params.id}`, 404));
    }

    // Make sure user is food donor or admin
    if (food.donor.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse(`User ${req.user.id} is not authorized to delete this food post`, 403));
    }

    // Regular users: soft delete (set isActive to false)
    // Admins: can choose to hard delete
    if (req.user.role === 'admin') {
      // Admin can hard delete - delete associated Cloudinary images
      if (food.images && food.images.length > 0) {
        await deleteCloudinaryImages(food.images);
      }
      await food.deleteOne();
      
      res.status(200).json({
        success: true,
        message: 'Food post permanently deleted',
        data: {}
      });
    } else {
      // Regular user: soft delete
      food.isActive = false;
      await food.save();
      
      res.status(200).json({
        success: true,
        message: 'Food post deactivated successfully',
        data: {}
      });
    }
  } catch (err) {
    next(err);
  }
};

// @desc    Claim food post
// @route   PUT /api/food/:id/claim
// @access  Private
export const claimFood = async (req, res, next) => {
  try {
    const food = await Food.findById(req.params.id);

    if (!food) {
      return next(new ErrorResponse(`Food not found with id of ${req.params.id}`, 404));
    }

    // Check if food is available
    if (food.claimStatus !== 'available') {
      return next(new ErrorResponse(`This food is ${food.claimStatus}`, 400));
    }

    // Check if user is trying to claim their own food
    if (food.donor.toString() === req.user.id) {
      return next(new ErrorResponse('You cannot claim your own food post', 400));
    }

    // Update food post
    food.claimStatus = 'claimed';
    food.claimedBy = req.user.id;
    food.claimedAt = Date.now();

    await food.save();

    // Populate the food data with donor and claimer details for socket emission
    await food.populate('donor', 'name email');
    await food.populate('claimedBy', 'name email');

    // Emit real-time event to notify donor and all connected clients
    const io = req.app.locals.io;
    if (io) {
      const eventData = {
        foodId: food._id,
        foodTitle: food.title,
        claimedBy: {
          id: req.user.id,
          name: req.user.name
        },
        donor: {
          id: food.donor._id,
          name: food.donor.name
        },
        timestamp: new Date()
      };

      // Emit to all connected clients
      io.emit('foodClaimed', eventData);

      // Also emit to specific donor's room if they're connected
      io.to(`user_${food.donor._id}`).emit('foodClaimedNotification', eventData);
      
      console.log('Socket event emitted: foodClaimed', eventData);
    }

    res.status(200).json({
      success: true,
      data: food
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Mark food as completed
// @route   PUT /api/food/:id/complete
// @access  Private
export const completeFood = async (req, res, next) => {
  try {
    const food = await Food.findById(req.params.id);

    if (!food) {
      return next(new ErrorResponse(`Food not found with id of ${req.params.id}`, 404));
    }

    // Only donor or admin can mark as completed
    if (food.donor.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse(`User ${req.user.id} is not authorized to complete this food post`, 403));
    }

    food.claimStatus = 'completed';
    await food.save();

    // Populate the food data for socket emission
    await food.populate('donor', 'name email');
    await food.populate('claimedBy', 'name email');

    // Emit real-time event to notify claimer and all connected clients
    const io = req.app.locals.io;
    if (io) {
      const eventData = {
        foodId: food._id,
        foodTitle: food.title,
        donor: {
          id: food.donor._id,
          name: food.donor.name
        },
        claimedBy: food.claimedBy ? {
          id: food.claimedBy._id,
          name: food.claimedBy.name
        } : null,
        timestamp: new Date()
      };

      // Emit to all connected clients
      io.emit('foodCompleted', eventData);

      // Also emit to specific claimer's room if food was claimed
      if (food.claimedBy) {
        io.to(`user_${food.claimedBy._id}`).emit('foodCompletedNotification', eventData);
      }
      
      console.log('Socket event emitted: foodCompleted', eventData);
    }

    res.status(200).json({
      success: true,
      data: food
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get my food posts (as donor)
// @route   GET /api/food/my/donations
// @access  Private
export const getMyDonations = async (req, res, next) => {
  try {
    const total = await Food.countDocuments({ donor: req.user.id });
    const foods = await Food.find({ donor: req.user.id })
      .populate('claimedBy', 'name email phone')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: foods.length,
      total,
      data: foods
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get my claimed food posts
// @route   GET /api/food/my/claims
// @access  Private
export const getMyClaims = async (req, res, next) => {
  try {
    const total = await Food.countDocuments({ claimedBy: req.user.id });
    const foods = await Food.find({ claimedBy: req.user.id })
      .populate('donor', 'name email phone address')
      .sort('-claimedAt');

    res.status(200).json({
      success: true,
      count: foods.length,
      total,
      data: foods
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Search food by location
// @route   GET /api/food/search/location
// @access  Public
export const searchByLocation = async (req, res, next) => {
  try {
    const { city, state } = req.query;

    if (!city) {
      return next(new ErrorResponse('Please provide a city', 400));
    }

    const query = {
      'location.city': new RegExp(city, 'i'),
      claimStatus: 'available',
      isActive: true
    };

    if (state) {
      query['location.state'] = new RegExp(state, 'i');
    }

    const total = await Food.countDocuments(query);
    const foods = await Food.find(query)
      .populate('donor', 'name email phone')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: foods.length,
      total,
      data: foods
    });
  } catch (err) {
    next(err);
  }
};

// ADMIN ONLY ENDPOINTS

// @desc    Get all food posts (including inactive) - Admin only
// @route   GET /api/food/admin/all
// @access  Private/Admin
export const getAllFoodsAdmin = async (req, res, next) => {
  try {
    const reqQuery = { ...req.query };

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit'];
    removeFields.forEach(param => delete reqQuery[param]);

    // Don't filter by isActive for admin - show all posts
    let queryStr = JSON.stringify(reqQuery);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    let query = Food.find(JSON.parse(queryStr))
      .populate('donor', 'name email phone')
      .populate('claimedBy', 'name email phone');

    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Food.countDocuments(JSON.parse(queryStr));

    query = query.skip(startIndex).limit(limit);

    const foods = await query;

    // Pagination result
    const pagination = {};
    if (endIndex < total) {
      pagination.next = { page: page + 1, limit };
    }
    if (startIndex > 0) {
      pagination.prev = { page: page - 1, limit };
    }

    res.status(200).json({
      success: true,
      count: foods.length,
      total,
      pagination,
      data: foods
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete any food post - Admin only
// @route   DELETE /api/food/admin/:id
// @access  Private/Admin
export const deleteFoodAdmin = async (req, res, next) => {
  try {
    const food = await Food.findById(req.params.id);

    if (!food) {
      return next(new ErrorResponse(`Food not found with id of ${req.params.id}`, 404));
    }

    // Delete associated Cloudinary images
    if (food.images && food.images.length > 0) {
      await deleteCloudinaryImages(food.images);
    }

    // Admin can delete any post
    await food.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Food post deleted successfully',
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get food statistics - Admin only
// @route   GET /api/food/admin/stats
// @access  Private/Admin
export const getFoodStats = async (req, res, next) => {
  try {
    const totalFoods = await Food.countDocuments();
    const activeFoods = await Food.countDocuments({ isActive: true });
    const availableFoods = await Food.countDocuments({ 
      isActive: true, 
      claimStatus: 'available' 
    });
    const claimedFoods = await Food.countDocuments({ 
      claimStatus: 'claimed' 
    });
    const completedFoods = await Food.countDocuments({ 
      claimStatus: 'completed' 
    });

    // Get category breakdown
    const categoryStats = await Food.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalFoods,
        activeFoods,
        availableFoods,
        claimedFoods,
        completedFoods,
        categoryStats
      }
    });
  } catch (err) {
    next(err);
  }
};
