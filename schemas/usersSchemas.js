import Joi from 'joi';
import emailRegexp from '../constants/user-constants.js';
// ####################################################

const registerSchema = Joi.object({
  name: Joi.string(),
  // email: Joi.string().email().required(),
  email: Joi.string().pattern(emailRegexp).required(),
  password: Joi.string().min(6).required(),
  avatarUrl: Joi.string(),
});

const loginSchema = Joi.object({
  email: Joi.string().pattern(emailRegexp).required(),
  password: Joi.string().min(6).required(),
});

const userEmailSchema = Joi.object({
  email: Joi.string()
    .pattern(emailRegexp)
    .message('Missing required field email')
    .required(),
});

export default { registerSchema, loginSchema, userEmailSchema };
