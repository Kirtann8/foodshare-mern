import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  register,
  login,
  getMe,
  updateDetails,
  updatePassword,
  requestPasswordChangeOtp,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  googleAuth,
  refreshToken,
  logout,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword
} from '../controllers/authController.js';

const router = express.Router();

import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { authSchemas } from '../validators/authValidators.js';

// Strict rate limiting for authentication routes
// More lenient in development, strict in production
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 5 : 50, // 5 in production, 50 in development
  message: 'Too many authentication attempts, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false
});

// Very strict rate limiting for password-related routes
const passwordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.NODE_ENV === 'production' ? 3 : 20, // 3 in production, 20 in development
  message: 'Too many password change attempts, please try again after an hour',
  standardHeaders: true,
  legacyHeaders: false
});

router.post('/register', authLimiter, validate(authSchemas.register), register);
router.post('/login', authLimiter, validate(authSchemas.login), login);
router.post('/google', authLimiter, validate(authSchemas.googleAuth), googleAuth); // Google OAuth route
router.post('/refresh', refreshToken); // Refresh token endpoint
router.post('/logout', protect, logout); // Logout endpoint

// Email verification routes
router.post('/verify-email', authLimiter, validate(authSchemas.verifyEmail), verifyEmail);
router.post('/resend-verification', authLimiter, validate(authSchemas.resendVerification), resendVerification);

// Password reset routes
router.post('/forgot-password', authLimiter, validate(authSchemas.forgotPassword), forgotPassword);
router.post('/reset-password', authLimiter, validate(authSchemas.resetPassword), resetPassword);

router.get('/me', protect, getMe);
router.put('/updatedetails', protect, validate(authSchemas.updateDetails), updateDetails);
router.post('/request-password-change-otp', protect, passwordLimiter, validate(authSchemas.requestPasswordChangeOtp), requestPasswordChangeOtp);
router.put('/updatepassword', protect, passwordLimiter, validate(authSchemas.updatePassword), updatePassword);

// Admin routes
router.get('/users', protect, authorize('admin'), getUsers);
router.get('/users/:id', protect, authorize('admin'), validate(authSchemas.userId), getUser);
router.put('/users/:id', protect, authorize('admin'), validate(authSchemas.userId), updateUser);
router.delete('/users/:id', protect, authorize('admin'), validate(authSchemas.userId), deleteUser);

export default router;
