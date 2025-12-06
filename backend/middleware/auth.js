import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ErrorResponse from '../config/ErrorResponse.js';

// Protect routes - Verify JWT token from cookies or headers
export const protect = async (req, res, next) => {
  let token;

  // Check for token in cookies first (preferred method)
  if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }
  // Fallback to Authorization header for backwards compatibility
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Additional fallback for direct token in headers
  else if (req.headers['x-auth-token']) {
    token = req.headers['x-auth-token'];
  }

  // Make sure token exists
  if (!token) {
    console.log('No token found in request');
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return next(new ErrorResponse('User not found', 404));
    }

    if (!req.user.isActive) {
      return next(new ErrorResponse('User account is deactivated', 403));
    }

    next();
  } catch (err) {
    console.log('Token verification failed:', err.message);
    if (err.name === 'TokenExpiredError') {
      return next(new ErrorResponse('Token expired, please refresh your token', 401));
    }
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }
};

// Grant access to specific roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `User role '${req.user.role}' is not authorized to access this route`,
          403
        )
      );
    }
    next();
  };
};

// Grant access to volunteers and admins
export const authorizeVolunteerOrAdmin = (req, res, next) => {
  if (!['volunteer', 'admin'].includes(req.user.role)) {
    return next(
      new ErrorResponse(
        `User role '${req.user.role}' is not authorized to access this route`,
        403
      )
    );
  }
  next();
};
