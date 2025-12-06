import Food from '../models/Food.js';
import User from '../models/User.js';
import VolunteerAssignment from '../models/VolunteerAssignment.js';
import ErrorResponse from '../config/ErrorResponse.js';
import { v2 as cloudinary } from 'cloudinary';
import { sendFoodApprovalNotification, sendVolunteerAssignmentNotification, sendFoodClaimNotification, sendFoodCompletionNotification, sendCollectionStatusNotification } from '../services/notificationService.js';
import { notifyFoodApproval, notifyVolunteerAssignment, notifyFoodClaim, notifyAssignmentAcceptance, notifyCollectionStatusUpdate } from '../services/socketService.js';
import axios from 'axios';

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
    
    // If specifically filtering for available, exclude distributed and completed
    if (reqQuery.claimStatus === 'available') {
      reqQuery.claimStatus = 'available';
      reqQuery.collectionStatus = { $nin: ['distributed', 'completed'] };
    }
    // If filtering for claimed, include distributed food
    else if (reqQuery.claimStatus === 'claimed') {
      // Don't add collection status filter for claimed - let distributed food show as claimed
    }
    // For other filters, exclude distributed food
    else if (!reqQuery.claimStatus || reqQuery.claimStatus === '') {
      // Show all except distributed when no specific claim status filter
      reqQuery.collectionStatus = { $ne: 'distributed' };
    }

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

    // Send email notification to donor
    try {
      await sendFoodClaimNotification({
        email: food.donor.email,
        name: food.donor.name,
        foodTitle: food.title,
        claimerName: req.user.name,
        claimerEmail: req.user.email
      });
    } catch (emailError) {
      console.error('Failed to send claim email:', emailError);
    }

    // Send real-time notification
    const io = req.app.locals.io;
    if (io) {
      notifyFoodClaim(io, food, req.user);
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

    // Send email notification to claimer if food was claimed
    if (food.claimedBy) {
      try {
        await sendFoodCompletionNotification({
          email: food.claimedBy.email,
          name: food.claimedBy.name,
          foodTitle: food.title,
          donorName: food.donor.name
        });
      } catch (emailError) {
        console.error('Failed to send completion email to claimer:', emailError);
      }
    }

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

    // Send email notification
    try {
      await sendFoodApprovalNotification({
        email: food.donor.email,
        name: food.donor.name,
        foodTitle: food.title,
        status: 'approved'
      });
    } catch (emailError) {
      console.error('Failed to send approval email:', emailError);
    }

    // Send real-time notification
    const io = req.app.locals.io;
    if (io) {
      notifyFoodApproval(io, food, req.user, 'approved');
    }

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

    // Send email notification
    try {
      await sendFoodApprovalNotification({
        email: food.donor.email,
        name: food.donor.name,
        foodTitle: food.title,
        status: 'rejected',
        reason: reason.trim()
      });
    } catch (emailError) {
      console.error('Failed to send rejection email:', emailError);
    }

    // Send real-time notification
    const io = req.app.locals.io;
    if (io) {
      notifyFoodApproval(io, food, req.user, 'rejected');
    }

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
const calculateAssignmentScore = async (volunteer, foodPost) => {
  let score = 100; // Base score
  
  // Location matching (higher score for same city)
  if (volunteer.volunteerApplication?.serviceArea && foodPost.location?.city) {
    const volunteerCity = volunteer.volunteerApplication.serviceArea.toLowerCase();
    const foodCity = foodPost.location.city.toLowerCase();
    
    if (volunteerCity.includes(foodCity) || foodCity.includes(volunteerCity)) {
      score += 100; // Same city bonus (increased)
    } else {
      // Penalty for different cities
      score -= 50;
    }
  }
  
  // Volunteer workload (lower score for busy volunteers)
  const activeAssignments = await VolunteerAssignment.countDocuments({
    volunteer: volunteer._id,
    status: { $in: ['assigned', 'accepted', 'collected'] }
  });
  
  // Reduce score based on current workload
  score -= (activeAssignments * 25);
  
  return Math.max(score, 0); // Ensure score doesn't go negative
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
      const volunteerScores = await Promise.all(
        volunteers.map(async volunteer => ({
          volunteer,
          score: await calculateAssignmentScore(volunteer, food)
        }))
      );

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

    // Send email notification to volunteer
    try {
      await sendVolunteerAssignmentNotification({
        email: volunteer.email,
        name: volunteer.name,
        foodTitle: food.title,
        donorName: food.donor.name,
        pickupAddress: food.location.address
      });
    } catch (emailError) {
      console.error('Failed to send assignment email:', emailError);
    }

    // Send real-time notification
    const io = req.app.locals.io;
    if (io) {
      notifyVolunteerAssignment(io, assignment, food, volunteer);
    }

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

    // Update food status and sync claim status
    food.collectionStatus = status;
    
    // Update claim status based on collection status
    if (status === 'distributed' || status === 'collected') {
      food.claimStatus = 'claimed';
    }
    
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

    // Send email notification to donor about collection status update
    try {
      await sendCollectionStatusNotification({
        email: food.donor.email,
        name: food.donor.name,
        foodTitle: food.title,
        status,
        distributionDetails
      });
    } catch (emailError) {
      console.error('Failed to send collection status email:', emailError);
    }

    // Send real-time notification
    const io = req.app.locals.io;
    if (io) {
      notifyCollectionStatusUpdate(io, food, req.user, status, distributionDetails);
    }

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

    // Send real-time notification
    const io = req.app.locals.io;
    if (io) {
      notifyAssignmentAcceptance(io, assignment, assignment.foodPost, req.user);
    }
    
    res.status(200).json({
      success: true,
      message: 'Assignment accepted successfully',
      data: assignment
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Reject volunteer assignment
// @route   PUT /api/food/volunteer/assignments/:id/reject
// @access  Private/Volunteer
export const rejectAssignment = async (req, res, next) => {
  try {
    const { reason } = req.body;
    
    if (!reason || reason.trim().length === 0) {
      return next(new ErrorResponse('Rejection reason is required', 400));
    }
    
    const assignment = await VolunteerAssignment.findById(req.params.id);
    
    if (!assignment) {
      return next(new ErrorResponse('Assignment not found', 404));
    }
    
    if (assignment.volunteer.toString() !== req.user.id) {
      return next(new ErrorResponse('Not authorized to reject this assignment', 403));
    }
    
    if (assignment.status !== 'assigned') {
      return next(new ErrorResponse('Assignment cannot be rejected in current status', 400));
    }
    
    // Update assignment status
    assignment.status = 'rejected';
    assignment.rejectedAt = new Date();
    assignment.rejectionReason = reason.trim();
    await assignment.save();
    
    // Reset food post volunteer assignment
    const food = await Food.findById(assignment.foodPost);
    if (food) {
      food.volunteerAssigned = null;
      food.collectionStatus = 'not_assigned';
      await food.save();
    }
    
    res.status(200).json({
      success: true,
      message: 'Assignment rejected successfully',
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
    
    // Prioritize volunteers from the same city
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
        
        // Calculate city match score for better assignment
        let cityMatchScore = 0;
        if (city && volunteer.volunteerApplication?.serviceArea) {
          const volunteerCity = volunteer.volunteerApplication.serviceArea.toLowerCase();
          const foodCity = city.toLowerCase();
          if (volunteerCity.includes(foodCity) || foodCity.includes(volunteerCity)) {
            cityMatchScore = 100;
          }
        }
        
        return {
          ...volunteer.toObject(),
          activeAssignments,
          cityMatchScore
        };
      })
    );
    
    // Sort by city match score first, then by active assignments
    volunteersWithStats.sort((a, b) => {
      if (a.cityMatchScore !== b.cityMatchScore) {
        return b.cityMatchScore - a.cityMatchScore;
      }
      return a.activeAssignments - b.activeAssignments;
    });
    
    res.status(200).json({
      success: true,
      count: volunteersWithStats.length,
      data: volunteersWithStats
    });
  } catch (err) {
    next(err);
  }
};
// @desc    Get food posts assigned to current volunteer
// @route   GET /api/food/volunteer/assigned-foods
// @access  Private/Volunteer/Admin
// @desc    Test AI service with sample data
// @route   POST /api/food/test-ai
// @access  Private/Admin
export const testAIService = async (req, res, next) => {
  try {
    console.log('Testing AI service...');
    
    const response = await axios.post('http://localhost:5001/test-prediction', {}, {
      timeout: 30000
    });
    
    res.status(200).json({
      success: true,
      testResult: response.data,
      message: 'AI service test completed successfully'
    });
    
  } catch (error) {
    console.error('AI service test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      return next(new ErrorResponse('AI service is not running', 503));
    }
    
    next(new ErrorResponse('AI service test failed', 500));
  }
};

export const getAssignedFoods = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const startIndex = (page - 1) * limit;
    
    // Find food posts assigned to current volunteer
    const query = {
      volunteerAssigned: req.user.id,
      isActive: true
    };
    
    const total = await Food.countDocuments(query);
    const foods = await Food.find(query)
      .populate({
        path: 'donor',
        select: 'name email phone address'
      })
      .populate('volunteerAssigned', 'name email phone')
      .sort('-createdAt')
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
      count: foods.length,
      total,
      pagination,
      data: foods
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Assess food quality using AI
// @route   POST /api/food/assess-quality
// @access  Private
export const assessFoodQuality = async (req, res, next) => {
  try {
    const { image, images } = req.body;
    
    if (!image && !images) {
      return next(new ErrorResponse('Image data is required for assessment', 400));
    }

    // Prepare request data
    const requestData = {};
    if (images) {
      requestData.images = images;
    } else {
      requestData.image = image;
    }

    console.log('Calling AI service for food assessment...');
    
    // Call Enhanced Python CV service with retry logic
    let response;
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        response = await axios.post('http://localhost:5001/assess-food', requestData, {
          timeout: 45000, // 45 second timeout for enhanced processing
          headers: {
            'Content-Type': 'application/json'
          }
        });
        break; // Success, exit retry loop
      } catch (retryError) {
        attempts++;
        console.log(`AI service attempt ${attempts} failed:`, retryError.message);
        
        if (attempts >= maxAttempts) {
          throw retryError; // Re-throw the last error
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
      }
    }

    // Check if AI service returned an error
    if (!response.data.success) {
      return next(new ErrorResponse(response.data.error || 'AI assessment failed', 400));
    }

    console.log('AI assessment completed successfully');
    
    res.status(200).json({
      success: true,
      data: response.data.data,
      message: 'Food quality assessment completed',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('CV Assessment Error:', error.message);
    
    // Handle different types of errors
    if (error.code === 'ECONNREFUSED') {
      return next(new ErrorResponse(
        'AI service is not running. Please start the Enhanced AI service using: npm run start-cv or python scripts/start_ai_service.py', 
        503
      ));
    }
    
    if (error.code === 'ETIMEDOUT') {
      return next(new ErrorResponse(
        'AI service timeout. The image might be too large or complex. Please try with a smaller image.', 
        408
      ));
    }
    
    if (error.response?.status === 400) {
      return next(new ErrorResponse(
        error.response.data?.error || 'Invalid image data provided', 
        400
      ));
    }
    
    if (error.response?.status === 500) {
      return next(new ErrorResponse(
        'AI service internal error. Please try again or contact support.', 
        500
      ));
    }
    
    // Generic error
    next(new ErrorResponse(
      `Food quality assessment failed: ${error.message}. Please ensure the AI service is running and try again.`, 
      500
    ));
  }
};

// @desc    Check AI service status
// @route   GET /api/food/ai-status
// @access  Private
export const checkAIServiceStatus = async (req, res, next) => {
  try {
    console.log('Checking AI service status...');
    
    const response = await axios.get('http://localhost:5001/health', {
      timeout: 10000 // 10 second timeout
    });
    
    res.status(200).json({
      success: true,
      aiService: {
        status: 'running',
        ...response.data
      }
    });
    
  } catch (error) {
    console.error('AI service status check failed:', error.message);
    
    let statusMessage = 'AI service is not responding';
    let statusCode = 503;
    
    if (error.code === 'ECONNREFUSED') {
      statusMessage = 'AI service is not running. Please start it using: npm run start-cv';
    } else if (error.code === 'ETIMEDOUT') {
      statusMessage = 'AI service is not responding (timeout)';
    }
    
    res.status(statusCode).json({
      success: false,
      aiService: {
        status: 'offline',
        error: statusMessage,
        instructions: [
          'Start the AI service: npm run start-cv',
          'Or manually: python scripts/start_ai_service.py',
          'Or use batch file: scripts/start-enhanced-ai.bat'
        ]
      }
    });
  }
};

// @desc    Get AI service models status
// @route   GET /api/food/ai-models
// @access  Private/Admin
export const getAIModelsStatus = async (req, res, next) => {
  try {
    console.log('Checking AI models status...');
    
    const response = await axios.get('http://localhost:5001/models/status', {
      timeout: 15000 // 15 second timeout
    });
    
    res.status(200).json({
      success: true,
      models: response.data
    });
    
  } catch (error) {
    console.error('AI models status check failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      return next(new ErrorResponse('AI service is not running', 503));
    }
    
    next(new ErrorResponse('Failed to check AI models status', 500));
  }
};