import User from '../models/User.js';
import ErrorResponse from '../config/ErrorResponse.js';
import jwt from 'jsonwebtoken';
import { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail, sendPasswordChangeEmail } from '../utils/emailService.js';

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, address } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new ErrorResponse('User already exists with this email', 400));
    }

    // Create user (not verified yet)
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'user', // Default to 'user' if not specified
      phone,
      address,
      isEmailVerified: false
    });

    // Generate verification token
    const verificationToken = user.getEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    // Send verification email
    try {
      await sendVerificationEmail({
        email: user.email,
        name: user.name,
        token: verificationToken
      });

      res.status(201).json({
        success: true,
        message: 'Registration successful! Please check your email to verify your account.',
        data: {
          email: user.email,
          name: user.name
        }
      });
    } catch (emailError) {
      // If email fails, still create user but log error
      console.error('Failed to send verification email:', emailError);
      
      res.status(201).json({
        success: true,
        message: 'Registration successful! However, we couldn\'t send the verification email. Please request a new one.',
        data: {
          email: user.email,
          name: user.name
        }
      });
    }
  } catch (err) {
    next(err);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return next(new ErrorResponse('Please provide an email and password', 400));
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    // Check if account is locked
    if (user.isLocked()) {
      const lockTimeRemaining = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return next(new ErrorResponse(`Account is locked. Please try again in ${lockTimeRemaining} minutes`, 423));
    }

    // Check if user is active
    if (!user.isActive) {
      return next(new ErrorResponse('Your account has been deactivated', 403));
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return next(new ErrorResponse('Please verify your email before logging in. Check your inbox for the verification code.', 403));
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      // Increment login attempts
      await user.incLoginAttempts();
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
// @access  Private
export const updateDetails = async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      address: req.body.address
    };

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Request OTP for password change
// @route   POST /api/auth/request-password-change-otp
// @access  Private
export const requestPasswordChangeOtp = async (req, res, next) => {
  try {
    const { currentPassword } = req.body;
    
    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }

    // Verify current password
    if (!(await user.matchPassword(currentPassword))) {
      return next(new ErrorResponse('Current password is incorrect', 401));
    }

    // Generate OTP
    const changeToken = user.getChangePasswordToken();
    await user.save({ validateBeforeSave: false });

    // Send OTP email
    try {
      await sendPasswordChangeEmail({
        email: user.email,
        name: user.name,
        token: changeToken
      });

      res.status(200).json({
        success: true,
        message: 'Password change OTP sent to your email'
      });
    } catch (emailError) {
      user.changePasswordToken = undefined;
      user.changePasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return next(new ErrorResponse('Failed to send OTP email', 500));
    }
  } catch (err) {
    next(err);
  }
};

// @desc    Update password with OTP verification
// @route   PUT /api/auth/updatepassword
// @access  Private
export const updatePassword = async (req, res, next) => {
  try {
    const { otp, newPassword } = req.body;

    // Find user and include password and changePasswordToken fields
    const user = await User.findById(req.user.id)
      .select('+password +changePasswordToken +changePasswordExpire');

    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }

    // Verify OTP
    if (!user.changePasswordToken || user.changePasswordToken !== otp) {
      return next(new ErrorResponse('Invalid OTP', 400));
    }

    // Check if OTP is expired
    if (!user.changePasswordExpire || user.changePasswordExpire < Date.now()) {
      return next(new ErrorResponse('OTP has expired. Please request a new one', 400));
    }

    // Set new password
    user.password = newPassword;
    user.changePasswordToken = undefined;
    user.changePasswordExpire = undefined;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Get all users (Admin only)
// @route   GET /api/auth/users
// @access  Private/Admin
export const getUsers = async (req, res, next) => {
  try {
    const total = await User.countDocuments();
    const users = await User.find();

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      data: users
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single user (Admin only)
// @route   GET /api/auth/users/:id
// @access  Private/Admin
export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user (Admin only)
// @route   PUT /api/auth/users/:id
// @access  Private/Admin
export const updateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!user) {
      return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete user (Admin only)
// @route   DELETE /api/auth/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
    }

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Google OAuth callback
// @route   GET /api/auth/google/callback
// @access  Public
export const googleCallback = async (req, res, next) => {
  try {
    // User is authenticated by passport, send token response
    sendTokenResponse(req.user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Google OAuth token verification (for frontend)
// @route   POST /api/auth/google
// @access  Public
export const googleAuth = async (req, res, next) => {
  try {
    const { email, name, googleId, picture } = req.body;

    if (!email || !googleId) {
      return next(new ErrorResponse('Please provide email and Google ID', 400));
    }

    // Check if user exists with googleId
    let user = await User.findOne({ googleId });

    if (user) {
      // User exists, check if account is active
      if (!user.isActive) {
        return next(new ErrorResponse('Your account has been deactivated', 403));
      }
      return sendTokenResponse(user, 200, res);
    }

    // Check if user exists with same email (from regular registration)
    user = await User.findOne({ email });

    if (user) {
      // Link Google account to existing user and mark email as verified
      user.googleId = googleId;
      user.isEmailVerified = true; // Google has already verified the email
      if (picture) {
        user.profilePicture = picture;
      }
      await user.save();
      return sendTokenResponse(user, 200, res);
    }

    // Create new user with verified email (Google verified)
    user = await User.create({
      googleId,
      name,
      email,
      profilePicture: picture || null,
      isActive: true,
      isEmailVerified: true // Google has already verified the email
    });

    sendTokenResponse(user, 201, res);
  } catch (err) {
    next(err);
  }
};

// Helper function to get token from model, create cookie and send response
const sendTokenResponse = async (user, statusCode, res) => {
  // Create access token (short-lived)
  const accessToken = user.getSignedJwtToken();
  
  // Create refresh token (long-lived)
  const refreshToken = user.getSignedRefreshToken();
  
  // Save refresh token to database
  user.refreshToken = refreshToken;
  user.refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  await user.save({ validateBeforeSave: false });

  // Cookie options
  const accessTokenOptions = {
    expires: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/'
  };

  const refreshTokenOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/'
  };

  // Set cookies
  res.cookie('accessToken', accessToken, accessTokenOptions);
  res.cookie('refreshToken', refreshToken, refreshTokenOptions);

  res.status(statusCode).json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      address: user.address
    }
  });
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public (with refresh token)
export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return next(new ErrorResponse('No refresh token provided', 401));
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    } catch (err) {
      return next(new ErrorResponse('Invalid or expired refresh token', 401));
    }

    // Find user and check if refresh token matches
    const user = await User.findById(decoded.id).select('+refreshToken +refreshTokenExpiry');

    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }

    if (user.refreshToken !== refreshToken) {
      return next(new ErrorResponse('Invalid refresh token', 401));
    }

    if (user.refreshTokenExpiry < Date.now()) {
      return next(new ErrorResponse('Refresh token expired', 401));
    }

    // Generate new tokens
    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Logout user / clear cookies
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res, next) => {
  try {
    // Clear refresh token from database
    await User.findByIdAndUpdate(req.user.id, {
      refreshToken: null,
      refreshTokenExpiry: null
    });

    // Clear cookies
    res.cookie('accessToken', 'none', {
      expires: new Date(Date.now() + 1000),
      httpOnly: true
    });

    res.cookie('refreshToken', 'none', {
      expires: new Date(Date.now() + 1000),
      httpOnly: true
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Verify email with OTP
// @route   POST /api/auth/verify-email
// @access  Public
export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return next(new ErrorResponse('Please provide verification token', 400));
    }

    // Find user with matching token and unexpired token
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpire: { $gt: Date.now() }
    });

    if (!user) {
      return next(new ErrorResponse('Invalid or expired verification token', 400));
    }

    // Update user
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save({ validateBeforeSave: false });

    // Send welcome email (non-blocking)
    sendWelcomeEmail({
      email: user.email,
      name: user.name
    }).catch(err => console.error('Failed to send welcome email:', err));

    // Send token response to log user in
    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Resend email verification OTP
// @route   POST /api/auth/resend-verification
// @access  Public
export const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return next(new ErrorResponse('No user found with that email', 404));
    }

    if (user.isEmailVerified) {
      return next(new ErrorResponse('Email is already verified', 400));
    }

    // Generate new verification token
    const verificationToken = user.getEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    // Send verification email
    try {
      await sendVerificationEmail({
        email: user.email,
        name: user.name,
        token: verificationToken
      });

      res.status(200).json({
        success: true,
        message: 'Verification email sent successfully'
      });
    } catch (emailError) {
      user.emailVerificationToken = undefined;
      user.emailVerificationExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return next(new ErrorResponse('Email could not be sent', 500));
    }
  } catch (err) {
    next(err);
  }
};

// @desc    Forgot password - Send reset OTP
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return next(new ErrorResponse('No user found with that email', 404));
    }

    // Generate reset token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // Send reset email
    try {
      await sendPasswordResetEmail({
        email: user.email,
        name: user.name,
        token: resetToken
      });

      res.status(200).json({
        success: true,
        message: 'Password reset OTP sent to email'
      });
    } catch (emailError) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return next(new ErrorResponse('Email could not be sent', 500));
    }
  } catch (err) {
    next(err);
  }
};

// @desc    Reset password with OTP
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return next(new ErrorResponse('Please provide token and new password', 400));
    }

    // Find user with matching token and unexpired token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() }
    }).select('+password');

    if (!user) {
      return next(new ErrorResponse('Invalid or expired reset token', 400));
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    // Reset login attempts if any
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful. You can now login with your new password.'
    });
  } catch (err) {
    next(err);
  }
};
