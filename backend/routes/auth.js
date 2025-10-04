const express = require('express');
const {
  register,
  login,
  getMe,
  updateDetails,
  updatePassword,
  getUsers,
  getUser,
  updateUser,
  deleteUser
} = require('../controllers/authController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/updatedetails', protect, updateDetails);
router.put('/updatepassword', protect, updatePassword);

// Admin routes
router.get('/users', protect, authorize('admin'), getUsers);
router.get('/users/:id', protect, authorize('admin'), getUser);
router.put('/users/:id', protect, authorize('admin'), updateUser);
router.delete('/users/:id', protect, authorize('admin'), deleteUser);

module.exports = router;
