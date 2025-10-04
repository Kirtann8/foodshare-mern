const Food = require('../models/Food');
const ErrorResponse = require('../config/ErrorResponse');
const path = require('path');

// @desc    Get all food posts
// @route   GET /api/food
// @access  Public
exports.getFoods = async (req, res, next) => {
  try {
    let query;

    // Copy req.query
    const reqQuery = { ...req.query };

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit'];
    removeFields.forEach(param => delete reqQuery[param]);

    // Add filters for active and available food
    reqQuery.isActive = true;

    // Create query string
    let queryStr = JSON.stringify(reqQuery);

    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // Finding resource
    query = Food.find(JSON.parse(queryStr)).populate('donor', 'name email phone');

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
    const total = await Food.countDocuments(JSON.parse(queryStr));

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
exports.getFood = async (req, res, next) => {
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
exports.createFood = async (req, res, next) => {
  try {
    // Add user to req.body
    req.body.donor = req.user.id;

    // Handle uploaded images
    if (req.files && req.files.length > 0) {
      req.body.images = req.files.map(file => `/uploads/${file.filename}`);
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
exports.updateFood = async (req, res, next) => {
  try {
    let food = await Food.findById(req.params.id);

    if (!food) {
      return next(new ErrorResponse(`Food not found with id of ${req.params.id}`, 404));
    }

    // Make sure user is food donor or admin
    if (food.donor.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this food post`, 403));
    }

    // Handle uploaded images
    if (req.files && req.files.length > 0) {
      req.body.images = req.files.map(file => `/uploads/${file.filename}`);
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
exports.deleteFood = async (req, res, next) => {
  try {
    const food = await Food.findById(req.params.id);

    if (!food) {
      return next(new ErrorResponse(`Food not found with id of ${req.params.id}`, 404));
    }

    // Make sure user is food donor or admin
    if (food.donor.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse(`User ${req.user.id} is not authorized to delete this food post`, 403));
    }

    await food.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Claim food post
// @route   PUT /api/food/:id/claim
// @access  Private
exports.claimFood = async (req, res, next) => {
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
exports.completeFood = async (req, res, next) => {
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
exports.getMyDonations = async (req, res, next) => {
  try {
    const foods = await Food.find({ donor: req.user.id })
      .populate('claimedBy', 'name email phone')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: foods.length,
      data: foods
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get my claimed food posts
// @route   GET /api/food/my/claims
// @access  Private
exports.getMyClaims = async (req, res, next) => {
  try {
    const foods = await Food.find({ claimedBy: req.user.id })
      .populate('donor', 'name email phone address')
      .sort('-claimedAt');

    res.status(200).json({
      success: true,
      count: foods.length,
      data: foods
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Search food by location
// @route   GET /api/food/search/location
// @access  Public
exports.searchByLocation = async (req, res, next) => {
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

    const foods = await Food.find(query)
      .populate('donor', 'name email phone')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: foods.length,
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
exports.getAllFoodsAdmin = async (req, res, next) => {
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
exports.deleteFoodAdmin = async (req, res, next) => {
  try {
    const food = await Food.findById(req.params.id);

    if (!food) {
      return next(new ErrorResponse(`Food not found with id of ${req.params.id}`, 404));
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
exports.getFoodStats = async (req, res, next) => {
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
