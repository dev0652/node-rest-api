// import 'dotenv/config'; // imported once in server.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';

import fs from 'fs/promises';
import path from 'path';

import gravatar from 'gravatar';
import Jimp from 'jimp';

import User from '../models/user.js';
import { controllerWrapper } from '../decorators/index.js';
import { HttpError } from '../helpers/index.js';
import { sendEmail } from '../services/index.js';

// ####################################################

const { BASE_URL, JWT_SECRET } = process.env;

// ********************************************************

// Error messages:
const emailErrorMsg = 'This email is already linked to an existing account';
const authErrorMsg = 'Invalid email or password';
const verifyEmailMsg = 'You need to verify your email first';

const makeVerificationEmail = (email, verificationToken) => ({
  to: email,
  subject: 'Verify your email',
  html: `Please follow <a href="${BASE_URL}/api/users/verify/${verificationToken}" target="_blank">this link</a> to verify your email.`,
});

// ********************************************************

// Create an account
const register = async (req, res) => {
  const { email, password } = req.body;

  // Check if a user with this email already exists:
  const user = await User.findOne({ email });
  if (user) throw HttpError(409, emailErrorMsg);

  const hashedPass = await bcrypt.hash(password, 10);
  const verificationToken = nanoid();
  const avatarUrl = gravatar.url(email, { size: '400' });

  const credentials = {
    ...req.body,
    password: hashedPass,
    verificationToken,
    avatarUrl,
  };
  const newUser = await User.create(credentials);

  const verificationEmail = makeVerificationEmail(email, verificationToken);
  sendEmail(verificationEmail);

  res.status(201).json({
    ...(newUser.name && { name: newUser.name }),
    email: newUser.email,
    subscription: newUser.subscription,
    avatarUrl: newUser.avatarUrl,
  });
};

// ********************************************************

// Verify user email
const verify = async (req, res) => {
  const { verificationToken } = req.params;

  const user = await User.findOne({ verificationToken });
  if (!user) throw HttpError(404, 'User not found');

  const id = user._id;

  await User.findByIdAndUpdate(id, {
    verify: true,
    verificationToken: '',
  });

  res.json({ message: 'Verification successful' });
};

// Resend verification email
const resendVerificationEmail = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) throw HttpError(404, 'User not found');
  if (user.verify) throw HttpError(404, 'Verification has already been passed');

  const verificationEmail = makeVerificationEmail(
    email,
    user.verificationToken
  );
  sendEmail(verificationEmail);

  res.json({ message: 'Verification email has been sent' });
};

// ********************************************************

// Log in
const login = async (req, res) => {
  const { email: reqEmail, password: reqPass } = req.body;

  const user = await User.findOne({ email: reqEmail });
  if (!user) throw HttpError(401, authErrorMsg);
  if (!user.verify) throw HttpError(401, verifyEmailMsg);

  const { email, subscription, password, id } = user;

  const isPasswordValid = await bcrypt.compare(reqPass, password); // As of bcryptjs 2.4.0, 'compare' returns a promise if callback (passed as the third argument) is omitted
  if (!isPasswordValid) throw HttpError(401, 'in isPasswordValid');

  const payload = { id };
  const secret = JWT_SECRET;
  const token = jwt.sign(payload, secret, { expiresIn: '23h' });

  await User.findByIdAndUpdate(id, { token });

  res.json({ token, user: { email, subscription } });
};

// ********************************************************

// Log out
const logout = async (req, res) => {
  const { _id: id } = req.user;
  await User.findByIdAndUpdate(id, { token: '' });

  res.json({ message: 'Signed out successfully' });
};

// ********************************************************

// Check if user is logged in
const getCurrent = (req, res) => {
  const { email, subscription } = req.user;

  res.json({ email, subscription });
};

// ********************************************************

// Update subscription type
const updateSubscription = async (req, res) => {
  const { subscription } = req.body;
  const { _id: id } = req.user;

  await User.findByIdAndUpdate(id, { subscription });

  let firstCharacter = subscription.charAt(0);
  firstCharacter = firstCharacter.toUpperCase();
  let capitalizedString = firstCharacter + subscription.slice(1);

  res.json({
    message: `Subscription has been updated to '${capitalizedString}'`,
  });
};

// ********************************************************

// Update avatar
const updateAvatar = async (req, res) => {
  const { _id } = req.user;

  const { path: oldPath, filename } = req.file;
  const avatarPath = path.resolve('public', 'avatars');
  const newPath = path.join(avatarPath, filename);

  Jimp.read(oldPath)
    .then((image) => {
      return image.resize(250, 250).write(newPath);
    })
    .catch((err) => {
      console.error(err);
    });

  await fs.unlink(oldPath);

  const avatar = path.join('avatars', filename); // 'public' is omitted because a middleware in app.js already tells Express to look for static files in the 'public' folder

  await User.findByIdAndUpdate(
    { _id: _id },
    { avatarUrl: avatar },
    { new: true }
  );
  res.status(200).json({ avatarUrl: avatar });
};

// ####################################################

export default {
  register: controllerWrapper(register),
  verify: controllerWrapper(verify),
  resendVerificationEmail: controllerWrapper(resendVerificationEmail),
  login: controllerWrapper(login),
  logout: controllerWrapper(logout),
  getCurrent: controllerWrapper(getCurrent),
  updateSubscription: controllerWrapper(updateSubscription),
  updateAvatar: controllerWrapper(updateAvatar),
};
