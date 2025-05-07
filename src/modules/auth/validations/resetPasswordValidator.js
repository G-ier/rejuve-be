const Joi = require('joi');
const ApiError = require('../../../utils/apiError');

const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

const validateResetPassword = (data) => {
  const { error } = resetPasswordSchema.validate(data);
  if (error) {
    const errorMessage = error.details.map((e) => e.message).join(', ');
    throw new ApiError(400, `Validation Error: ${errorMessage}`);
  }
};

module.exports = validateResetPassword;