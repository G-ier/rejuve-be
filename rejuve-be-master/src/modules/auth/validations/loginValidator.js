const Joi = require('joi');

const loginSchema = Joi.object({
  email: Joi.string().min(3).max(30).required(),
  password: Joi.string().min(8).required(),
});

const validateLogin = (data) => {
  const { error } = loginSchema.validate(data);
  if (error) {
    // Create a detailed error message
    const errorMessage = error.details.map((e) => e.message).join(', ');

    throw new Error(`Validation Error: ${errorMessage}`);    
  }
};

module.exports = validateLogin;
