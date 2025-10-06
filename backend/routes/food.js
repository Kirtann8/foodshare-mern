import express from 'express';
import {
  getFoods,
  getFood,
  createFood,
  updateFood,
  deleteFood,
  claimFood,
  completeFood,
  getMyDonations,
  getMyClaims,
  searchByLocation,
  getAllFoodsAdmin,
  deleteFoodAdmin,
  getFoodStats
} from '../controllers/foodController.js';

const router = express.Router();

import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { foodSchemas } from '../validators/foodValidators.js';

// Public routes
router.get('/', validate(foodSchemas.getFoods), getFoods);
router.get('/search/location', validate(foodSchemas.searchLocation), searchByLocation);
router.get('/:id', validate(foodSchemas.foodId), getFood);

// Protected routes - now accept Cloudinary URLs in payload
router.post('/', protect, validate(foodSchemas.createFood), createFood);
router.put('/:id', protect, validate(foodSchemas.updateFood), updateFood);
router.delete('/:id', protect, validate(foodSchemas.foodId), deleteFood);
router.put('/:id/claim', protect, validate(foodSchemas.foodId), claimFood);
router.put('/:id/complete', protect, validate(foodSchemas.foodId), completeFood);

// User-specific routes
router.get('/my/donations', protect, getMyDonations);
router.get('/my/claims', protect, getMyClaims);

// Admin routes
router.get('/admin/all', protect, authorize('admin'), validate(foodSchemas.getFoods), getAllFoodsAdmin);
router.get('/admin/stats', protect, authorize('admin'), getFoodStats);
router.delete('/admin/:id', protect, authorize('admin'), validate(foodSchemas.foodId), deleteFoodAdmin);

export default router;
