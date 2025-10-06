import ErrorResponse from '../config/ErrorResponse.js';

/**
 * Simple validation middleware that does no validation - just passes through
 * @param {Object} schema - Schema object (not used but kept for compatibility)
 * @returns {Function} Express middleware function
 */
export const validate = (schema) => {
  return (req, res, next) => {
    // No validation - just pass through
    next();
  };
};
