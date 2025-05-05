const { validationResult } = require('express-validator');
const { ApiError } = require('../utils/ApiError');

// Validation middleware
const validate = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const extractedErrors = errors.array().map(err => ({
      field: err.param,
      message: err.msg
    }));

    throw new ApiError(400, 'Validation Error', false, extractedErrors);
  };
};

module.exports = validate; 