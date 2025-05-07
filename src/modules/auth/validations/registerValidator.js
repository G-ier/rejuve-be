const Joi = require('joi');
const ApiError = require('../../../utils/apiError');

// Define the schema for validating register input
const registerValidator = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      'string.base': 'Email must be a string',
      'string.email': 'Invalid email format',
      'any.required': 'Email is required'
    }),
    password: Joi.string().min(6).required().messages({
      'string.base': 'Password must be a string',
      'string.min': 'Password must be at least 6 characters long',
      'any.required': 'Password is required'
    }),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
      'any.only': 'Passwords must match',
      'any.required': 'Confirm Password is required'
    })
  });

  // Validate the input data
  const { error, value } = schema.validate(data, { abortEarly: false });

  if (error) {
    // Format error messages to send to the client
    const errorMessages = error.details.map(err => err.message);
    throw new ApiError(400, errorMessages);  // Throwing a custom error with status code 400
  }

  return value;  // Return the validated data
};

module.exports = registerValidator;
