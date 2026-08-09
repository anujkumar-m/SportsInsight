const express = require('express');
const router = express.Router();
const {
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
  changePassword,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  validate,
} = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Public routes
router.post('/login', loginValidation, validate, login);
router.post('/logout', logout);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPasswordValidation, validate, forgotPassword);
router.post('/reset-password', resetPasswordValidation, validate, resetPassword);

// Protected routes
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.put('/change-password', authenticate, changePassword);

module.exports = router;

