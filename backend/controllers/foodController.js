import Food from '../models/Food.js';
import User from '../models/User.js';
import VolunteerAssignment from '../models/VolunteerAssignment.js';
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

    // Add filters for active and approved food
    reqQuery.isActive = true;
    reqQuery.approvalStatus = 'approved';

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
      claimStatus: 'available',
      approvalStatus: 'approved'
    });
    const claimedFoods = await Food.countDocuments({ 
      claimStatus: 'claimed' 
    });
    const completedFoods = await Food.countDocuments({ 
      claimStatus: 'completed' 
    });
    const pendingApproval = await Food.countDocuments({ 
      approvalStatus: 'pending',
      isActive: true
    });
    const rejectedFoods = await Food.countDocuments({ 
      approvalStatus: 'rejected'
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
        pendingApproval,
        rejectedFoods,
        categoryStats
      }
    });
  } catch (err) {
    next(err);
  }
};

// FOOD APPROVAL SYSTEM ENDPOINTS

// @desc    Get pending food posts for approval
// @route   GET /api/food/admin/pending
// @access  Private/Volunteer/Admin
export const getPendingFoodPosts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    const query = {
      approvalStatus: 'pending',
      isActive: true
    };
    
    const total = await Food.countDocuments(query);
    const foods = await Food.find(query)
      .populate('donor', 'name email phone')
      .sort('-createdAt')
      .skip(startIndex)
      .limit(limit);

    const pagination = {};
    if (startIndex + limit < total) {
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

// @desc    Approve food post
// @route   PUT /api/food/admin/:id/approve
// @access  Private/Volunteer/Admin
export const approveFoodPost = async (req, res, next) => {
  try {
    const food = await Food.findById(req.params.id);

    if (!food) {
      return next(new ErrorResponse(`Food not found with id of ${req.params.id}`, 404));
    }

    if (food.approvalStatus !== 'pending') {
      return next(new ErrorResponse(`Food post is already ${food.approvalStatus}`, 400));
    }

    food.approvalStatus = 'approved';
    food.approvedBy = req.user.id;
    food.approvedAt = Date.now();
    food.rejectionReason = undefined;

    await food.save();

    // Populate for response
    await food.populate('donor', 'name email');
    await food.populate('approvedBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Food post approved successfully',
      data: food
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Reject food post
// @route   PUT /api/food/admin/:id/reject
// @access  Private/Volunteer/Admin
export const rejectFoodPost = async (req, res, next) => {
  try {
    const { reason } = req.body;

    if (!reason || reason.trim().length === 0) {
      return next(new ErrorResponse('Rejection reason is required', 400));
    }

    const food = await Food.findById(req.params.id);

    if (!food) {
      return next(new ErrorResponse(`Food not found with id of ${req.params.id}`, 404));
    }

    if (food.approvalStatus !== 'pending') {
      return next(new ErrorResponse(`Food post is already ${food.approvalStatus}`, 400));
    }

    food.approvalStatus = 'rejected';
    food.approvedBy = req.user.id;
    food.approvedAt = Date.now();
    food.rejectionReason = reason.trim();

    await food.save();

    // Populate for response
    await food.populate('donor', 'name email');
    await food.populate('approvedBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Food post rejected successfully',
      data: food
    });
  } catch (err) {
    next(err);
  }
};

// Helper function to calculate assignment score based on location proximity and volunteer availability
const calculateAssignmentScore = (volunteer, foodPost) => {
  let score = 100; // Base score
  
  // Location matching (higher score for same city)
  if (volunteer.volunteerApplication?.serviceArea && foodPost.location?.city) {
    const volunteerCity = volunteer.volunteerApplication.serviceArea.toLowerCase();
    const foodCity = foodPost.location.city.toLowerCase();
    
    if (volunteerCity.includes(foodCity) || foodCity.includes(volunteerCity)) {
      score += 50; // Same city bonus
    }
  }
  
  // Volunteer workload (lower score for busy volunteers)
  // This would be calculated based on current assignments
  // For now, we'll use a simple random factor
  score += Math.random() * 20;
  
  return score;
};

// @desc    Auto-assign volunteer to approved food posts
// @route   POST /api/food/auto-assign
// @access  Private/Admin
export const autoAssignVolunteers = async (req, res, next) => {
  try {
    // Find approved food posts that need volunteer assignment
    const unassignedFoods = await Food.find({
      approvalStatus: 'approved',
      collectionStatus: 'not_assigned',
      isActive: true
    }).populate('donor', 'name email');

    if (unassignedFoods.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No food posts need volunteer assignment',
        data: { assigned: 0 }
      });
    }

    // Get available volunteers
    const volunteers = await User.find({
      role: { $in: ['volunteer', 'admin'] },
      isActive: true,
      'volunteerApplication.status': 'approved'
    });

    if (volunteers.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No volunteers available for assignment',
        data: { assigned: 0 }
      });
    }

    let assignedCount = 0;
    const assignments = [];

    for (const food of unassignedFoods) {
      // Calculate scores for all volunteers
      const volunteerScores = volunteers.map(volunteer => ({
        volunteer,
        score: calculateAssignmentScore(volunteer, food)
      }));

      // Sort by score (highest first)
      volunteerScores.sort((a, b) => b.score - a.score);

      // Assign to the best volunteer
      const bestVolunteer = volunteerScores[0].volunteer;
      
      // Update food post
      food.volunteerAssigned = bestVolunteer._id;
      food.collectionStatus = 'assigned';
      await food.save();

      // Create assignment record
      const assignment = await VolunteerAssignment.create({
        volunteer: bestVolunteer._id,
        foodPost: food._id,
        assignedBy: req.user.id,
        assignmentType: 'auto',
        assignmentScore: volunteerScores[0].score
      });

      assignments.push(assignment);
      assignedCount++;
    }

    res.status(200).json({
      success: true,
      message: `Successfully auto-assigned ${assignedCount} food posts to volunteers`,
      data: {
        assigned: assignedCount,
        assignments
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Assign volunteer to food post (Manual)
// @route   PUT /api/food/:id/assign-volunteer
// @access  Private/Admin
export const assignVolunteer = async (req, res, next) => {
  try {
    const { volunteerId } = req.body;

    if (!volunteerId) {
      return next(new ErrorResponse('Volunteer ID is required', 400));
    }

    const food = await Food.findById(req.params.id);
    if (!food) {
      return next(new ErrorResponse(`Food not found with id of ${req.params.id}`, 404));
    }

    if (food.approvalStatus !== 'approved') {
      return next(new ErrorResponse('Only approved food posts can be assigned to volunteers', 400));
    }

    // Verify volunteer exists and has volunteer role
    const volunteer = await User.findById(volunteerId);
    if (!volunteer || !['volunteer', 'admin'].includes(volunteer.role)) {
      return next(new ErrorResponse('Invalid volunteer ID', 400));
    }

    // Check if already assigned
    if (food.volunteerAssigned) {
      return next(new ErrorResponse('Food post is already assigned to a volunteer', 400));
    }

    food.volunteerAssigned = volunteerId;
    food.collectionStatus = 'assigned';
    await food.save();

    // Create assignment record
    const assignment = await VolunteerAssignment.create({
      volunteer: volunteerId,
      foodPost: food._id,
      assignedBy: req.user.id,
      assignmentType: 'manual'
    });

    // Populate for response
    await food.populate('volunteerAssigned', 'name email phone');
    await food.populate('donor', 'name email');

    res.status(200).json({
      success: true,
      message: 'Volunteer assigned successfully',
      data: { food, assignment }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update collection status with detailed tracking
// @route   PUT /api/food/:id/collection-status
// @access  Private/Volunteer/Admin
export const updateCollectionStatus = async (req, res, next) => {
  try {
    const { status, notes, distributionDetails } = req.body;

    if (!status || !['assigned', 'collected', 'distributed'].includes(status)) {
      return next(new ErrorResponse('Valid collection status is required', 400));
    }

    const food = await Food.findById(req.params.id);
    if (!food) {
      return next(new ErrorResponse(`Food not found with id of ${req.params.id}`, 404));
    }

    // Only assigned volunteer or admin can update status
    if (req.user.role !== 'admin' && food.volunteerAssigned?.toString() !== req.user.id) {
      return next(new ErrorResponse('Not authorized to update this food post status', 403));
    }

    // Update food status
    food.collectionStatus = status;
    await food.save();

    // Update assignment record
    const assignment = await VolunteerAssignment.findOne({
      foodPost: food._id,
      volunteer: food.volunteerAssigned
    });

    if (assignment) {
      assignment.status = status;
      if (notes) assignment.notes = notes;
      
      // Update timestamps based on status
      const now = new Date();
      switch (status) {
        case 'collected':
          assignment.collectedAt = now;
          break;
        case 'distributed':
          assignment.distributedAt = now;
          if (distributionDetails) {
            assignment.distributionDetails = distributionDetails;
          }
          break;
      }
      
      await assignment.save();
    }

    // Populate for response
    await food.populate('volunteerAssigned', 'name email phone');
    await food.populate('donor', 'name email');

    res.status(200).json({
      success: true,
      message: `Collection status updated to ${status}`,
      data: { food, assignment }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get volunteer assignments
// @route   GET /api/food/volunteer/assignments
// @access  Private/Volunteer/Admin
export const getVolunteerAssignments = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const startIndex = (page - 1) * limit;
    
    const query = { volunteer: req.user.id };
    if (status) {
      query.status = status;
    }
    
    const total = await VolunteerAssignment.countDocuments(query);
    const assignments = await VolunteerAssignment.find(query)
      .populate({
        path: 'foodPost',
        populate: {
          path: 'donor',
          select: 'name email phone address'
        }
      })
      .populate('assignedBy', 'name email')
      .sort('-assignedAt')
      .skip(startIndex)
      .limit(parseInt(limit));

    const pagination = {};
    if (startIndex + parseInt(limit) < total) {
      pagination.next = { page: parseInt(page) + 1, limit: parseInt(limit) };
    }
    if (startIndex > 0) {
      pagination.prev = { page: parseInt(page) - 1, limit: parseInt(limit) };
    }

    res.status(200).json({
      success: true,
      count: assignments.length,
      total,
      pagination,
      data: assignments
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Accept volunteer assignment
// @route   PUT /api/food/volunteer/assignments/:id/accept
// @access  Private/Volunteer
export const acceptAssignment = async (req, res, next) => {
  try {
    const assignment = await VolunteerAssignment.findById(req.params.id);
    
    if (!assignment) {
      return next(new ErrorResponse('Assignment not found', 404));
    }
    
    if (assignment.volunteer.toString() !== req.user.id) {
      return next(new ErrorResponse('Not authorized to accept this assignment', 403));
    }
    
    if (assignment.status !== 'assigned') {
      return next(new ErrorResponse('Assignment cannot be accepted in current status', 400));
    }
    
    assignment.status = 'accepted';
    assignment.acceptedAt = new Date();
    await assignment.save();
    
    await assignment.populate({
      path: 'foodPost',
      populate: {
        path: 'donor',
        select: 'name email phone address'
      }
    });
    
    res.status(200).json({
      success: true,
      message: 'Assignment accepted successfully',
      data: assignment
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get available volunteers for assignment
// @route   GET /api/food/volunteers/available
// @access  Private/Admin
export const getAvailableVolunteers = async (req, res, next) => {
  try {
    const { city, serviceArea } = req.query;
    
    let query = {
      role: { $in: ['volunteer', 'admin'] },
      isActive: true,
      'volunteerApplication.status': 'approved'
    };
    
    // Filter by service area if provided
    if (city || serviceArea) {
      const searchArea = city || serviceArea;
      query['volunteerApplication.serviceArea'] = { 
        $regex: searchArea, 
        $options: 'i' 
      };
    }
    
    const volunteers = await User.find(query)
      .select('name email phone volunteerApplication.serviceArea volunteerApplication.availability')
      .sort('name');
    
    // Get current assignment counts for each volunteer
    const volunteersWithStats = await Promise.all(
      volunteers.map(async (volunteer) => {
        const activeAssignments = await VolunteerAssignment.countDocuments({
          volunteer: volunteer._id,
          status: { $in: ['assigned', 'accepted', 'collected'] }
        });
        
        return {
          ...volunteer.toObject(),
          activeAssignments
        };
      })
    );
    
    res.status(200).json({
      success: true,
      count: volunteersWithStats.length,
      data: volunteersWithStats
    });
  } catch (err) {
    next(err);
  }
};
