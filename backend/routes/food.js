const express = require('express');
const {
  getFoods,
  getFood,
  createFood,
  updateFood,
  deleteFood,
  claimFood,
  completeFood,
  getMyDonations,
  getMyClaims,
  searchByLocation
} = require('../controllers/foodController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const { upload, handleMulterError } = require('../middleware/upload');

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

module.exports = router;
