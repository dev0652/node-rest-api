// import mongoose from 'mongoose';
import { Schema, model } from 'mongoose';
import { handleSaveError, handleUpdateValidate } from './hooks.js';
import emailRegexp from '../constants/user-constants.js';

// ##############################################

// mongoose.Schema.Types.String.checkRequired((v) => v != null);

const userSchema = new Schema(
  {
    name: String,
    email: {
      type: String,
      set: (value) => value.toLowerCase(),
      required: [true, 'Email is a required field'],
      unique: true,
      match: emailRegexp,
    },
    password: {
      type: String,
      minlength: 6,
      required: [true, 'Password is a required field'],
    },
    avatarUrl: String,
    subscription: {
      type: String,
      enum: ['starter', 'pro', 'business'],
      default: 'starter',
    },
    token: String,
    verificationToken: {
      type: String,
      // required: [true, 'Verification token is missing'],
    },
    verify: {
      type: Boolean,
      default: false,
    },
  },
  { versionKey: false, timestamps: true }
);

userSchema.pre('findOneAndUpdate', handleUpdateValidate);

// Fired only if schema validation fails:
userSchema.post('save', handleSaveError);
userSchema.post('findOneAndUpdate', handleSaveError);

const User = model('user', userSchema);

export default User;
