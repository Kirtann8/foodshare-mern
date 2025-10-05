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
import { upload, handleMulterError } from '../middleware/upload.js';

// Public routes
router.get('/', getFoods);
router.get('/search/location', searchByLocation);
router.get('/:id', getFood);

// Protected routes
router.post('/', protect, upload.array('images', 5), handleMulterError, createFood);
router.put('/:id', protect, upload.array('images', 5), handleMulterError, updateFood);
router.delete('/:id', protect, deleteFood);
router.put('/:id/claim', protect, claimFood);
router.put('/:id/complete', protect, completeFood);

// User-specific routes
router.get('/my/donations', protect, getMyDonations);
router.get('/my/claims', protect, getMyClaims);

// Admin routes
router.get('/admin/all', protect, authorize('admin'), getAllFoodsAdmin);
router.get('/admin/stats', protect, authorize('admin'), getFoodStats);
router.delete('/admin/:id', protect, authorize('admin'), deleteFoodAdmin);

export default router;
